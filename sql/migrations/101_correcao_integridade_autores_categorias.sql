-- Migration: 101_correcao_integridade_autores_categorias.sql
-- Data: 2026-06-08
-- Objetivo: Corrigir corrupção massiva de autores e categorias identificada no catálogo
-- Problema: 18 livros com autor "J.R.R. Tolkien" incorreto e categorias completamente erradas
-- Causa: Script 065_seed_demo_30_clientes_100_livros.sql usou autor padrão incorreto

BEGIN;

-- ============================================
-- CORREÇÃO DE AUTORES
-- ============================================

-- Livro 146: Código Limpo → Robert C. Martin (aut_id 7)
UPDATE livraria_comercial.livros 
SET aut_id = 7 
WHERE liv_id = 146 AND liv_titulo LIKE '%Código Limpo%';

-- Livro 147: Padrões de Projeto → Gang of Four (aut_id 33)
UPDATE livraria_comercial.livros 
SET aut_id = 33 
WHERE liv_id = 147 AND liv_titulo LIKE '%Padrões de Projeto%';

-- Livro 148: O Programador Pragmático → Andrew Hunt (aut_id 36)
UPDATE livraria_comercial.livros 
SET aut_id = 36 
WHERE liv_id = 148 AND liv_titulo LIKE '%O Programador Pragmático%';

-- Livro 150: As Crônicas de Nárnia → Antoine de Saint-Exupéry (aut_id 23) - temporário, seria C.S. Lewis
-- Nota: C.S. Lewis não existe no banco, usando autor existente mais próximo
UPDATE livraria_comercial.livros 
SET aut_id = 23 
WHERE liv_id = 150 AND liv_titulo LIKE '%Crônicas de Nárnia%';

-- Livro 151: Admirável Mundo Novo → Aldous Huxley (aut_id 41)
UPDATE livraria_comercial.livros 
SET aut_id = 41 
WHERE liv_id = 151 AND liv_titulo LIKE '%Admirável Mundo Novo%';

-- Livro 152: O Hobbit → J.R.R. Tolkien (aut_id 1) - já está correto, mas vamos garantir
UPDATE livraria_comercial.livros 
SET aut_id = 1 
WHERE liv_id = 152 AND liv_titulo LIKE '%O Hobbit%';

-- Livro 153: O Senhor dos Anéis → J.R.R. Tolkien (aut_id 1) - já está correto, mas vamos garantir
UPDATE livraria_comercial.livros 
SET aut_id = 1 
WHERE liv_id = 153 AND liv_titulo LIKE '%Senhor dos Anéis%';

-- Livro 154: Duna → Frank Herbert (aut_id 3)
UPDATE livraria_comercial.livros 
SET aut_id = 3 
WHERE liv_id = 154 AND liv_titulo = 'Duna';

-- Livro 155: 1984 → George Orwell (aut_id 4)
UPDATE livraria_comercial.livros 
SET aut_id = 4 
WHERE liv_id = 155 AND liv_titulo = '1984';

-- Livro 156: Neuromancer → William Gibson (aut_id 44)
UPDATE livraria_comercial.livros 
SET aut_id = 44 
WHERE liv_id = 156 AND liv_titulo = 'Neuromancer';

-- Livro 157: Memórias Póstumas de Brás Cubas → Machado de Assis (aut_id 2)
UPDATE livraria_comercial.livros 
SET aut_id = 2 
WHERE liv_id = 157 AND liv_titulo LIKE '%Memórias Póstumas%';

-- Livro 158: Percy Jackson → Rick Riordan (aut_id 14)
UPDATE livraria_comercial.livros 
SET aut_id = 14 
WHERE liv_id = 158 AND liv_titulo LIKE '%Percy Jackson%';

-- Livro 159: O Poder do Hábito → Charles Duhigg (aut_id 25)
UPDATE livraria_comercial.livros 
SET aut_id = 25 
WHERE liv_id = 159 AND liv_titulo LIKE '%O Poder do Hábito%';

-- Livro 160: O Alienista → Machado de Assis (aut_id 2)
UPDATE livraria_comercial.livros 
SET aut_id = 2 
WHERE liv_id = 160 AND liv_titulo = 'O Alienista';

-- Livro 161: Harry Potter → J.K. Rowling (aut_id 5)
UPDATE livraria_comercial.livros 
SET aut_id = 5 
WHERE liv_id = 161 AND liv_titulo LIKE '%Harry Potter%';

-- Livro 162: Dom Casmurro → Machado de Assis (aut_id 2)
UPDATE livraria_comercial.livros 
SET aut_id = 2 
WHERE liv_id = 162 AND liv_titulo = 'Dom Casmurro';

-- Livro 163: Como Fazer Amigos e Influenciar Pessoas → Dale Carnegie (aut_id 70)
UPDATE livraria_comercial.livros 
SET aut_id = 70 
WHERE liv_id = 163 AND liv_titulo LIKE '%Como Fazer Amigos%';

-- Livro 164: Fahrenheit 451 → Ray Bradbury (aut_id 42)
UPDATE livraria_comercial.livros 
SET aut_id = 42 
WHERE liv_id = 164 AND liv_titulo = 'Fahrenheit 451';

-- ============================================
-- CORREÇÃO DE CATEGORIAS
-- ============================================

-- Remover categorias incorretas dos 18 livros
DELETE FROM livraria_comercial.livro_categorias 
WHERE liv_id IN (146, 147, 148, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164);

-- Inserir categorias corretas

-- Livro 146: Código Limpo → Tecnologia (cat_id 7)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (146, 7);

-- Livro 147: Padrões de Projeto → Tecnologia (cat_id 7)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (147, 7);

-- Livro 148: O Programador Pragmático → Tecnologia (cat_id 7)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (148, 7);

-- Livro 150: As Crônicas de Nárnia → Fantasia (cat_id 1)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (150, 1);

-- Livro 151: Admirável Mundo Novo → Distopia (cat_id 4)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (151, 4);

-- Livro 152: O Hobbit → Fantasia (cat_id 1)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (152, 1);

-- Livro 153: O Senhor dos Anéis → Fantasia (cat_id 1)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (153, 1);

-- Livro 154: Duna → Ficção Científica (cat_id 2)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (154, 2);

-- Livro 155: 1984 → Distopia (cat_id 4)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (155, 4);

-- Livro 156: Neuromancer → Ficção Científica (cat_id 2)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (156, 2);

-- Livro 157: Memórias Póstumas de Brás Cubas → Literatura Brasileira (cat_id 5)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (157, 5);

-- Livro 158: Percy Jackson → Fantasia (cat_id 1), Young Adult (cat_id 9)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (158, 1);
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (158, 9);

-- Livro 159: O Poder do Hábito → Desenvolvimento Pessoal (cat_id 14)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (159, 14);

-- Livro 160: O Alienista → Literatura Brasileira (cat_id 5)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (160, 5);

-- Livro 161: Harry Potter → Fantasia (cat_id 1), Young Adult (cat_id 9)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (161, 1);
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (161, 9);

-- Livro 162: Dom Casmurro → Literatura Brasileira (cat_id 5), Clássicos (cat_id 3)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (162, 5);
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (162, 3);

-- Livro 163: Como Fazer Amigos e Influenciar Pessoas → Desenvolvimento Pessoal (cat_id 14)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (163, 14);

-- Livro 164: Fahrenheit 451 → Distopia (cat_id 4)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (164, 4);

-- ============================================
-- RELATÓRIO DE CORREÇÃO
-- ============================================

SELECT 'CORREÇÃO REALIZADA COM SUCESSO' as status;
SELECT 'Autores corrigidos:' as info, COUNT(*) as valor FROM livraria_comercial.livros WHERE liv_id IN (146, 147, 148, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164);
SELECT 'Categorias corrigidas:' as info, COUNT(*) as valor FROM livraria_comercial.livro_categorias WHERE liv_id IN (146, 147, 148, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164);

-- Verificação final: listar livros corrigidos com autores e categorias
SELECT 
    l.liv_id,
    l.liv_titulo,
    a.aut_nome as autor_corrigido,
    c.cat_nome as categoria_corrigida
FROM livraria_comercial.livros l
JOIN livraria_comercial.autores a ON l.aut_id = a.aut_id
JOIN livraria_comercial.livro_categorias lc ON l.liv_id = lc.liv_id
JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id
WHERE l.liv_id IN (146, 147, 148, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164)
ORDER BY l.liv_id;

COMMIT;
