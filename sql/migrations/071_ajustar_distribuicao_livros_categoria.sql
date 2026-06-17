-- Migration: 071_ajustar_distribuicao_livros_categoria.sql
-- Descrição: Ajustar distribuição de livros por categoria para quantidades diferentes
-- Data: 2026-06-08
-- Justificativa: Todas as categorias tinham 20 livros, ajustando para distribuição mais realista

BEGIN;

-- Obter loj_id da Loja Padrão
DO $$
DECLARE
  v_loj_id BIGINT;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
  
  RAISE NOTICE 'Usando loj_id=% para ajuste de distribuição', v_loj_id;
END $$;

-- Distribuição desejada de livros por categoria (loj_id = 32)
-- Fantasia: 25 livros (mais popular)
-- Ficção Científica: 22 livros
-- Clássicos: 18 livros
-- Distopia: 12 livros (menos popular)
-- Literatura Brasileira: 15 livros
-- Negócios: 10 livros (nicho)
-- Tecnologia: 8 livros (nicho)

-- Atualmente todas têm 15 livros no estoque da loja 32

-- Remover estoques de livros para ajustar quantidades
-- Distopia: remover 3 livros (de 15 para 12)
DELETE FROM livraria_comercial.estoques 
WHERE loj_id = 32 
  AND liv_id IN (
    SELECT l.liv_id 
    FROM livraria_comercial.livros l 
    JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id 
    JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id 
    WHERE c.cat_nome = 'Distopia' 
    LIMIT 3
  );

-- Negócios: remover 5 livros (de 15 para 10)
DELETE FROM livraria_comercial.estoques 
WHERE loj_id = 32 
  AND liv_id IN (
    SELECT l.liv_id 
    FROM livraria_comercial.livros l 
    JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id 
    JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id 
    WHERE c.cat_nome = 'Negócios' 
    LIMIT 5
  );

-- Tecnologia: remover 7 livros (de 15 para 8)
DELETE FROM livraria_comercial.estoques 
WHERE loj_id = 32 
  AND liv_id IN (
    SELECT l.liv_id 
    FROM livraria_comercial.livros l 
    JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id 
    JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id 
    WHERE c.cat_nome = 'Tecnologia' 
    LIMIT 7
  );

-- Clássicos: manter 15 (precisamos de 18, mas não há mais livros para adicionar)

-- Adicionar estoques para Fantasia (já tem 15, precisamos de 25)
-- Vamos adicionar 10 livros de outras categorias que também podem ser fantasia
-- e adicionar a categoria fantasia a eles
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
SELECT DISTINCT l.liv_id, (SELECT cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia')
FROM livraria_comercial.livros l
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE c.cat_nome IN ('Young Adult', 'Aventura')
  AND l.liv_id NOT IN (SELECT liv_id FROM livraria_comercial.livro_categorias WHERE cat_id = (SELECT cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia'))
LIMIT 10
ON CONFLICT DO NOTHING;

-- Adicionar estoques para esses livros na loja 32
INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, loj_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_ativo, etq_criado_em, etq_atualizado_em)
SELECT 
  gen_random_uuid(),
  l.liv_id,
  32,
  50,
  0,
  (random() * 30 + 40)::numeric(10,2),
  TRUE,
  NOW(),
  NOW()
FROM livraria_comercial.livros l
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE c.cat_nome = 'Fantasia'
  AND l.liv_id NOT IN (SELECT liv_id FROM livraria_comercial.estoques WHERE loj_id = 32)
LIMIT 10
ON CONFLICT DO NOTHING;

-- Adicionar estoques para Ficção Científica (já tem 15, precisamos de 22)
-- Vamos adicionar 7 livros de outras categorias que também podem ser ficção científica
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
SELECT DISTINCT l.liv_id, (SELECT cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Ficção Científica')
FROM livraria_comercial.livros l
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE c.cat_nome IN ('Distopia', 'Tecnologia')
  AND l.liv_id NOT IN (SELECT liv_id FROM livraria_comercial.livro_categorias WHERE cat_id = (SELECT cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Ficção Científica'))
LIMIT 7
ON CONFLICT DO NOTHING;

-- Adicionar estoques para esses livros na loja 32
INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, loj_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_ativo, etq_criado_em, etq_atualizado_em)
SELECT 
  gen_random_uuid(),
  l.liv_id,
  32,
  50,
  0,
  (random() * 30 + 40)::numeric(10,2),
  TRUE,
  NOW(),
  NOW()
FROM livraria_comercial.livros l
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE c.cat_nome = 'Ficção Científica'
  AND l.liv_id NOT IN (SELECT liv_id FROM livraria_comercial.estoques WHERE loj_id = 32)
LIMIT 7
ON CONFLICT DO NOTHING;

-- Adicionar estoques para Clássicos (já tem 15, precisamos de 18)
-- Vamos adicionar 3 livros de outras categorias que também podem ser clássicos
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
SELECT DISTINCT l.liv_id, (SELECT cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos')
FROM livraria_comercial.livros l
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE c.cat_nome IN ('Literatura Brasileira', 'Romance')
  AND l.liv_id NOT IN (SELECT liv_id FROM livraria_comercial.livro_categorias WHERE cat_id = (SELECT cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos'))
LIMIT 3
ON CONFLICT DO NOTHING;

-- Adicionar estoques para esses livros na loja 32
INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, loj_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_ativo, etq_criado_em, etq_atualizado_em)
SELECT 
  gen_random_uuid(),
  l.liv_id,
  32,
  50,
  0,
  (random() * 30 + 40)::numeric(10,2),
  TRUE,
  NOW(),
  NOW()
FROM livraria_comercial.livros l
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE c.cat_nome = 'Clássicos'
  AND l.liv_id NOT IN (SELECT liv_id FROM livraria_comercial.estoques WHERE loj_id = 32)
LIMIT 3
ON CONFLICT DO NOTHING;

-- Verificar distribuição final
DO $$
DECLARE
  v_cat_nome TEXT;
  v_total_livros INTEGER;
BEGIN
  RAISE NOTICE '=== Distribuição final de livros por categoria (loj_id=32) ===';
  
  FOR v_cat_nome, v_total_livros IN
    SELECT cat.cat_nome, COUNT(DISTINCT e.liv_id)
    FROM livraria_comercial.categorias cat
    JOIN livraria_comercial.livro_categorias lc ON cat.cat_id = lc.cat_id
    JOIN livraria_comercial.estoques e ON lc.liv_id = e.liv_id
    WHERE e.loj_id = 32
    GROUP BY cat.cat_nome
    ORDER BY cat.cat_nome
  LOOP
    RAISE NOTICE '%: % livros', v_cat_nome, v_total_livros;
  END LOOP;
END $$;

COMMIT;
