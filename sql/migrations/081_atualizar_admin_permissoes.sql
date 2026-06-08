-- Migration 081: Atualizar usuário admin@livraria.com.br para ter permissões de admin_sistema
-- Email: admin@livraria.com.br | Senha: password123 (já existe e funciona)
-- Este script adiciona permissões de admin_sistema ao usuário existente

BEGIN;

DO $$
DECLARE
    v_papel_admin_sistema INTEGER;
    v_papel_admin INTEGER;
    v_loj_id INTEGER;
    v_usu_id INTEGER;
BEGIN
    -- Buscar papéis
    SELECT pap_id INTO v_papel_admin_sistema FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema' LIMIT 1;
    SELECT pap_id INTO v_papel_admin FROM livraria_gestao.papeis WHERE pap_descricao = 'admin' LIMIT 1;
    
    IF v_papel_admin_sistema IS NULL THEN
        INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('admin_sistema') RETURNING pap_id INTO v_papel_admin_sistema;
    END IF;

    IF v_papel_admin IS NULL THEN
        INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('admin') RETURNING pap_id INTO v_papel_admin;
    END IF;

    -- Buscar usuário admin@livraria.com.br
    SELECT usu_id, loj_id INTO v_usu_id, v_loj_id 
    FROM livraria_gestao.usuarios 
    WHERE usu_email = 'admin@livraria.com.br' 
    LIMIT 1;

    IF v_usu_id IS NULL THEN
        RAISE EXCEPTION 'Usuário admin@livraria.com.br não encontrado';
    END IF;

    -- Adicionar papel admin_sistema
    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
    VALUES (v_usu_id, v_papel_admin_sistema, TRUE, NOW(), NOW())
    ON CONFLICT (usu_id, pap_id) DO UPDATE SET usp_ativo = TRUE;

    -- Adicionar papel admin (se não tiver)
    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
    VALUES (v_usu_id, v_papel_admin, TRUE, NOW(), NOW())
    ON CONFLICT (usu_id, pap_id) DO UPDATE SET usp_ativo = TRUE;

    -- Escopo SISTEMA em admin_lojas
    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
    VALUES (v_usu_id, v_loj_id, 'admin_sistema', TRUE, 'SISTEMA')
    ON CONFLICT (usu_id, loj_id) DO UPDATE SET
        adl_papel = EXCLUDED.adl_papel,
        adl_ativo = TRUE,
        adl_escopo = 'SISTEMA';

    RAISE NOTICE 'Usuário admin@livraria.com.br atualizado com permissões de admin_sistema';
    RAISE NOTICE 'Escopo: SISTEMA (acesso a todas as lojas)';
END $$;

COMMIT;
