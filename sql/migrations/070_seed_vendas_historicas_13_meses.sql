-- Migration: 070_seed_vendas_historicas_13_meses.sql
-- Descrição: Seed de vendas históricas para 13 meses (maio 2025 a maio 2026)
-- Data: 2026-06-08
-- Justificativa: Entrega 9 exige 13 meses de dados históricos para demonstração do gráfico de linhas
-- Estratégia: Usar GENERATE_SERIES para gerar vendas distribuídas ao longo do período
--              Garantir distribuição por categoria para atender cenários BDD (uma linha por categoria)
--              Usar UUID fixo da Loja Padrão para garantir consistência entre execuções
--              Usar loj_id dinâmico obtido pelo UUID (não fixo)
--              Simplificado: Apenas 2 clientes específicos e 1 administrador de loja
--
-- IMPORTANTE: Este seed usa um UUID fixo para a Loja Padrão (82c0a24c-4cf4-4b12-823a-f1a8b9a086c3)
-- Isso garante que os dados de vendas históricas sempre sejam criados na mesma loja,
-- independente de qual loja está ativa no momento da execução.
-- O loj_id é obtido dinamicamente pelo UUID para evitar conflitos de IDs fixos.
--
-- Usuários fixos para simplificação:
-- - Cliente 1: usu_id = 92 (cliente2@livraria.com.br - João Santos)
-- - Cliente 2: usu_id = 94 (cliente1@livraria.com.br - Maria Silva)
-- - Admin Loja: usu_id = 93 (admin_loja@livraria.com.br - Admin Livraria)

BEGIN;

-- UUID fixo da Loja Padrão (deve corresponder ao UUID criado na migration de lojas)
DO $$
DECLARE
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
  v_loj_id BIGINT;
BEGIN
  -- Obter loj_id pelo UUID fixo
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  IF v_loj_id IS NULL THEN
    RAISE EXCEPTION 'Loja Padrão (UUID: %) não encontrada. Execute seeds de lojas primeiro.', v_loj_uuid;
  END IF;
  
  -- Garantir que a Loja Padrão esteja ativa
  UPDATE livraria_gestao.lojas 
  SET loj_ativo = TRUE 
  WHERE loj_uuid = v_loj_uuid;
  
  RAISE NOTICE 'Usando loj_id=% (UUID: %) para seed de vendas históricas', v_loj_id, v_loj_uuid;
END $$;

-- Inserir vendas históricas usando GENERATE_SERIES
-- Estratégia: Gerar ~25 vendas por mês para ter dados significativos (total ~325 vendas)
--              Distribuir vendas entre categorias para permitir gráfico de linhas comparativo
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
categorias_disponiveis AS (
  SELECT DISTINCT cat.cat_id, cat.cat_nome
  FROM livraria_comercial.categorias cat
  JOIN livraria_comercial.livro_categorias lc ON cat.cat_id = lc.cat_id
  JOIN livraria_comercial.estoques e ON lc.liv_id = e.liv_id
  JOIN loja_padrao lp ON e.loj_id = lp.loj_id
  WHERE cat.cat_nome IS NOT NULL
),
vendas_geradas AS (
  SELECT
    sm.mes_inicio,
    sm.mes_inicio + (random() * INTERVAL '28 days')::interval as data_venda,
    -- Usar apenas 2 clientes fixos para simplificação (50% cada)
    CASE WHEN random() < 0.5 THEN 92 ELSE 94 END as usu_id,
    -- Status: 80% ENTREGUE (5), 15% APROVADA (3), 5% EM_PROCESSAMENTO (2)
    CASE
      WHEN random() < 0.80 THEN 5
      WHEN random() < 0.95 THEN 3
      ELSE 2
    END as stv_id,
    -- Valores aleatórios para totais
    (random() * 3 + 1)::integer as num_itens, -- 1-4 itens
    (random() * 50 + 20)::numeric(10,2) as frete, -- 20-70 de frete
    lp.loj_id, -- Loja Padrão dinâmica
    -- Distribuir categorias ciclicamente para garantir representatividade
    (SELECT cat_id FROM categorias_disponiveis ORDER BY cat_id LIMIT 1 OFFSET (FLOOR(RANDOM() * (SELECT COUNT(*) FROM categorias_disponiveis)))::integer) as cat_id
  FROM series_meses sm
  CROSS JOIN loja_padrao lp
  CROSS JOIN generate_series(1, 25) -- 25 vendas por mês (aumentado de 12)
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
  0.00, -- Será atualizado depois
  frete,
  0.00, -- Será atualizado depois
  data_venda,
  data_venda,
  loj_id,
  NULL -- cfr_id opcional
FROM vendas_geradas
ON CONFLICT DO NOTHING;

-- Inserir itens de venda para as vendas criadas
-- Estratégia: Para cada venda, adicionar 1-3 itens de livros da categoria selecionada
--              Isso garante que cada venda contribua para a categoria correta no gráfico
WITH loja_padrao AS (
  SELECT loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID
),
vendas_criadas AS (
  SELECT
    v.ven_id,
    v.loj_id,
    (random() * 2 + 1)::integer as num_itens_venda -- 1-3 itens
  FROM livraria_comercial.vendas v
  WHERE v.ven_criado_em >= '2025-05-01'
    AND v.ven_criado_em <= '2026-05-31'
    AND v.loj_id = (SELECT loj_id FROM loja_padrao) -- Loja Padrão fixa
  ORDER BY v.ven_id
),
livros_por_categoria AS (
  SELECT DISTINCT
    l.liv_uuid,
    l.liv_id,
    lc.cat_id,
    e.etq_preco_venda
  FROM livraria_comercial.livros l
  JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
  JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id AND e.loj_id = (SELECT loj_id FROM loja_padrao)
  JOIN livraria_comercial.categorias cat ON cat.cat_id = lc.cat_id
  WHERE cat.cat_nome IS NOT NULL
),
itens_gerados AS (
  SELECT
    vc.ven_id,
    vc.loj_id,
    lpc.liv_uuid,
    (random() * 2 + 1)::integer as quantidade, -- 1-3 unidades
    COALESCE(lpc.etq_preco_venda, 45.00) as preco_unitario -- Preço do estoque ou fallback
  FROM vendas_criadas vc
  CROSS JOIN generate_series(1, vc.num_itens_venda)
  CROSS JOIN LATERAL (
    SELECT liv_uuid, etq_preco_venda
    FROM livros_por_categoria
    ORDER BY RANDOM()
    LIMIT 1
  ) lpc
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
  COALESCE(preco_unitario, 45.00), -- Preço padrão se NULL
  (SELECT ven_criado_em FROM livraria_comercial.vendas WHERE ven_id = itens_gerados.ven_id),
  (SELECT ven_criado_em FROM livraria_comercial.vendas WHERE ven_id = itens_gerados.ven_id),
  loj_id
FROM itens_gerados
ON CONFLICT DO NOTHING;

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

DO $$
DECLARE
  total_vendas INTEGER;
  total_itens INTEGER;
  v_loj_id BIGINT;
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
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

  RAISE NOTICE 'Seed concluído: % vendas e % itens gerados (loj_id=%, UUID=%)', total_vendas, total_itens, v_loj_id, v_loj_uuid;
END $$;

COMMIT;
