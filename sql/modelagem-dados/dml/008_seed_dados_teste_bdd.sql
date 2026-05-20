-- =============================================================================
-- DML 008 — Seed de dados de teste para BDD (7ª Entrega)
-- Cria dados de referência e endereços para os usuários de teste
-- =============================================================================

-- Criar estado de São Paulo se não existir
INSERT INTO livraria_ref.estados (est_sigla, est_nome)
VALUES ('SP', 'São Paulo')
ON CONFLICT (est_nome) DO NOTHING;

-- Criar cidade de São Paulo se não existir
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
VALUES ('São Paulo', 'SAO PAULO', 1)
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Criar bairro de teste se não existir
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome_norm = 'SAO PAULO'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Criar tipo de logradouro: Rua se não existir
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao)
VALUES ('Rua')
ON CONFLICT (tlo_descricao) DO NOTHING;

-- Criar logradouro de teste se não existir
INSERT INTO livraria_ref.logradouros (tlo_id, log_nome)
SELECT tlo_id, 'Paulista' FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua'
ON CONFLICT (tlo_id, log_nome) DO NOTHING;

-- Criar CEP de teste (8 dígitos numéricos) se não existir
INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id)
SELECT '01310100', c.cid_id, b.bai_id 
FROM livraria_ref.cidades c, livraria_ref.bairros b 
WHERE c.cid_nome_norm = 'SAO PAULO' AND b.bai_nome_norm = 'CENTRO'
ON CONFLICT (cep_numero) DO NOTHING;

-- Os usuários de teste já são criados pelo seed 005 em livraria_gestao.usuarios
-- Este seed apenas cria endereços e dados adicionais

DO $$
DECLARE
    v_id_usuario_cli   BIGINT;
    v_id_usuario_admin BIGINT;
    v_id_loja          BIGINT;
    v_id_bairro        BIGINT;
    v_id_cep           CHAR(8);
    v_id_endereco_cli  BIGINT;
    v_id_pagamento     BIGINT;
BEGIN
    -- Obter IDs dos usuários de teste do schema livraria_gestao (criados pelo seed 005)
    SELECT usu_id INTO v_id_usuario_cli FROM livraria_gestao.usuarios WHERE usu_email = 'clientetest@email.com';
    SELECT usu_id INTO v_id_usuario_admin FROM livraria_gestao.usuarios WHERE usu_email = 'admintest@email.com';
    
    -- Obter ID da loja padrão (usar valor fixo 1 para ambiente de teste)
    v_id_loja := 1;

    -- Obter ID do bairro e CEP
    SELECT bai_id INTO v_id_bairro FROM livraria_ref.bairros WHERE bai_nome_norm = 'CENTRO' LIMIT 1;
    SELECT cep_numero INTO v_id_cep FROM livraria_ref.ceps WHERE cep_numero = '01310100' LIMIT 1;

    -- Verificar se endereço já existe para o cliente
    SELECT end_id INTO v_id_endereco_cli FROM livraria_gestao.enderecos 
    WHERE usu_id = v_id_usuario_cli AND end_principal = TRUE;

    -- Criar endereço para o cliente de teste se não existir
    IF v_id_endereco_cli IS NULL THEN
        INSERT INTO livraria_gestao.enderecos (
            usu_id,
            end_tipo,
            end_apelido,
            tre_id,
            log_id,
            end_numero,
            end_complemento,
            cid_id,
            bai_id,
            cep_id,
            pai_id,
            end_principal,
            loj_id
        )
        VALUES (
            v_id_usuario_cli,
            'entrega',
            'Casa',
            NULL,  -- Tipo de residência (opcional)
            1,     -- Logradouro de teste
            '123',
            'Apto 101',
            1,     -- Cidade de teste
            v_id_bairro,     -- Bairro de teste
            v_id_cep,     -- CEP de teste
            1,     -- País: Brasil
            TRUE,
            v_id_loja
        )
        RETURNING end_id INTO v_id_endereco_cli;
    END IF;

    -- Criar endereço para o admin de teste se não existir
    IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_id_usuario_admin AND end_principal = TRUE) THEN
        INSERT INTO livraria_gestao.enderecos (
            usu_id,
            end_tipo,
            end_apelido,
            tre_id,
            log_id,
            end_numero,
            end_complemento,
            cid_id,
            bai_id,
            cep_id,
            pai_id,
            end_principal,
            loj_id
        )
        VALUES (
            v_id_usuario_admin,
            'entrega',
            'Casa',
            NULL,
            1,
            '456',
            '',
            1,
            v_id_bairro,
            v_id_cep,
            1,
            TRUE,
            v_id_loja
        );
    END IF;

    RAISE NOTICE 'Dados de teste criados com sucesso:';
    RAISE NOTICE 'Usuário Cliente ID: %', v_id_usuario_cli;
    RAISE NOTICE 'Usuário Admin ID: %', v_id_usuario_admin;
    RAISE NOTICE 'Loja ID: %', v_id_loja;
    RAISE NOTICE 'Endereço Cliente ID: %', v_id_endereco_cli;
END;
$$;
