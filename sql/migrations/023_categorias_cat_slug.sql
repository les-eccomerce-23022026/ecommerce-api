-- Migration: 023_categorias_cat_slug.sql
-- Slug único por categoria para URLs e query string (GET /livros?categoria=).

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS cat_slug VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_cat_slug
  ON categorias (cat_slug)
  WHERE cat_slug IS NOT NULL;

COMMENT ON COLUMN categorias.cat_slug IS 'Identificador estável para URL (ex.: ficcao, fantasia).';

UPDATE categorias SET cat_slug = 'fantasia' WHERE cat_nome = 'Fantasia' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'ficcao-cientifica' WHERE cat_nome = 'Ficção Científica' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'classicos' WHERE cat_nome = 'Clássicos' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'distopia' WHERE cat_nome = 'Distopia' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'literatura-brasileira' WHERE cat_nome = 'Literatura Brasileira' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'negocios' WHERE cat_nome = 'Negócios' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'tecnologia' WHERE cat_nome = 'Tecnologia' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'aventura' WHERE cat_nome = 'Aventura' AND (cat_slug IS NULL OR cat_slug = '');
UPDATE categorias SET cat_slug = 'young-adult' WHERE cat_nome = 'Young Adult' AND (cat_slug IS NULL OR cat_slug = '');
