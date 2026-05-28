-- Migration 063: Admin mestre para desenvolvimento e testes manuais
-- Email: admin@livraria.com.br | Senha: Admin@123
-- Hash bcrypt (rounds=10): $2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG

BEGIN;

INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('admin') ON CONFLICT (pap_descricao) DO NOTHING;
INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('cliente') ON CONFLICT (pap_descricao) DO NOTHING;
INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('admin_sistema') ON CONFLICT (pap_descricao) DO NOTHING;

DO $$
DECLARE
    v_papel_admin INTEGER;
    v_papel_cliente INTEGER;
    v_papel_admin_sistema INTEGER;
    v_loj_id INTEGER;
    v_usu_id INTEGER;
BEGIN
    SELECT pap_id INTO v_papel_admin FROM livraria_gestao.papeis WHERE pap_descricao = 'admin' LIMIT 1;
    SELECT pap_id INTO v_papel_cliente FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente' LIMIT 1;
    SELECT pap_id INTO v_papel_admin_sistema FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema' LIMIT 1;

    IF v_papel_admin IS NULL OR v_papel_cliente IS NULL THEN
        RAISE EXCEPTION 'Papéis admin/cliente não encontrados após bootstrap.';
    END IF;

    SELECT loj_id INTO v_loj_id FROM livraria_gestao.lojas WHERE loj_ativo = TRUE ORDER BY loj_id LIMIT 1;

    IF v_loj_id IS NULL THEN
        INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
        VALUES (gen_random_uuid(), 'Livraria Padrão', 'livraria-padrao', '00.000.000/0001-00', TRUE)
        ON CONFLICT (loj_slug) DO NOTHING;

        SELECT loj_id INTO v_loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-padrao' LIMIT 1;
    END IF;

    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'Administrador Mestre',
        'admin@livraria.com.br',
        '000.000.000-00',
        '$2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG',
        v_papel_admin,
        TRUE,
        v_loj_id
    )
    ON CONFLICT (usu_email) DO UPDATE SET
        usu_senha_hash = EXCLUDED.usu_senha_hash,
        pap_id = EXCLUDED.pap_id,
        usu_ativo = TRUE,
        loj_id = COALESCE(livraria_gestao.usuarios.loj_id, EXCLUDED.loj_id);

    SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin@livraria.com.br' LIMIT 1;

    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id)
    VALUES (v_usu_id, v_papel_admin)
    ON CONFLICT (usu_id, pap_id) DO NOTHING;

    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id)
    VALUES (v_usu_id, v_papel_cliente)
    ON CONFLICT (usu_id, pap_id) DO NOTHING;

    IF v_papel_admin_sistema IS NOT NULL THEN
        INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id)
        VALUES (v_usu_id, v_papel_admin_sistema)
        ON CONFLICT (usu_id, pap_id) DO NOTHING;
    END IF;

    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
    VALUES (v_usu_id, v_loj_id, 'admin', TRUE, 'SISTEMA')
    ON CONFLICT (usu_id, loj_id) DO UPDATE SET adl_ativo = TRUE, adl_escopo = 'SISTEMA';

    RAISE NOTICE 'Admin mestre admin@livraria.com.br disponível (senha: Admin@123)';
END $$;

COMMIT;
