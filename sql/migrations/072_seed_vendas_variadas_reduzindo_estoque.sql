-- Migration: 072_seed_vendas_variadas_reduzindo_estoque.sql
-- Descrição: Seed de vendas variadas com redução real de estoque
-- Data: 2026-06-08
-- Justificativa: Usuário relatou que o estoque permanece o mesmo em vários períodos
--              Este script cria vendas aleatórias e REDUZ o estoque de forma realista
-- Estratégia: 
--   1. Limpar vendas históricas existentes do período
--   2. Gerar vendas com distribuição variada por categoria e mês
--   3. ATUALIZAR O ESTOQUE após cada venda para refletir redução real
--   4. Garantir que estoque não fique negativo
--   5. Usar Loja Padrão (UUID fixo) para consistência
--
-- IMPORTANTE: Este script ALTERA o estoque real dos livros na Loja Padrão

BEGIN;

-- UUID fixo da Loja Padrão
DO $$
DECLARE
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
  v_loj_id BIGINT;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  IF v_loj_id IS NULL THEN
    RAISE EXCEPTION 'Loja Padrão (UUID: %) não encontrada.', v_loj_uuid;
  END IF;
  
  UPDATE livraria_gestao.lojas 
  SET loj_ativo = TRUE 
  WHERE loj_uuid = v_loj_uuid;
  
  RAISE NOTICE 'Usando loj_id=% (UUID: %) para seed de vendas com redução de estoque', v_loj_id, v_loj_uuid;
END $$;

-- Limpar vendas existentes do período para evitar duplicação
DO $$
DECLARE
  v_loj_id BIGINT;
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  DELETE FROM livraria_comercial.itens_venda 
  WHERE ven_id IN (
    SELECT ven_id FROM livraria_comercial.vendas 
    WHERE ven_criado_em >= '2025-05-01' 
      AND ven_criado_em <= '2026-05-31'
      AND loj_id = v_loj_id
  );
  
  DELETE FROM livraria_comercial.vendas 
  WHERE ven_criado_em >= '2025-05-01' 
    AND ven_criado_em <= '2026-05-31'
    AND loj_id = v_loj_id;
  
  RAISE NOTICE 'Vendas existentes limpas para loj_id=%', v_loj_id;
END $$;

-- Restaurar estoque inicial para garantir base consistente
-- Define estoque inicial alto para permitir redução
DO $$
DECLARE
  v_loj_id BIGINT;
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  UPDATE livraria_comercial.estoques
  SET etq_quantidade_disponivel = 100 + (FLOOR(RANDOM() * 200))::integer
  WHERE loj_id = v_loj_id;
  
  RAISE NOTICE 'Estoque restaurado para valores aleatórios (100-300) na loj_id=%', v_loj_id;
END $$;

-- Gerar vendas variadas com redução de estoque
-- Estratégia: Gerar vendas separadas por categoria com quantidades diferentes
WITH series_meses AS (
  SELECT generate_series(
    DATE '2025-05-01',
    DATE '2026-05-01',
    INTERVAL '1 month'
  )::date as mes_inicio
),
loja_padrao AS (
  SELECT loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID
),
categorias_config AS (
  SELECT 
    cat.cat_id,
    cat.cat_nome,
    CASE cat.cat_nome
      WHEN 'Ficção Científica' THEN 80
      WHEN 'Fantasia' THEN 60
      WHEN 'Clássicos' THEN 40
      WHEN 'Tecnologia' THEN 30
      WHEN 'Literatura Brasileira' THEN 25
      WHEN 'Distopia' THEN 20
      WHEN 'Negócios' THEN 15
      ELSE 10
    END as num_vendas_mes
  FROM livraria_comercial.categorias cat
  WHERE cat.cat_nome IS NOT NULL
),
vendas_geradas AS (
  SELECT
    sm.mes_inicio,
    sm.mes_inicio + (random() * INTERVAL '28 days')::interval as data_venda,
    CASE WHEN random() < 0.5 THEN 92 ELSE 94 END as usu_id,
    5 as stv_id,
    lp.loj_id,
    cc.cat_id,
    cc.cat_nome,
    -- Quantidade base por categoria para criar dados distintos
    CASE cc.cat_nome
      WHEN 'Ficção Científica' THEN (random() * 4 + 2)::integer
      WHEN 'Fantasia' THEN (random() * 3 + 1)::integer
      WHEN 'Clássicos' THEN (random() * 2 + 1)::integer
      WHEN 'Tecnologia' THEN (random() * 3 + 2)::integer
      WHEN 'Literatura Brasileira' THEN (random() * 2 + 1)::integer
      WHEN 'Distopia' THEN (random() * 2 + 1)::integer
      WHEN 'Negócios' THEN (random() * 2 + 1)::integer
      ELSE (random() * 2 + 1)::integer
    END as qtd_base
  FROM series_meses sm
  CROSS JOIN loja_padrao lp
  CROSS JOIN categorias_config cc
  CROSS JOIN generate_series(1, cc.num_vendas_mes)
)
INSERT INTO livraria_comercial.vendas (
  ven_uuid,
  usu_id,
  stv_id,
  ven_total_itens,
  ven_frete,
  ven_total_venda,
  ven_criado_em,
  ven_atualizado_em,
  loj_id,
  cfr_id
)
SELECT
  gen_random_uuid(),
  usu_id,
  stv_id,
  0.00,
  (random() * 50 + 20)::numeric(10,2) as frete,
  0.00,
  data_venda,
  data_venda,
  loj_id,
  NULL
FROM vendas_geradas
ON CONFLICT DO NOTHING;

-- Criar tabela temporária para associar categorias às vendas
DO $$
BEGIN
  DROP TABLE IF EXISTS vendas_categorias_temp;
  CREATE TEMP TABLE vendas_categorias_temp (
    ven_id BIGINT PRIMARY KEY,
    cat_id BIGINT,
    cat_nome TEXT,
    qtd_base INTEGER
  );
  
  INSERT INTO vendas_categorias_temp (ven_id, cat_id, cat_nome, qtd_base)
  SELECT 
    v.ven_id,
    c.cat_id,
    c.cat_nome,
    -- Quantidade base por categoria para criar dados distintos
    CASE c.cat_nome
      WHEN 'Ficção Científica' THEN (random() * 4 + 2)::integer
      WHEN 'Fantasia' THEN (random() * 3 + 1)::integer
      WHEN 'Clássicos' THEN (random() * 2 + 1)::integer
      WHEN 'Tecnologia' THEN (random() * 3 + 2)::integer
      WHEN 'Literatura Brasileira' THEN (random() * 2 + 1)::integer
      WHEN 'Distopia' THEN (random() * 2 + 1)::integer
      WHEN 'Negócios' THEN (random() * 2 + 1)::integer
      ELSE (random() * 2 + 1)::integer
    END as qtd_base
  FROM livraria_comercial.vendas v
  CROSS JOIN LATERAL (
    SELECT cat_id, cat_nome
    FROM livraria_comercial.categorias
    WHERE cat_nome IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
  ) c
  WHERE v.ven_criado_em >= '2025-05-01'
    AND v.ven_criado_em <= '2026-05-31'
    AND v.loj_id = (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID);
END $$;

-- Inserir itens de venda usando a categoria específica de cada venda
WITH loja_padrao AS (
  SELECT loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID
),
vendas_criadas AS (
  SELECT
    v.ven_id,
    v.loj_id,
    vct.cat_id,
    (random() * 3 + 1)::integer as num_itens_venda
  FROM livraria_comercial.vendas v
  JOIN vendas_categorias_temp vct ON vct.ven_id = v.ven_id
  WHERE v.ven_criado_em >= '2025-05-01'
    AND v.ven_criado_em <= '2026-05-31'
    AND v.loj_id = (SELECT loj_id FROM loja_padrao)
  ORDER BY v.ven_id
),
livros_com_estoque AS (
  SELECT
    l.liv_uuid,
    l.liv_id,
    e.etq_quantidade_disponivel,
    e.etq_preco_venda,
    lc.cat_id
  FROM livraria_comercial.livros l
  JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
  JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
  WHERE e.loj_id = (SELECT loj_id FROM loja_padrao)
    AND e.etq_quantidade_disponivel > 0
),
itens_gerados AS (
  SELECT
    vc.ven_id,
    vc.loj_id,
    lce.liv_uuid,
    -- Usar qtd_base da tabela temporária para garantir quantidades diferentes por categoria
    LEAST(vct.qtd_base, lce.etq_quantidade_disponivel) as quantidade,
    COALESCE(lce.etq_preco_venda, 45.00) as preco_unitario
  FROM vendas_criadas vc
  JOIN vendas_categorias_temp vct ON vct.ven_id = vc.ven_id
  CROSS JOIN generate_series(1, vc.num_itens_venda)
  CROSS JOIN LATERAL (
    SELECT liv_uuid, liv_id, etq_quantidade_disponivel, etq_preco_venda
    FROM livros_com_estoque
    WHERE cat_id = vc.cat_id
      AND etq_quantidade_disponivel >= 1
    ORDER BY RANDOM()
    LIMIT 1
  ) lce
)
INSERT INTO livraria_comercial.itens_venda (
  itv_uuid,
  ven_id,
  liv_uuid,
  itv_quantidade,
  itv_preco_unitario,
  itv_criado_em,
  itv_atualizado_em,
  loj_id
)
SELECT
  gen_random_uuid(),
  ven_id,
  liv_uuid,
  quantidade,
  preco_unitario,
  (SELECT ven_criado_em FROM livraria_comercial.vendas WHERE ven_id = itens_gerados.ven_id),
  (SELECT ven_criado_em FROM livraria_comercial.vendas WHERE ven_id = itens_gerados.ven_id),
  loj_id
FROM itens_gerados
ON CONFLICT DO NOTHING;

-- REDUZIR O ESTOQUE REAL APÓS CRIAR ITENS
WITH loja_padrao AS (
  SELECT loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID
),
reducao_estoque AS (
  SELECT
    l.liv_id,
    (SELECT loj_id FROM loja_padrao) as loj_id,
    SUM(iv.itv_quantidade) as total_vendido
  FROM livraria_comercial.itens_venda iv
  JOIN livraria_comercial.livros l ON l.liv_uuid = iv.liv_uuid
  JOIN livraria_comercial.vendas v ON v.ven_id = iv.ven_id
  WHERE v.ven_criado_em >= '2025-05-01'
    AND v.ven_criado_em <= '2026-05-31'
    AND v.loj_id = (SELECT loj_id FROM loja_padrao)
  GROUP BY l.liv_id
)
UPDATE livraria_comercial.estoques e
SET etq_quantidade_disponivel = GREATEST(0, e.etq_quantidade_disponivel - re.total_vendido)
FROM reducao_estoque re
WHERE e.liv_id = re.liv_id
  AND e.loj_id = re.loj_id;

-- Atualizar totais das vendas
WITH loja_padrao AS (
  SELECT loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID
)
UPDATE livraria_comercial.vendas v
SET
  ven_total_itens = (
    SELECT COALESCE(SUM(iv.itv_quantidade * iv.itv_preco_unitario), 0)
    FROM livraria_comercial.itens_venda iv
    WHERE iv.ven_id = v.ven_id
  ),
  ven_total_venda = (
    SELECT COALESCE(SUM(iv.itv_quantidade * iv.itv_preco_unitario), 0) + v.ven_frete
    FROM livraria_comercial.itens_venda iv
    WHERE iv.ven_id = v.ven_id
  )
WHERE v.ven_criado_em >= '2025-05-01'
  AND v.ven_criado_em <= '2026-05-31'
  AND v.loj_id = (SELECT loj_id FROM loja_padrao);

-- Relatório de execução
DO $$
DECLARE
  v_loj_id BIGINT;
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
  total_vendas INTEGER;
  total_itens INTEGER;
  estoque_medio NUMERIC;
  estoque_minimo INTEGER;
  estoque_maximo INTEGER;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  SELECT COUNT(*) INTO total_vendas
  FROM livraria_comercial.vendas
  WHERE ven_criado_em >= '2025-05-01'
    AND ven_criado_em <= '2026-05-31'
    AND loj_id = v_loj_id;

  SELECT COUNT(*) INTO total_itens
  FROM livraria_comercial.itens_venda iv
  JOIN livraria_comercial.vendas v ON v.ven_id = iv.ven_id
  WHERE v.ven_criado_em >= '2025-05-01'
    AND v.ven_criado_em <= '2026-05-31'
    AND v.loj_id = v_loj_id;
  
  SELECT 
    AVG(etq_quantidade_disponivel),
    MIN(etq_quantidade_disponivel),
    MAX(etq_quantidade_disponivel)
  INTO estoque_medio, estoque_minimo, estoque_maximo
  FROM livraria_comercial.estoques
  WHERE loj_id = v_loj_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed de vendas com redução de estoque concluído';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Loja: loj_id=%, UUID=%', v_loj_id, v_loj_uuid;
  RAISE NOTICE 'Total de vendas: %', total_vendas;
  RAISE NOTICE 'Total de itens vendidos: %', total_itens;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'ESTOQUE APÓS VENDAS:';
  RAISE NOTICE 'Estoque médio: %', ROUND(estoque_medio, 2);
  RAISE NOTICE 'Estoque mínimo: %', estoque_minimo;
  RAISE NOTICE 'Estoque máximo: %', estoque_maximo;
  RAISE NOTICE '========================================';
END $$;

COMMIT;
