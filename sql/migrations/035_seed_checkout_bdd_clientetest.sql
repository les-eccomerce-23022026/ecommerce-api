-- Migration 035: Dados de checkout para clientetest@email.com (cenários BDD 7ª entrega)
-- Endereço, cartão e bandeiras necessários para finalizar compra

BEGIN;

-- Bandeiras de cartão (RN0025)
INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao, ban_uuid)
VALUES
    ('Visa', 'd30d587f-8140-469d-a5fc-8e0c998c72f4'),
    ('Mastercard', 'd6eac520-7651-4ae9-84d5-b0bbf269be2e'),
    ('Elo', '21317eba-311d-4bb8-9054-6debff64f2da'),
    ('American Express', '01fd90d0-0c72-4787-8667-965b2c39f75f'),
    ('Hipercard', '02cacd79-1ec5-44c5-9142-486cb4bc82f1')
ON CONFLICT (ban_descricao) DO UPDATE SET ban_uuid = EXCLUDED.ban_uuid;

DO $$
DECLARE
    v_usu_id           BIGINT;
    v_loj_id           BIGINT := 1;
    v_tre_id           INTEGER;
    v_tlo_id           INTEGER;
    v_log_id           INTEGER;
    v_cid_id           INTEGER;
    v_bai_id           INTEGER;
    v_cep_numero      VARCHAR(8);
    v_pai_id           INTEGER;
    v_ban_visa_id      INTEGER;
BEGIN
    SELECT usu_id INTO v_usu_id
    FROM livraria_gestao.usuarios
    WHERE usu_email = 'clientetest@email.com';

    IF v_usu_id IS NULL THEN
        RAISE NOTICE 'Usuário clientetest@email.com não encontrado em livraria_gestao.usuarios — seed ignorado';
        RETURN;
    END IF;

    -- Perfil de cliente (opcional para GET /clientes/perfil)
    INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, loj_id)
    VALUES (v_usu_id, 'nao_informado', v_loj_id)
    ON CONFLICT (usu_id) DO NOTHING;

    -- Referências de endereço (idempotente; dados podem já existir do DML 008)
    IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Casa') THEN
        INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Casa');
    END IF;
    SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Casa';

    IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Avenida') THEN
        INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Avenida');
    END IF;
    SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Avenida';

    IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN
        INSERT INTO livraria_ref.paises (pai_nome) VALUES ('Brasil');
    END IF;
    SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'SP') THEN
        INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('São Paulo', 'SP');
    END IF;

    SELECT cid_id INTO v_cid_id
    FROM livraria_ref.cidades c
    JOIN livraria_ref.estados e ON c.est_id = e.est_id
    WHERE c.cid_nome_norm = 'SAO PAULO' AND e.est_sigla = 'SP';

    IF v_cid_id IS NULL THEN
        INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
        SELECT 'São Paulo', 'SAO PAULO', est_id FROM livraria_ref.estados WHERE est_sigla = 'SP'
        RETURNING cid_id INTO v_cid_id;
    END IF;

    SELECT bai_id INTO v_bai_id
    FROM livraria_ref.bairros
    WHERE bai_nome_norm = 'BELA VISTA' AND cid_id = v_cid_id;

    IF v_bai_id IS NULL THEN
        INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
        VALUES ('Bela Vista', 'BELA VISTA', v_cid_id)
        RETURNING bai_id INTO v_bai_id;
    END IF;

    SELECT cep_numero INTO v_cep_numero FROM livraria_ref.ceps WHERE cep_numero = '01310100';

    IF v_cep_numero IS NULL THEN
        INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id)
        VALUES ('01310100', v_cid_id, v_bai_id);
        v_cep_numero := '01310100';
    END IF;

    SELECT log_id INTO v_log_id
    FROM livraria_ref.logradouros
    WHERE log_nome = 'Paulista' AND tlo_id = v_tlo_id;

    IF v_log_id IS NULL THEN
        INSERT INTO livraria_ref.logradouros (tlo_id, log_nome)
        VALUES (v_tlo_id, 'Paulista')
        RETURNING log_id INTO v_log_id;
    END IF;

    -- Endereço principal de entrega
    IF NOT EXISTS (
        SELECT 1 FROM livraria_gestao.enderecos
        WHERE usu_id = v_usu_id AND end_principal = TRUE
    ) THEN
        INSERT INTO livraria_gestao.enderecos (
            usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento,
            cid_id, bai_id, cep_numero, pai_id, end_principal, loj_id
        ) VALUES (
            v_usu_id, 'entrega', 'Casa', v_tre_id, v_log_id, '1000', 'Apto 10',
            v_cid_id, v_bai_id, v_cep_numero, v_pai_id, TRUE, v_loj_id
        );
    END IF;

    -- Cartão Visa principal (split / checkout)
    SELECT ban_id INTO v_ban_visa_id
    FROM livraria_financeiro.bandeiras_cartao
    WHERE ban_descricao = 'Visa'
    LIMIT 1;

    IF v_ban_visa_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM livraria_financeiro.cartoes
        WHERE usu_id = v_usu_id AND crt_final = '0002'
    ) THEN
        INSERT INTO livraria_financeiro.cartoes (
            usu_id, ban_id, crt_token, crt_final, crt_nome_impresso, crt_validade, crt_principal
        ) VALUES (
            v_usu_id, v_ban_visa_id,
            'tok_sim_e2e_primeiro_cartao_visa0002',
            '0002', 'CLIENTE TESTE VISA', DATE '2029-06-01', TRUE
        );
    END IF;

    RAISE NOTICE 'Seed checkout BDD aplicado para usu_id=%', v_usu_id;
END $$;

COMMIT;
