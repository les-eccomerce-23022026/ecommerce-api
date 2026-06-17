-- Migration: 064_seed_livros_ia_cenarios.sql
-- Livros adicionais para cenários de teste do assistente IA (gêneros, públicos, preços)

CREATE EXTENSION IF NOT EXISTS unaccent;

INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao)
SELECT v.nome, v.descricao
FROM (
    VALUES
        ('Diana Gabaldon', 'Autora de romance histórico, conhecida por Outlander.'),
        ('Rick Riordan', 'Autor de ficção juvenil com mitologia, série Percy Jackson e derivados.'),
        ('Agatha Christie', 'Rainha do crime, autora de mistérios clássicos.'),
        ('Terry Pratchett', 'Autor de humor fantástico, série Discworld.'),
        ('Liu Cixin', 'Autor chinês de ficção científica hard, Trissolar.'),
        ('Isabel Allende', 'Autora de romance histórico e realismo mágico.'),
        ('Augusto César', 'Autor brasileiro de ficção científica.')
) AS v(nome, descricao)
WHERE NOT EXISTS (
    SELECT 1 FROM livraria_comercial.autores a WHERE a.aut_nome = v.nome
);

INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES
('Romance', 'Narrativas centradas em relações e emoções.'),
('Terror', 'Obras de horror e suspense sobrenatural.'),
('Mistério', 'Enigmas, investigações e crimes.'),
('Humor', 'Narrativas leves e cômicas.'),
('Desenvolvimento Pessoal', 'Autoajuda e crescimento pessoal.')
ON CONFLICT (cat_nome) DO NOTHING;

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c1111111-1111-4111-8111-111111111111'::uuid,
    'Outlander: A Série — Vol. 1',
    2015,
    '1ª edição',
    '978-85-325-9001-1',
    720,
    'Romance histórico: Claire Randall, enfermeira da Segunda Guerra, viaja no tempo para a Escócia do século XVIII e vive paixão e intriga política. Ideal para fãs de época e drama.',
    23.00, 16.00, 0.700, 4.0, '7898532590011', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Diana Gabaldon'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Sextante'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9001-1');

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c2222222-2222-4222-8222-222222222222'::uuid,
    'O Filho de Netuno',
    2013,
    '1ª edição',
    '978-85-325-9002-2',
    560,
    'Ficção juvenil e mitologia grega: Percy Jackson retorna ao Acampamento Meio-Sangue em nova missão. Perfeito para leitores de 12 anos que gostaram de Percy Jackson.',
    21.00, 14.00, 0.450, 3.5, '7898532590022', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Rick Riordan'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9002-2');

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c3333333-3333-4333-8333-333333333333'::uuid,
    'Assassinato no Expresso do Oriente',
    2018,
    '1ª edição',
    '978-85-325-9003-3',
    288,
    'Mistério clássico de Agatha Christie: Hercule Poirot investiga assassinato em trem de luxo. Ambiente século XX, enigmas e suspeitos memoráveis.',
    21.00, 14.00, 0.320, 3.0, '7898532590033', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Agatha Christie'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9003-3');

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c4444444-4444-4444-8444-444444444444'::uuid,
    'Guards! Guards!',
    2016,
    '1ª edição',
    '978-85-325-9004-4',
    352,
    'Humor fantástico leve: Ankh-Morpork enfrenta dragão e caos com ironia do Discworld. Leitura divertida para praia e viagens.',
    21.00, 14.00, 0.380, 3.0, '7898532590044', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Terry Pratchett'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9004-4');

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c5555555-5555-4555-8555-555555555555'::uuid,
    'O Problema dos Três Corpos',
    2019,
    '1ª edição',
    '978-85-325-9005-5',
    400,
    'Hard science fiction: física, astrofísica e primeiro contato durante a Revolução Cultural. Ficção científica dura de Liu Cixin, tradução PT.',
    23.00, 16.00, 0.520, 4.0, '7898532590055', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Liu Cixin'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Aleph'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9005-5');

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c6666666-6666-4666-8666-666666666666'::uuid,
    'A Casa dos Espíritos',
    2017,
    '1ª edição',
    '978-85-325-9006-6',
    448,
    'Romance histórico e realismo mágico: saga da família Trueba no Chile. Presente emocionante para leitoras maduras que apreciam época e drama familiar.',
    23.00, 16.00, 0.500, 4.0, '7898532590066', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Isabel Allende'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Arqueiro'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9006-6');

INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'c7777777-7777-4777-8777-777777777777'::uuid,
    'Cidade Ilhada',
    2014,
    '1ª edição',
    '978-85-325-9007-7',
    280,
    'Ficção científica brasileira: distopia urbana e tecnologia no Brasil. Hard sci-fi nacional para leitores que buscam autores BR.',
    21.00, 14.00, 0.350, 3.0, '7898532590077', NULL,
    (SELECT aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Augusto César'),
    (SELECT edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Aleph'),
    (SELECT gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao = 'Livros de Ficção')
WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-85-325-9007-7');

INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
SELECT l.liv_id, c.cat_id
FROM livraria_comercial.livros l, livraria_comercial.categorias c
WHERE
    (l.liv_isbn = '978-85-325-9001-1' AND c.cat_nome IN ('Romance', 'Clássicos'))
    OR (l.liv_isbn = '978-85-325-9002-2' AND c.cat_nome IN ('Young Adult', 'Fantasia'))
    OR (l.liv_isbn = '978-85-325-9003-3' AND c.cat_nome IN ('Mistério', 'Clássicos'))
    OR (l.liv_isbn = '978-85-325-9004-4' AND c.cat_nome IN ('Humor', 'Fantasia'))
    OR (l.liv_isbn = '978-85-325-9005-5' AND c.cat_nome IN ('Ficção Científica'))
    OR (l.liv_isbn = '978-85-325-9006-6' AND c.cat_nome IN ('Romance', 'Literatura Brasileira'))
    OR (l.liv_isbn = '978-85-325-9007-7' AND c.cat_nome IN ('Ficção Científica', 'Literatura Brasileira'))
ON CONFLICT (liv_id, cat_id) DO NOTHING;

INSERT INTO livraria_comercial.estoques (
    liv_id, loj_id, etq_quantidade_disponivel, etq_quantidade_reservada,
    etq_preco_venda, etq_valor_custo_atual
)
SELECT l.liv_id, 1, 15, 0,
    CASE l.liv_isbn
        WHEN '978-85-325-9001-1' THEN 59.90
        WHEN '978-85-325-9002-2' THEN 44.90
        WHEN '978-85-325-9003-3' THEN 39.90
        WHEN '978-85-325-9004-4' THEN 49.90
        WHEN '978-85-325-9005-5' THEN 54.90
        WHEN '978-85-325-9006-6' THEN 52.90
        WHEN '978-85-325-9007-7' THEN 48.90
        ELSE 49.90
    END,
    30.00
FROM livraria_comercial.livros l
WHERE l.liv_isbn LIKE '978-85-325-900%'
  AND NOT EXISTS (
      SELECT 1
      FROM livraria_comercial.estoques e
      WHERE e.liv_id = l.liv_id AND e.loj_id = 1
  );
