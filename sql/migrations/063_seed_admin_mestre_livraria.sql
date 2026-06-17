-- =============================================================================
-- Migration 063: Admin de Sistema para desenvolvimento e testes manuais
-- =============================================================================
-- ATENÇÃO: Este script foi DESATIVADO.
-- O conceito de "Administrador do Sistema" (admin_sistema) foi removido.
--
-- O sistema agora usa apenas:
-- - PAPEL_ADMIN (escopo LOJA) - Administrador de loja com acesso restrito à loja atribuída
-- - PAPEL_CLIENTE - Cliente com acesso limitado aos próprios dados
--
-- Para criar administradores de loja, use:
-- - sql/modelagem-dados/dml/003_seed_multi_tenant_completo.sql
--
-- Este script está desativado para manter consistência com o documento
-- MAPEAMENTO-ROTAS-VENDA-TROCAS-DEVOLUCOES.md
-- =============================================================================

-- Script desativado - não executar
-- RAISE NOTICE 'Script 063_seed_admin_mestre_livraria.sql desativado. Use 003_seed_multi_tenant_completo.sql em vez disso.';

-- =============================================================================
-- CONTEÚDO DO SCRIPT COMENTADO - NÃO EXECUTAR
-- =============================================================================

-- BEGIN;

-- INSERT INTO livraria_gestao.papeis (pap_descricao) VALUES ('admin_sistema') ON CONFLICT (pap_descricao) DO NOTHING;

-- DO $$
-- DECLARE
--     v_papel_admin_sistema INTEGER;
--     v_loj_id INTEGER;
--     v_usu_id INTEGER;
-- BEGIN
--     SELECT pap_id INTO v_papel_admin_sistema FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema' LIMIT 1;

--     IF v_papel_admin_sistema IS NULL THEN
--         RAISE EXCEPTION 'Papel admin_sistema não encontrado após bootstrap.';
--     END IF;

--     SELECT loj_id INTO v_loj_id FROM livraria_gestao.lojas WHERE loj_ativo = TRUE ORDER BY loj_id LIMIT 1;

--     IF v_loj_id IS NULL THEN
--         INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
--         VALUES (gen_random_uuid(), 'Livraria Padrão', 'livraria-padrao', '00.000.000/0001-00', TRUE)
--         ON CONFLICT (loj_slug) DO NOTHING;

--         SELECT loj_id INTO v_loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-padrao' LIMIT 1;
--     END IF;

--     INSERT INTO livraria_gestao.usuarios (
--         usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
--         pap_id, usu_ativo, loj_id
--     )
--     VALUES (
--         gen_random_uuid(),
--         'Administrador do Sistema',
--         'admin.sistema@les.demo.br',
--         '000.000.000-00',
--         '$2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG',
--         v_papel_admin_sistema,
--         TRUE,
--         v_loj_id
--     )
--     ON CONFLICT (usu_email) DO UPDATE SET
--         usu_senha_hash = EXCLUDED.usu_senha_hash,
--         pap_id = EXCLUDED.pap_id,
--         usu_ativo = TRUE,
--         loj_id = COALESCE(livraria_gestao.usuarios.loj_id, EXCLUDED.loj_id);

--     SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin.sistema@les.demo.br' LIMIT 1;

--     -- Apenas papel admin_sistema (sem admin de loja, sem cliente)
--     INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id)
--     VALUES (v_usu_id, v_papel_admin_sistema)
--     ON CONFLICT (usu_id, pap_id) DO NOTHING;

--     -- Remover papéis incorretos se existirem (admin de loja, cliente)
--     DELETE FROM livraria_gestao.usuario_papeis
--     WHERE usu_id = v_usu_id
--       AND pap_id IN (
--           SELECT pap_id FROM livraria_gestao.papeis
--           WHERE pap_descricao IN ('admin', 'cliente')
--       );

--     -- Escopo SISTEMA em admin_lojas
--     INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
--     VALUES (v_usu_id, v_loj_id, 'admin_sistema', TRUE, 'SISTEMA')
--     ON CONFLICT (usu_id, loj_id) DO UPDATE SET
--         adl_papel = EXCLUDED.adl_papel,
--         adl_ativo = TRUE,
--         adl_escopo = 'SISTEMA';

--     RAISE NOTICE 'Admin de sistema admin.sistema@les.demo.br disponível (senha: AdminSistema@123)';
--     RAISE NOTICE 'Escopo: SISTEMA (acesso a todas as lojas)';
-- END $$;

-- COMMIT;
