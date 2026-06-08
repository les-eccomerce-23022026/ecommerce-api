-- Migration 080: Admin de teste para validação de layout
-- Email: admin@teste.com.br | Senha: Admin@123
-- Este usuário tem papel admin com escopo SISTEMA para testar a página de análise de vendas

BEGIN;

DO $$
DECLARE
    v_papel_admin_sistema INTEGER;
    v_loj_id INTEGER;
    v_usu_id INTEGER;
BEGIN
    -- Buscar ou criar papel admin_sistema
    SELECT pap_id INTO v_papel_admin_sistema FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema' LIMIT 1;
    
    IF v_papel_admin_sistema IS NULL THEN
        INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('admin_sistema') RETURNING pap_id INTO v_papel_admin_sistema;
    END IF;

    -- Buscar loja ativa
    SELECT loj_id INTO v_loj_id FROM livraria_gestao.lojas WHERE loj_ativo = TRUE ORDER BY loj_id LIMIT 1;

    IF v_loj_id IS NULL THEN
        INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
        VALUES (gen_random_uuid(), 'Livraria Teste', 'livraria-teste', '99.999.999/0001-99', TRUE)
        RETURNING loj_id INTO v_loj_id;
    END IF;

    -- Criar usuário admin de teste
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_telefone_rapido
    )
    VALUES (
        gen_random_uuid(),
        'Admin Teste Layout',
        'admin@teste.com.br',
        '888.888.888-88',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Admin@123
        v_papel_admin_sistema,
        TRUE,
        v_loj_id,
        'PF',
        '(11) 99999-9999'
    )
    ON CONFLICT (usu_email) DO UPDATE SET
        usu_senha_hash = EXCLUDED.usu_senha_hash,
        pap_id = EXCLUDED.pap_id,
        usu_ativo = TRUE,
        loj_id = EXCLUDED.loj_id;

    SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin@teste.com.br' LIMIT 1;

    -- Vincular papel admin_sistema
    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
    VALUES (v_usu_id, v_papel_admin_sistema, TRUE, NOW(), NOW())
    ON CONFLICT (usu_id, pap_id) DO UPDATE SET usp_ativo = TRUE;

    -- Escopo SISTEMA em admin_lojas
    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
    VALUES (v_usu_id, v_loj_id, 'admin_sistema', TRUE, 'SISTEMA')
    ON CONFLICT (usu_id, loj_id) DO UPDATE SET
        adl_papel = EXCLUDED.adl_papel,
        adl_ativo = TRUE,
        adl_escopo = 'SISTEMA';

    RAISE NOTICE 'Admin de teste criado: admin@teste.com.br (senha: Admin@123)';
    RAISE NOTICE 'Escopo: SISTEMA (acesso a todas as lojas)';
END $$;

COMMIT;
