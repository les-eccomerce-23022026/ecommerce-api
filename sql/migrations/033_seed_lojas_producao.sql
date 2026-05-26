-- Seed: 033_seed_lojas_producao.sql
-- Descrição: Seed de produção para multi-tenancy (apenas estrutura, sem dados)
-- Ambiente: Produção
-- Autor: Senior DBA
-- Data: 2026-05-18

BEGIN;

-- ============================================
-- RESUMO DO SEED DE PRODUÇÃO
-- ============================================
-- ✅ Apenas estrutura criada (tabelas lojas e admin_lojas vazias)
-- ✅ Loja padrão (loj_id = 1) mantida para dados existentes migrados
-- ✅ Sem dados sintéticos (dados criados via aplicação)
-- ✅ Ambiente de produção limpo e pronto para uso real

-- NOTA: Este seed não cria dados sintéticos.
-- Em produção, as lojas devem ser criadas via aplicação.
-- A migration 030 já criou a loja padrão (loj_id = 1)
-- e migrou dados existentes para ela.

-- Se necessário criar uma loja inicial para produção,
-- use a aplicação ou execute manualmente:
-- INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_ativo)
-- VALUES (gen_random_uuid(), 'Loja Inicial', 'loja-inicial', TRUE);

COMMIT;
