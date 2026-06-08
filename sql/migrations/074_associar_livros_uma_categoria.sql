-- Migration: 074_associar_livros_uma_categoria.sql
-- Descrição: Associar cada livro a apenas uma categoria para corrigir análise de vendas
-- Justificativa: Livros têm múltiplas categorias, causando duplicação na análise de vendas
-- Estratégia: Remover associações existentes e associar cada livro a uma categoria aleatória

BEGIN;

-- Remover todas as associações de categorias
DELETE FROM livraria_comercial.livro_categorias;

-- Associar cada livro a uma categoria aleatória
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
SELECT 
  l.liv_id,
  (SELECT cat_id FROM livraria_comercial.categorias ORDER BY RANDOM() LIMIT 1) as cat_id
FROM livraria_comercial.livros l;

COMMIT;
