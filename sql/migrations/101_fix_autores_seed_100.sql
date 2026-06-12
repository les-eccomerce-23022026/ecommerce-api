-- Migration: 101_fix_autores_seed_100
-- Data: 2026-06-11
-- Objetivo: Corrigir vínculos autor x livro corrompidos pelo seed 100.
--
-- PROBLEMA: O seed 100_seed_30_livros_adicionais.sql fixou valores numéricos
-- arbitrários em aut_id (ex.: Jane Eyre -> 10 = "Augusto César",
-- Uma Breve História do Tempo -> 41 = "Aldous Huxley"). Como a recomendação de
-- IA expõe o campo `autor` (vindo do metadata do ChromaDB, que por sua vez é
-- indexado a partir do catálogo), os autores errados apareciam como
-- "alucinações" sem relação com a realidade.
--
-- SOLUÇÃO: (1) inserir autores reais ausentes do catálogo e (2) reatribuir o
-- aut_id correto de cada livro por ISBN, via lookup por nome (idempotente).
-- Após aplicar, é necessário reindexar o ChromaDB (POST /api/ia/reindexar) para
-- propagar os autores corrigidos ao metadata usado pela recomendação.

BEGIN;

-- 1) Autores reais ausentes (guardados por NOT EXISTS pois não há unique em aut_nome)
INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao)
SELECT v.nome, v.descricao
FROM (VALUES
  ('Robert Louis Stevenson', 'Autor de A Ilha do Tesouro.'),
  ('Stephen Hawking',         'Físico teórico, autor de Uma Breve História do Tempo.'),
  ('Carl Sagan',              'Astrônomo e divulgador científico, autor de Cosmos.'),
  ('C.S. Lewis',              'Autor das Crônicas de Nárnia.'),
  ('Friedrich Nietzsche',     'Filósofo, autor de Assim Falou Zaratustra.'),
  ('Jared Diamond',           'Autor de Guns, Germs, and Steel.'),
  ('Lewis Carroll',           'Autor de Alice no País das Maravilhas.'),
  ('Thomas Harris',           'Autor de O Silêncio dos Inocentes.'),
  ('Charlotte Brontë',        'Autora de Jane Eyre.'),
  ('William Peter Blatty',    'Autor de O Exorcista.'),
  ('Suzanne Collins',         'Autora de Jogos Vorazes.'),
  ('Veronica Roth',           'Autora de Divergente.')
) AS v(nome, descricao)
WHERE NOT EXISTS (
  SELECT 1 FROM livraria_comercial.autores a WHERE a.aut_nome = v.nome
);

-- 2) Reatribuição correta por ISBN. MIN(aut_id) cobre nomes duplicados no seed.
UPDATE livraria_comercial.livros AS l
SET aut_id = sub.aut_id,
    liv_atualizado_em = NOW()
FROM (
  SELECT m.isbn, (
    SELECT MIN(a.aut_id) FROM livraria_comercial.autores a WHERE a.aut_nome = m.autor
  ) AS aut_id
  FROM (VALUES
    ('978-85-01-00021-01', 'Dan Brown'),
    ('978-85-01-00021-02', 'Robert Louis Stevenson'),
    ('978-85-01-00021-03', 'Walter Isaacson'),
    ('978-85-01-00021-04', 'Walter Isaacson'),
    ('978-85-01-00021-05', 'Stephen Hawking'),
    ('978-85-01-00021-06', 'Carl Sagan'),
    ('978-85-01-00021-07', 'Machado de Assis'),
    ('978-85-01-00021-08', 'Jane Austen'),
    ('978-85-01-00021-09', 'Charles Duhigg'),
    ('978-85-01-00021-10', 'Dale Carnegie'),
    ('978-85-01-00021-11', 'George Orwell'),
    ('978-85-01-00021-12', 'Ray Bradbury'),
    ('978-85-01-00021-13', 'C.S. Lewis'),
    ('978-85-01-00021-14', 'J.R.R. Tolkien'),
    ('978-85-01-00021-15', 'Marco Aurélio'),
    ('978-85-01-00021-16', 'Friedrich Nietzsche'),
    ('978-85-01-00021-17', 'Yuval Noah Harari'),
    ('978-85-01-00021-18', 'Jared Diamond'),
    ('978-85-01-00021-19', 'Jeff Kinney'),
    ('978-85-01-00021-20', 'Jostein Gaarder'),
    ('978-85-01-00021-21', 'Antoine de Saint-Exupéry'),
    ('978-85-01-00021-22', 'Lewis Carroll'),
    ('978-85-01-00021-23', 'Jorge Amado'),
    ('978-85-01-00021-24', 'Graciliano Ramos'),
    ('978-85-01-00021-25', 'Thomas Harris'),
    ('978-85-01-00021-26', 'Paula Hawkins'),
    ('978-85-01-00021-27', 'Eric Ries'),
    ('978-85-01-00021-28', 'Benjamin Graham'),
    ('978-85-01-00021-29', 'Gabriel García Márquez'),
    ('978-85-01-00021-30', 'Charlotte Brontë'),
    ('978-85-01-00021-31', 'Robert C. Martin'),
    ('978-85-01-00021-32', 'Gang of Four'),
    ('978-85-01-00021-33', 'Stephen King'),
    ('978-85-01-00021-34', 'William Peter Blatty'),
    ('978-85-01-00021-35', 'Suzanne Collins'),
    ('978-85-01-00021-36', 'Veronica Roth')
  ) AS m(isbn, autor)
) AS sub
WHERE l.liv_isbn = sub.isbn
  AND sub.aut_id IS NOT NULL;

COMMIT;
