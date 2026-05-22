-- Seed: 033_seed_multi_loja_testes.sql
-- Descrição: Seed de multi-loja para testes E2E de multi-tenancy
-- Ambiente: Testes
-- Autor: Senior DBA
-- Data: 2026-05-21

BEGIN;

-- ============================================
-- PASSO 1: Criar Lojas A e B para testes
-- ============================================
INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_ativo)
VALUES 
  (gen_random_uuid(), 'Loja A Multi-Tenancy', 'loja-a-multi-tenancy', TRUE),
  (gen_random_uuid(), 'Loja B Multi-Tenancy', 'loja-b-multi-tenancy', TRUE)
ON CONFLICT (loj_slug) DO NOTHING;

-- ============================================
-- PASSO 2: Criar usuários admin para cada loja
-- ============================================
DO $$
DECLARE
  v_loja_a_id BIGINT;
  v_loja_b_id BIGINT;
  v_admin_a_id BIGINT;
  v_admin_b_id BIGINT;
BEGIN
  -- Buscar IDs das lojas
  SELECT loj_id INTO v_loja_a_id FROM livraria_gestao.lojas WHERE loj_slug = 'loja-a-multi-tenancy';
  SELECT loj_id INTO v_loja_b_id FROM livraria_gestao.lojas WHERE loj_slug = 'loja-b-multi-tenancy';
  
  IF v_loja_a_id IS NULL OR v_loja_b_id IS NULL THEN
    RAISE EXCEPTION 'Lojas A ou B não encontradas';
  END IF;
  
  -- Criar usuário admin para Loja A
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid, usu_nome, usu_email, usu_senha_hash, pap_id, usu_ativo, loj_id
  )
  VALUES (
    gen_random_uuid(),
    'Admin Loja A',
    'admin_loja_a@email.com',
    '$2b$10$ZpJ7cQ8RbT0J7mP2QISR3ePB111bUhzqWGiKpcD.tAHszVG57PDJi',
    1,
    TRUE,
    v_loja_a_id
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_a_id;
  
  -- Criar usuário admin para Loja B
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid, usu_nome, usu_email, usu_senha_hash, pap_id, usu_ativo, loj_id
  )
  VALUES (
    gen_random_uuid(),
    'Admin Loja B',
    'admin_loja_b@email.com',
    '$2b$10$ud94XYDL5FPEaLbTMs/yJ.L6rrMvUN6xR1ZHwLNqs1FJxoQUMMt3S',
    1,
    TRUE,
    v_loja_b_id
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_b_id;
  
  -- Se os usuários já existiam, buscar seus IDs
  IF v_admin_a_id IS NULL THEN
    SELECT usu_id INTO v_admin_a_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin_loja_a@email.com';
  END IF;
  
  IF v_admin_b_id IS NULL THEN
    SELECT usu_id INTO v_admin_b_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin_loja_b@email.com';
  END IF;
  
  -- ============================================
  -- PASSO 3: Vincular admins às suas lojas
  -- ============================================
  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo)
  VALUES (v_admin_a_id, v_loja_a_id, 'admin_principal', TRUE)
  ON CONFLICT (usu_id, loj_id) DO NOTHING;
  
  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo)
  VALUES (v_admin_b_id, v_loja_b_id, 'admin_principal', TRUE)
  ON CONFLICT (usu_id, loj_id) DO NOTHING;
  
  RAISE NOTICE 'Admin Loja A (usu_id=%) vinculado à Loja A (loj_id=%)', v_admin_a_id, v_loja_a_id;
  RAISE NOTICE 'Admin Loja B (usu_id=%) vinculado à Loja B (loj_id=%)', v_admin_b_id, v_loja_b_id;
END $$;

-- ============================================
-- PASSO 4: Criar estoques do mesmo livro em ambas as lojas
-- ============================================
-- NOTA: A tabela estoques tem uma constraint única em liv_id (estoques_liv_id_key)
-- que impede multi-tenancy. Esta constraint deve ser removida antes de executar
-- este seed. Use: ALTER TABLE livraria_comercial.estoques DROP CONSTRAINT estoques_liv_id_key;
DO $$
DECLARE
  v_livro RECORD;
  v_loja_a_id BIGINT;
  v_loja_b_id BIGINT;
  v_preco_teste NUMERIC := 29.90;
  v_quantidade_teste INTEGER := 50;
BEGIN
  -- Buscar IDs das lojas
  SELECT loj_id INTO v_loja_a_id FROM livraria_gestao.lojas WHERE loj_slug = 'loja-a-multi-tenancy';
  SELECT loj_id INTO v_loja_b_id FROM livraria_gestao.lojas WHERE loj_slug = 'loja-b-multi-tenancy';
  
  IF v_loja_a_id IS NULL OR v_loja_b_id IS NULL THEN
    RAISE EXCEPTION 'Lojas A ou B não encontradas para criar estoques';
  END IF;
  
  -- Para os primeiros 3 livros, criar estoques em ambas as lojas
  FOR v_livro IN SELECT liv_id FROM livraria_comercial.livros LIMIT 3 LOOP
    -- Inserir estoque na Loja A
    INSERT INTO livraria_comercial.estoques (
      liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
      etq_criado_em, etq_atualizado_em
    )
    VALUES (
      v_livro.liv_id,
      v_loja_a_id,
      v_quantidade_teste,
      v_preco_teste,
      NOW(),
      NOW()
    );
    
    -- Inserir estoque na Loja B
    INSERT INTO livraria_comercial.estoques (
      liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
      etq_criado_em, etq_atualizado_em
    )
    VALUES (
      v_livro.liv_id,
      v_loja_b_id,
      v_quantidade_teste,
      v_preco_teste,
      NOW(),
      NOW()
    );
  END LOOP;
  
  RAISE NOTICE 'Estoques criados para 3 livros nas Lojas A e B';
END $$;

-- ============================================
-- RESUMO DO SEED
-- ============================================
-- ✅ Loja A (loja-a-multi-tenancy) criada
-- ✅ Loja B (loja-b-multi-tenancy) criada
-- ✅ Admin Loja A criado e vinculado à Loja A
-- ✅ Admin Loja B criado e vinculado à Loja B
-- ✅ Estoques criados para 3 livros em ambas as lojas
-- ✅ Ambiente pronto para testes de multi-tenancy

COMMIT;
