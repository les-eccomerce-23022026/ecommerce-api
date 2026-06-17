-- Migration: 075_distribuir_categorias_aleatoriamente.sql
-- Descrição: Distribuir livros aleatoriamente entre múltiplas categorias
-- Justificativa: Script anterior associou todos os livros à mesma categoria
-- Estratégia: Distribuir livros de forma balanceada entre todas as categorias

BEGIN;

-- Remover todas as associações de categorias
DELETE FROM livraria_comercial.livro_categorias;

-- Distribuir livros aleatoriamente entre todas as categorias
WITH livros_com_id AS (
  SELECT 
    l.liv_id,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as row_num
  FROM livraria_comercial.livros l
),
categorias_com_id AS (
  SELECT 
    cat.cat_id,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as row_num
  FROM livraria_comercial.categorias cat
  WHERE cat.cat_nome IS NOT NULL
)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
SELECT 
  lci.liv_id,
  cci.cat_id
FROM livros_com_id lci
JOIN categorias_com_id cci ON cci.row_num = (lci.row_num % (SELECT COUNT(*) FROM categorias_com_id)) + 1;

COMMIT;
