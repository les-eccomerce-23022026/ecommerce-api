-- Migration: 112_seed_livros_categorias_completas.sql
-- Descrição: Adiciona 5 livros reais em cada categoria com estoque > 10
-- Data: 2026-06-16
-- Motivo: Garantir todas as categorias tenham ≥5 livros para testes RAG

-- Autores adicionais
INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) VALUES
('Bram Stoker', 'Abraham Stoker foi um escritor irlandês, autor de Dracula.'),
('Stephen King', 'Stephen Edwin King é um escritor americano de horror, ficção sobrenatural e suspense.'),
('Augusto César', 'Marco Aurélio Antônino foi imperador romano e filósofo estoico.'),
('Terry Pratchett', 'Sir Terence David John Pratchett foi um autor inglês de fantasia.')
ON CONFLICT DO NOTHING;

-- Categorias adicionais
INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES
('Humor', 'Obras cômicas e satíricas.'),
('Infantil', 'Literatura voltada para crianças.'),
('Romance', 'Histórias de amor e relacionamentos.'),
('Mistério', 'Narrativas de investigação e suspense.'),
('Biografia', 'Vidas e memórias de pessoas notáveis.'),
('Ciência', 'Obras científicas e de divulgação científica.'),
('Terror', 'Literatura de horror e sustos.'),
('Filosofia', 'Obras filosóficas e pensamento crítico.'),
('História', 'Livros sobre eventos históricos.'),
('Desenvolvimento Pessoal', 'Autoajuda e desenvolvimento pessoal.')
ON CONFLICT DO NOTHING;

-- Nota: Os livros foram adicionados via API (script popular-categorias.sh)
-- Este migration serve como documentação do que foi populado
-- Para recriar o estado, execute o script bash: backend/popular-categorias.sh
