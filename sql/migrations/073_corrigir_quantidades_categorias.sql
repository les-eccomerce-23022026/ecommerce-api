-- Migration: 073_corrigir_quantidades_categorias.sql
-- Descrição: Corrigir quantidades de itens de venda para criar dados variados por categoria
-- Justificativa: O gráfico de análise de vendas está com linhas sobrepostas porque
--              todas as categorias têm a mesma quantidade de vendas
-- Estratégia: Atualizar os itens de venda com quantidades variadas por categoria

BEGIN;

-- Atualizar quantidades dos itens de venda por categoria
WITH itens_por_categoria AS (
  SELECT 
    iv.itv_id,
    cat.cat_nome,
    -- Quantidade base variável por categoria
    CASE cat.cat_nome
      WHEN 'Ficção Científica' THEN (random() * 4 + 2)::integer
      WHEN 'Fantasia' THEN (random() * 3 + 1)::integer
      WHEN 'Clássicos' THEN (random() * 2 + 1)::integer
      WHEN 'Tecnologia' THEN (random() * 3 + 2)::integer
      WHEN 'Literatura Brasileira' THEN (random() * 2 + 1)::integer
      WHEN 'Distopia' THEN (random() * 2 + 1)::integer
      WHEN 'Negócios' THEN (random() * 2 + 1)::integer
      ELSE (random() * 2 + 1)::integer
    END as nova_quantidade
  FROM livraria_comercial.itens_venda iv
  JOIN livraria_comercial.livros l ON l.liv_uuid = iv.liv_uuid
  JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
  JOIN livraria_comercial.categorias cat ON cat.cat_id = lc.cat_id
  JOIN livraria_comercial.vendas v ON v.ven_id = iv.ven_id
  WHERE v.ven_criado_em >= '2025-05-01'
    AND v.ven_criado_em <= '2026-06-08'
    AND v.loj_id = 32
    AND v.stv_id = 5
)
UPDATE livraria_comercial.itens_venda iv
SET itv_quantidade = ipc.nova_quantidade
FROM itens_por_categoria ipc
WHERE iv.itv_id = ipc.itv_id;

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

COMMIT;
