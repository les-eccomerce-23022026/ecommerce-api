-- Migration: 025_seed_enderecos_usuario_teste.sql
-- Descrição: Adiciona endereço para o usuário de teste (clientetest@email.com) para permitir testes de checkout.
-- Data: 2026-04-28

DO $$
DECLARE
    v_id_usuario BIGINT;
    v_id_tipo_residencia INTEGER;
    v_id_tipo_logradouro INTEGER;
    v_id_cidade INTEGER;
    v_id_bairro INTEGER;
    v_id_cep CHAR(8);
BEGIN
    -- Busca o usuário
    SELECT usu_id INTO v_id_usuario FROM livraria_gestao.usuarios WHERE usu_email = 'clientetest@email.com';

    IF v_id_usuario IS NOT NULL THEN
        -- Busca/Insere tipos de referência (garantindo que existem)
        INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Casa') ON CONFLICT DO NOTHING;
        SELECT tre_id INTO v_id_tipo_residencia FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Casa';

        INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Avenida') ON CONFLICT DO NOTHING;
        SELECT tlo_id INTO v_id_tipo_logradouro FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Avenida';

        -- Insere cidade/bairro/cep (estrutura normalizada)
        INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA') ON CONFLICT DO NOTHING;

        INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('São Paulo', 'SP') ON CONFLICT DO NOTHING;

        INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
        SELECT 'São Paulo', 'SÃO PAULO', est_id FROM livraria_ref.estados WHERE est_sigla = 'SP'
        ON CONFLICT DO NOTHING;
        SELECT cid_id INTO v_id_cidade FROM livraria_ref.cidades WHERE cid_nome_norm = 'SÃO PAULO';

        INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Bela Vista', 'BELA VISTA', v_id_cidade) ON CONFLICT DO NOTHING;
        SELECT bai_id INTO v_id_bairro FROM livraria_ref.bairros WHERE bai_nome_norm = 'BELA VISTA' AND cid_id = v_id_cidade;

        INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('01310100', v_id_cidade, v_id_bairro) ON CONFLICT DO NOTHING;
        SELECT cep_numero INTO v_id_cep FROM livraria_ref.ceps WHERE cep_numero = '01310100';

        INSERT INTO livraria_ref.logradouros (log_nome, tlo_id) VALUES ('Paulista', v_id_tipo_logradouro) ON CONFLICT DO NOTHING;

        -- Insere o endereço
        INSERT INTO livraria_gestao.enderecos (
            usu_id, tre_id, log_id, end_numero, end_complemento,
            bai_id, cid_id, cep_id, end_apelido, end_tipo, end_principal
        )
        SELECT
            v_id_usuario,
            v_id_tipo_residencia,
            (SELECT log_id FROM livraria_ref.logradouros WHERE log_nome = 'Paulista' LIMIT 1),
            '1000',
            'Apto 10',
            v_id_bairro,
            v_id_cidade,
            v_id_cep,
            'Casa',
            'entrega',
            TRUE
        WHERE NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_id_usuario);
    END IF;
END;
$$;
