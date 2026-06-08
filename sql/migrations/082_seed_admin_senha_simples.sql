-- Migration 082: Admin com senha simples para teste manual
-- Email: admin@simples.com.br | Senha: 123456
-- Hash bcrypt para "123456" (rounds=10): $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

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

    -- Criar usuário admin com senha simples
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_telefone_rapido
    )
    VALUES (
        gen_random_uuid(),
        'Admin Senha Simples',
        'admin@simples.com.br',
        '777.777.777-77',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Senha: 123456
        v_papel_admin_sistema,
        TRUE,
        v_loj_id,
        'PF',
        '(11) 77777-7777'
    )
    ON CONFLICT (usu_email) DO UPDATE SET
        usu_senha_hash = EXCLUDED.usu_senha_hash,
        pap_id = EXCLUDED.pap_id,
        usu_ativo = TRUE,
        loj_id = EXCLUDED.loj_id;

    SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin@simples.com.br' LIMIT 1;

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

    RAISE NOTICE 'Admin com senha simples criado: admin@simples.com.br (senha: 123456)';
    RAISE NOTICE 'Escopo: SISTEMA (acesso a todas as lojas)';
END $$;

COMMIT;
