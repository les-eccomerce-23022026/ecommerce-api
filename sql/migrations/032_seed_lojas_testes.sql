-- Seed: 032_seed_lojas_testes.sql
-- Descrição: Seed de testes para multi-tenancy com dados mínimos
-- Ambiente: Testes
-- Autor: Senior DBA
-- Data: 2026-05-18

BEGIN;

-- ============================================
-- PASSO 1: Garantir apenas loja padrão para testes
-- ============================================
-- Remover vínculos de admin_lojas para lojas extras antes de deletar as lojas
DELETE FROM livraria_gestao.admin_lojas WHERE loj_id > 1;

-- Remover lojas extras se existirem (apenas manter loja padrão)
DELETE FROM livraria_gestao.lojas WHERE loj_id > 1;

-- ============================================
-- PASSO 2: Vincular admin à loja padrão para testes
-- ============================================
DO $$
DECLARE
  v_admin_id BIGINT;
  v_loja_padrao BIGINT;
BEGIN
  -- Buscar ID da loja padrão
  SELECT loj_id INTO v_loja_padrao FROM livraria_gestao.lojas WHERE loj_slug = 'loja-padrao';
  
  -- Buscar primeiro admin (assumindo que existe)
  SELECT usu_id INTO v_admin_id FROM livraria_gestao.usuarios LIMIT 1;
  
  -- Se existir admin, vincular à loja padrão
  IF v_admin_id IS NOT NULL AND v_loja_padrao IS NOT NULL THEN
    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo)
    VALUES (v_admin_id, v_loja_padrao, 'admin_principal', TRUE)
    ON CONFLICT (usu_id, loj_id) DO NOTHING;
    
    RAISE NOTICE 'Admin % vinculado à loja padrão para testes', v_admin_id;
  ELSE
    RAISE NOTICE 'Admin ou loja padrão não encontrados para vincular';
  END IF;
END $$;

-- ============================================
-- PASSO 3: Criar estoques mínimos para testes
-- ============================================
-- Para os primeiros 5 livros, criar estoques na loja padrão
DO $$
DECLARE
  v_livro RECORD;
  v_loja_padrao BIGINT;
  v_preco_teste NUMERIC := 29.90;
  v_quantidade_teste INTEGER := 50;
BEGIN
  -- Buscar ID da loja padrão
  SELECT loj_id INTO v_loja_padrao FROM livraria_gestao.lojas WHERE loj_slug = 'loja-padrao';
  
  IF v_loja_padrao IS NOT NULL THEN
    -- Para os primeiros 5 livros
    FOR v_livro IN SELECT liv_id FROM livraria_comercial.livros LIMIT 5 LOOP
      -- Inserir ou atualizar estoque
      INSERT INTO livraria_comercial.estoques (
        liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
        etq_criado_em, etq_atualizado_em
      )
      VALUES (
        v_livro.liv_id,
        v_loja_padrao,
        v_quantidade_teste,
        v_preco_teste,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Estoques de teste criados na loja padrão';
  ELSE
    RAISE NOTICE 'Loja padrão não encontrada para criar estoques de teste';
  END IF;
END $$;

-- ============================================
-- RESUMO DO SEED
-- ============================================
-- ✅ Apenas loja padrão (loj_id = 1) mantida para testes
-- ✅ Admin vinculado à loja padrão
-- ✅ Estoques mínimos criados para 5 livros na loja padrão
-- ✅ Ambiente de testes isolado e previsível

COMMIT;
