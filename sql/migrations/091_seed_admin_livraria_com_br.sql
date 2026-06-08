-- Migration 091: Seed do usuário admin@livraria.com.br para testes E2E Cypress
-- Email: admin@livraria.com.br | Senha: password123
-- Hash bcrypt para "password123" (rounds=10): $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- Este usuário é necessário para os cenários 5-10 dos testes E2E da Entrega 7

BEGIN;

DO $$
DECLARE
    v_admin_id BIGINT;
    v_papel_admin_sistema_id INTEGER;
    v_papel_admin_id INTEGER;
    v_loja_padrao_id BIGINT;
BEGIN
    -- Buscar ID do papel admin_sistema
    SELECT pap_id INTO v_papel_admin_sistema_id
    FROM livraria_gestao.papeis
    WHERE pap_descricao = 'admin_sistema'
    LIMIT 1;

    IF v_papel_admin_sistema_id IS NULL THEN
        RAISE EXCEPTION 'Papel admin_sistema não encontrado na tabela papeis';
    END IF;

    -- Buscar ID do papel admin
    SELECT pap_id INTO v_papel_admin_id
    FROM livraria_gestao.papeis
    WHERE pap_descricao = 'admin'
    LIMIT 1;

    IF v_papel_admin_id IS NULL THEN
        RAISE EXCEPTION 'Papel admin não encontrado na tabela papeis';
    END IF;

    -- Buscar ID da Loja Padrão pelo UUID fixo
    SELECT loj_id INTO v_loja_padrao_id
    FROM livraria_gestao.lojas
    WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'
    LIMIT 1;

    IF v_loja_padrao_id IS NULL THEN
        -- Se não encontrar pela UUID, buscar qualquer loja ativa
        SELECT loj_id INTO v_loja_padrao_id
        FROM livraria_gestao.lojas
        WHERE loj_ativo = TRUE
        ORDER BY loj_id
        LIMIT 1;
    END IF;

    IF v_loja_padrao_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma loja ativa encontrada. Execute seeds de lojas primeiro.';
    END IF;

    -- Criar usuário admin com senha password123
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid,
        usu_nome,
        usu_email,
        usu_cpf,
        usu_senha_hash,
        pap_id,
        usu_ativo,
        loj_id,
        usu_tipo_pessoa,
        usu_telefone_rapido
    )
    VALUES (
        gen_random_uuid(),
        'Admin Livraria',
        'admin@livraria.com.br',
        '123.456.789-00',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Senha: password123
        v_papel_admin_sistema_id,
        TRUE,
        v_loja_padrao_id,
        'PF',
        '(11) 99999-0000'
    )
    ON CONFLICT (usu_email) DO UPDATE SET
        usu_senha_hash = EXCLUDED.usu_senha_hash,
        usu_ativo = TRUE,
        loj_id = EXCLUDED.loj_id
    RETURNING usu_id INTO v_admin_id;

    -- Se o usuário já existia, buscar seu ID
    IF v_admin_id IS NULL THEN
        SELECT usu_id INTO v_admin_id
        FROM livraria_gestao.usuarios
        WHERE usu_email = 'admin@livraria.com.br';
    END IF;

    -- Vincular admin à Loja Padrão com escopo SISTEMA
    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
    VALUES (v_admin_id, v_loja_padrao_id, 'admin_sistema', TRUE, 'SISTEMA')
    ON CONFLICT (usu_id, loj_id) DO UPDATE SET
        adl_papel = EXCLUDED.adl_papel,
        adl_ativo = TRUE,
        adl_escopo = EXCLUDED.adl_escopo;

    -- Inserir papel admin_sistema na tabela usuario_papeis
    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
    VALUES (v_admin_id, v_papel_admin_sistema_id, TRUE, NOW(), NOW())
    ON CONFLICT (usu_id, pap_id) DO UPDATE SET
        usp_ativo = TRUE,
        usp_atualizado_em = NOW();

    -- Inserir papel admin na tabela usuario_papeis
    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
    VALUES (v_admin_id, v_papel_admin_id, TRUE, NOW(), NOW())
    ON CONFLICT (usu_id, pap_id) DO UPDATE SET
        usp_ativo = TRUE,
        usp_atualizado_em = NOW();

    RAISE NOTICE 'Admin de teste criado: admin@livraria.com.br (senha: password123)';
    RAISE NOTICE 'Escopo: SISTEMA (acesso a todas as lojas)';
    RAISE NOTICE 'Loja Padrão: loj_id=%', v_loja_padrao_id;
END $$;

COMMIT;
