-- Seed: 031_seed_lojas_desenvolvimento.sql
-- Descrição: Seed de desenvolvimento para multi-tenancy com dados sintéticos
-- Ambiente: Desenvolvimento
-- Autor: Senior DBA
-- Data: 2026-05-18

BEGIN;

-- ============================================
-- PASSO 1: Criar lojas sintéticas para desenvolvimento
-- ============================================
INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_ativo) VALUES
  (gen_random_uuid(), 'Livraria Central', 'livraria-central', TRUE),
  (gen_random_uuid(), 'Livraria Online', 'livraria-online', TRUE),
  (gen_random_uuid(), 'Livraria Tech', 'livraria-tech', TRUE),
  (gen_random_uuid(), 'Livraria Kids', 'livraria-kids', TRUE)
ON CONFLICT (loj_slug) DO NOTHING;

-- ============================================
-- PASSO 2: Vincular admins às lojas (admin_lojas)
-- ============================================
-- Obter IDs das lojas criadas
DO $$
DECLARE
  v_loja_central BIGINT;
  v_loja_online BIGINT;
  v_loja_tech BIGINT;
  v_loja_kids BIGINT;
  v_admin_id BIGINT;
BEGIN
  -- Buscar IDs das lojas
  SELECT loj_id INTO v_loja_central FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-central';
  SELECT loj_id INTO v_loja_online FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-online';
  SELECT loj_id INTO v_loja_tech FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-tech';
  SELECT loj_id INTO v_loja_kids FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-kids';
  
  -- Buscar primeiro admin (assumindo que existe)
  SELECT usu_id INTO v_admin_id FROM livraria_gestao.usuarios LIMIT 1;
  
  -- Se existir admin, vincular às lojas
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo)
    VALUES
      (v_admin_id, v_loja_central, 'admin_principal', TRUE),
      (v_admin_id, v_loja_online, 'admin_principal', TRUE),
      (v_admin_id, v_loja_tech, 'admin_estoque', TRUE),
      (v_admin_id, v_loja_kids, 'admin_vendas', TRUE)
    ON CONFLICT (usu_id, loj_id) DO NOTHING;
    
    RAISE NOTICE 'Admin % vinculado às lojas de desenvolvimento', v_admin_id;
  ELSE
    RAISE NOTICE 'Nenhum admin encontrado para vincular às lojas';
  END IF;
END $$;

-- ============================================
-- PASSO 3: Criar estoques por loja para livros existentes
-- ============================================
-- Para cada loja, criar estoques para os livros existentes
-- Assumindo que já existem livros na tabela livraria_comercial.livros
DO $$
DECLARE
  v_livro RECORD;
  v_loja RECORD;
  v_preco_base NUMERIC := 49.90;
  v_quantidade_base INTEGER := 100;
BEGIN
  -- Para cada livro
  FOR v_livro IN SELECT liv_id FROM livraria_comercial.livros LOOP
    -- Para cada loja (exceto loja padrão que já tem estoques)
    FOR v_loja IN SELECT loj_id FROM livraria_gestao.lojas WHERE loj_id > 1 LOOP
      -- Inserir estoque com preço e quantidade variados por loja
      INSERT INTO livraria_comercial.estoques (
        liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
        etq_criado_em, etq_atualizado_em
      )
      VALUES (
        v_livro.liv_id,
        v_loja.loj_id,
        v_quantidade_base + (v_loja.loj_id * 10), -- Quantidade variada por loja
        v_preco_base + (v_loja.loj_id * 5.00), -- Preço variado por loja
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Estoques criados para todas as lojas de desenvolvimento';
END $$;

-- ============================================
-- RESUMO DO SEED
-- ============================================
-- ✅ 4 lojas sintéticas criadas (livraria-central, livraria-online, livraria-tech, livraria-kids)
-- ✅ Admin vinculado às lojas via admin_lojas
-- ✅ Estoques criados para cada loja (preços e quantidades variados)
-- ✅ Loja padrão (loj_id = 1) mantida para dados existentes

COMMIT;
