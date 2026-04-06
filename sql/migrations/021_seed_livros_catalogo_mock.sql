-- Migration: 021_seed_livros_catalogo_mock.sql
-- Descrição: Catálogo inicial (web/src/mocks/homeCatalogoMock.json). Executa após 014+.
-- Data: 2026-04-05

INSERT INTO grupos_precificacao (gpr_descricao, gpr_margem_lucro_percentual) VALUES
('Varejo', 30.00),
('Atacado', 15.00),
('Técnico', 40.00),
('Promocional', 10.00)
ON CONFLICT (gpr_descricao) DO NOTHING;

INSERT INTO autores (aut_nome, aut_descricao) VALUES
('J.R.R. Tolkien', 'John Ronald Reuel Tolkien foi um escritor, poeta, filólogo e professor universitário britânico, autor das obras clássicas O Hobbit, O Senhor dos Anéis e O Silmarillion.'),
('Machado de Assis', 'Joaquim Maria Machado de Assis foi um escritor brasileiro, amplamente considerado como o maior nome da literatura nacional.'),
('Frank Herbert', 'Franklin Patrick Herbert Jr. foi um jornalista e escritor de ficção científica dos Estados Unidos, mais conhecido como o autor do romance Duna e suas sequências.'),
('George Orwell', 'Eric Arthur Blair, mais conhecido pelo pseudônimo George Orwell, foi um romancista e ensaísta britânico.'),
('J.K. Rowling', 'Joanne Rowling, mais conhecida como J.K. Rowling, é uma escritora britânica, criadora da série de livros Harry Potter.'),
('Markus Zusak', 'Markus Zusak é um escritor australiano, mais conhecido por seu romance A Menina que Roubava Livros.'),
('Robert C. Martin', 'Robert Cecil Martin, conhecido como Uncle Bob, é um engenheiro de software americano e autor de vários livros sobre programação, incluindo Clean Code.')
ON CONFLICT DO NOTHING;

INSERT INTO editoras (edi_nome, edi_cnpj) VALUES
('HarperCollins', '00.000.000/0001-00'),
('Penguin Classics', '00.000.000/0001-01'),
('Intrínseca', '00.000.000/0001-02'),
('Companhia das Letras', '00.000.000/0001-03'),
('Rocco', '00.000.000/0001-04'),
('Alta Books', '00.000.000/0001-05')
ON CONFLICT DO NOTHING;

INSERT INTO categorias (cat_nome, cat_descricao) VALUES
('Fantasia', 'Obras de ficção fantástica com elementos mágicos e mundos imaginários.'),
('Ficção Científica', 'Histórias ambientadas em futuros distópicos ou com tecnologia avançada.'),
('Clássicos', 'Obras literárias consagradas pela crítica e pelo tempo.'),
('Distopia', 'Narrativas sobre sociedades opressivas e futuros sombrios.'),
('Literatura Brasileira', 'Obras de autores brasileiros.'),
('Negócios', 'Livros sobre gestão, liderança e desenvolvimento profissional.'),
('Tecnologia', 'Obras sobre programação, TI e inovação tecnológica.'),
('Aventura', 'Histórias de jornadas épicas e explorações.'),
('Young Adult', 'Literatura voltada para o público jovem adulto.')
ON CONFLICT (cat_nome) DO NOTHING;

INSERT INTO fornecedores (for_nome, for_cnpj, for_email, for_telefone) VALUES
('Distribuidora de Livros Saraiva', '00.000.000/0001-10', 'contato@saraiva.com.br', '(11) 3000-0000'),
('Grupo Editorial Record', '00.000.000/0001-11', 'vendas@record.com.br', '(21) 2500-0000'),
('Altas Livrarias', '00.000.000/0001-12', 'pedidos@altaslivrarias.com.br', '(11) 4000-0000')
ON CONFLICT DO NOTHING;

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'a1b2c3d4-e5f6-7890-1234-56789abcdef0'::uuid,
    'O Senhor dos Anéis: A Sociedade do Anel',
    2019,
    '1ª edição',
    '978-85-325-1077-6',
    576,
    'Numa cidadezinha indolente do Condado, um jovem hobbit é encarregado de uma imensa tarefa. Deve empreender uma perigosa viagem através da Terra-média até as Fendas da Perdição, e lá destruir o Anel do Poder — a única coisa que pode dar ao Senhor das Trevas o poder de escravizar o mundo livre.',
    23.00,
    16.00,
    0.650,
    4.0,
    '7898325107700',
    'https://m.media-amazon.com/images/I/81hCVEC0ExL._SY466_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'J.R.R. Tolkien'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'HarperCollins'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-325-1077-6');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'b2c3d4e5-f6a7-8901-2345-6789abcdef01'::uuid,
    'Dom Casmurro',
    2016,
    '1ª edição',
    '978-85-359-0277-5',
    256,
    'Dom Casmurro, de Machado de Assis, é um romance realista publicado em 1899, considerado uma das obras mais importantes da literatura brasileira. A narrativa é contada em primeira pessoa pelo protagonista, Bento Santiago, que decide escrever suas memórias para ''''atar as duas pontas da vida'''' e reviver seu passado e sua paixão por Capitu.',
    21.00,
    14.00,
    0.280,
    3.0,
    '7898535902775',
    'https://m.media-amazon.com/images/I/416E0ngf0xL._SY445_SX342_ML2_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'Machado de Assis'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Penguin Classics'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-359-0277-5');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    'f0e1d2c3-b4a5-6789-0123-456789abcdef'::uuid,
    'Duna',
    2019,
    '1ª edição',
    '978-85-250-6166-5',
    660,
    'Duna é uma obra-prima da ficção científica de Frank Herbert. O romance se passa num futuro distante num império intergaláctico, focando em Paul Atreides, herdeiro de uma família nobre encarregada de Arrakis, o planeta desértico onde se encontra a especiaria melange, a substância mais valiosa do universo.',
    23.00,
    16.00,
    0.780,
    5.0,
    '7898525061665',
    'https://m.media-amazon.com/images/I/41MRn6hy8-L._SY445_SX342_ML2_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'Frank Herbert'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Intrínseca'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-250-6166-5');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '1a2b3c4d-5e6f-7890-abcd-ef0123456789'::uuid,
    '1984',
    2020,
    '1ª edição',
    '978-85-250-6237-2',
    376,
    '1984 é um romance distópico de George Orwell. A história se passa num futuro totalitário sob o regime do Grande Irmão, onde a vigilância é constante e a verdade é manipulada. Winston Smith, o protagonista, trabalha no Ministério da Verdade reescrevendo a história, mas começa a questionar o sistema.',
    21.00,
    14.00,
    0.420,
    3.5,
    '7898525062372',
    'https://m.media-amazon.com/images/I/71XvO7F9uDL._SY466_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'George Orwell'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Companhia das Letras'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-250-6237-2');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '98765432-10fe-dcba-0987-654321fedcba'::uuid,
    'O Hobbit',
    2019,
    '1ª edição',
    '978-85-8063-226-5',
    320,
    'O Hobbit narra a aventura de Bilbo Bolseiro, um hobbit pacato que é convencido pelo mago Gandalf e um grupo de anões a participar de uma perigosa missão para recuperar um tesouro guardado pelo dragão Smaug. A jornada transforma Bilbo e revela segredos que mudarão o destino da Terra Média.',
    21.00,
    14.00,
    0.380,
    3.0,
    '7898806322655',
    'https://m.media-amazon.com/images/I/41Gz-OoRQOL._SX342_SY445_ML2_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'J.R.R. Tolkien'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'HarperCollins'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-8063-226-5');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '67890abc-def0-1234-5678-9abcdef01234'::uuid,
    'O Silmarillion',
    2018,
    '1ª edição',
    '978-85-325-1078-3',
    480,
    'O Silmarillion é uma coletânea de mitos e lendas da Terra Média, narrando a criação do mundo por Ilúvatar e a história das Eras anteriores a O Senhor dos Anéis. O livro foca na rebelião de Morgoth, o primeiro Senhor das Trevas, e na luta épica dos elfos para recuperar as Silmarils.',
    23.00,
    16.00,
    0.580,
    4.0,
    '7898532510783',
    'https://m.media-amazon.com/images/I/51EZZWkTECL._SY445_SX342_ML2_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'J.R.R. Tolkien'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'HarperCollins'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-325-1078-3');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '23456789-01ab-cdef-1234-567890abcdef'::uuid,
    'A Revolução dos Bichos',
    2019,
    '1ª edição',
    '978-85-250-3836-0',
    144,
    'A Revolução dos Bichos é uma sátira política de George Orwell. Os animais de uma fazenda, liderados pelos porcos, expulsam os humanos para criar uma sociedade igualitária, mas gradualmente o poder corrompe o novo regime, revelando como as revoluções podem se transformar nas tiranias que buscavam combater.',
    21.00,
    14.00,
    0.180,
    2.0,
    '7898525038360',
    'https://m.media-amazon.com/images/I/81qFYTFvPwL._SY466_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'George Orwell'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Companhia das Letras'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-250-3836-0');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '87654321-4321-4321-4321-876543210987'::uuid,
    'Código Limpo',
    2013,
    '1ª edição',
    '978-85-7608-597-1',
    464,
    'Código Limpo (Clean Code) é um guia essencial de Robert C. Martin para desenvolvedores que buscam escrever código de alta qualidade, legível e de fácil manutenção. O livro apresenta princípios, padrões e práticas práticas para transformar código ruim em código limpo e eficiente.',
    23.00,
    17.00,
    0.720,
    4.5,
    '7898760859711',
    'https://m.media-amazon.com/images/I/41xShlnTZTL._SY466_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'Robert C. Martin'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Alta Books'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Técnico')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-7608-597-1');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '11223344-5566-7788-9900-aabbccddeeff'::uuid,
    'Harry Potter e a Pedra Filosofal',
    2017,
    '1ª edição',
    '978-85-325-2963-1',
    264,
    'Harry Potter e a Pedra Filosofal é o primeiro livro da saga de J.K. Rowling. O órfão Harry descobre em seu 11º aniversário que é um bruxo e parte para a Escola de Magia e Bruxaria de Hogwarts, onde faz amigos e confronta o mistério por trás da Pedra Filosofal e do Lorde Voldemort.',
    21.00,
    14.00,
    0.320,
    3.0,
    '7898532529631',
    'https://m.media-amazon.com/images/I/81iqZ2HHD-L._SY466_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'J.K. Rowling'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Rocco'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-325-2963-1');

INSERT INTO livros (
    liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
    liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
    aut_id, edi_id, gpr_id
)
SELECT
    '55667788-1122-3344-aabb-ccddeeff0011'::uuid,
    'A Menina que Roubava Livros',
    2014,
    '1ª edição',
    '978-85-325-2019-5',
    576,
    'A Menina que Roubava Livros, de Markus Zusak, é narrado pela Morte e conta a história de Liesel Meminger, uma menina que vive na Alemanha Nazista durante a Segunda Guerra Mundial e encontra nos livros roubados e nas palavras uma forma de resistência e redenção em meio ao horror da guerra.',
    23.00,
    16.00,
    0.680,
    4.5,
    '7898532520195',
    'https://m.media-amazon.com/images/I/41pVlY-bbaL._SY445_SX342_ML2_.jpg',
    (SELECT aut_id FROM autores WHERE aut_nome = 'Markus Zusak'),
    (SELECT edi_id FROM editoras WHERE edi_nome = 'Intrínseca'),
    (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'Varejo')
WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = '978-85-325-2019-5');

INSERT INTO livro_categorias (liv_id, cat_id)
SELECT l.liv_id, c.cat_id
FROM livros l, categorias c
WHERE
    (l.liv_titulo LIKE '%Senhor dos Anéis%' AND c.cat_nome IN ('Fantasia', 'Aventura'))
    OR (l.liv_titulo LIKE '%Dom Casmurro%' AND c.cat_nome IN ('Clássicos', 'Literatura Brasileira'))
    OR (l.liv_titulo LIKE '%Duna%' AND c.cat_nome IN ('Ficção Científica', 'Aventura'))
    OR (l.liv_titulo LIKE '%1984%' AND c.cat_nome IN ('Distopia', 'Clássicos'))
    OR (l.liv_titulo LIKE '%O Hobbit%' AND c.cat_nome IN ('Fantasia', 'Aventura'))
    OR (l.liv_titulo LIKE '%Silmarillion%' AND c.cat_nome IN ('Fantasia', 'Clássicos'))
    OR (l.liv_titulo LIKE '%Revolução dos Bichos%' AND c.cat_nome IN ('Distopia', 'Clássicos'))
    OR (l.liv_titulo LIKE '%Código Limpo%' AND c.cat_nome IN ('Tecnologia', 'Negócios'))
    OR (l.liv_titulo LIKE '%Harry Potter%' AND c.cat_nome IN ('Fantasia', 'Young Adult'))
    OR (l.liv_titulo LIKE '%Menina que Roubava Livros%' AND c.cat_nome IN ('Young Adult', 'Clássicos'))
ON CONFLICT (liv_id, cat_id) DO NOTHING;

INSERT INTO estoques (
    liv_id,
    etq_quantidade_disponivel,
    etq_quantidade_reservada,
    etq_preco_venda,
    etq_valor_custo_atual
)
SELECT
    l.liv_id,
    CASE
        WHEN l.liv_titulo LIKE '%Senhor dos Anéis%' THEN 12
        WHEN l.liv_titulo LIKE '%Dom Casmurro%' THEN 2
        WHEN l.liv_titulo LIKE '%Duna%' THEN 8
        WHEN l.liv_titulo LIKE '%1984%' THEN 20
        WHEN l.liv_titulo LIKE '%O Hobbit%' THEN 15
        WHEN l.liv_titulo LIKE '%Silmarillion%' THEN 7
        WHEN l.liv_titulo LIKE '%Revolução dos Bichos%' THEN 25
        WHEN l.liv_titulo LIKE '%Código Limpo%' THEN 4
        WHEN l.liv_titulo LIKE '%Harry Potter%' THEN 30
        WHEN l.liv_titulo LIKE '%Menina que Roubava Livros%' THEN 10
        ELSE 0
    END,
    0,
    CASE
        WHEN l.liv_titulo LIKE '%Senhor dos Anéis%' THEN 79.90
        WHEN l.liv_titulo LIKE '%Dom Casmurro%' THEN 29.90
        WHEN l.liv_titulo LIKE '%Duna%' THEN 79.90
        WHEN l.liv_titulo LIKE '%1984%' THEN 39.90
        WHEN l.liv_titulo LIKE '%O Hobbit%' THEN 49.90
        WHEN l.liv_titulo LIKE '%Silmarillion%' THEN 59.90
        WHEN l.liv_titulo LIKE '%Revolução dos Bichos%' THEN 34.90
        WHEN l.liv_titulo LIKE '%Código Limpo%' THEN 85.00
        WHEN l.liv_titulo LIKE '%Harry Potter%' THEN 44.90
        WHEN l.liv_titulo LIKE '%Menina que Roubava Livros%' THEN 49.90
        ELSE 0.00
    END,
    CASE
        WHEN l.liv_titulo LIKE '%Senhor dos Anéis%' THEN 55.93
        WHEN l.liv_titulo LIKE '%Dom Casmurro%' THEN 20.93
        WHEN l.liv_titulo LIKE '%Duna%' THEN 55.93
        WHEN l.liv_titulo LIKE '%1984%' THEN 27.93
        WHEN l.liv_titulo LIKE '%O Hobbit%' THEN 34.93
        WHEN l.liv_titulo LIKE '%Silmarillion%' THEN 41.93
        WHEN l.liv_titulo LIKE '%Revolução dos Bichos%' THEN 24.43
        WHEN l.liv_titulo LIKE '%Código Limpo%' THEN 51.00
        WHEN l.liv_titulo LIKE '%Harry Potter%' THEN 31.43
        WHEN l.liv_titulo LIKE '%Menina que Roubava Livros%' THEN 34.93
        ELSE 0.00
    END
FROM livros l
ON CONFLICT (liv_id) DO UPDATE SET
    etq_quantidade_disponivel = EXCLUDED.etq_quantidade_disponivel,
    etq_quantidade_reservada = EXCLUDED.etq_quantidade_reservada,
    etq_preco_venda = EXCLUDED.etq_preco_venda,
    etq_valor_custo_atual = EXCLUDED.etq_valor_custo_atual;

INSERT INTO historico_entradas_estoque (
    liv_id,
    for_id,
    hee_quantidade,
    hee_valor_custo_unitario,
    hee_valor_total,
    hee_data_entrada,
    hee_numero_nota_fiscal,
    hee_observacoes
)
SELECT
    l.liv_id,
    (SELECT for_id FROM fornecedores LIMIT 1),
    CASE
        WHEN l.liv_titulo LIKE '%Senhor dos Anéis%' THEN 20
        WHEN l.liv_titulo LIKE '%Dom Casmurro%' THEN 10
        WHEN l.liv_titulo LIKE '%Duna%' THEN 15
        WHEN l.liv_titulo LIKE '%1984%' THEN 30
        WHEN l.liv_titulo LIKE '%O Hobbit%' THEN 25
        WHEN l.liv_titulo LIKE '%Silmarillion%' THEN 12
        WHEN l.liv_titulo LIKE '%Revolução dos Bichos%' THEN 40
        WHEN l.liv_titulo LIKE '%Código Limpo%' THEN 8
        WHEN l.liv_titulo LIKE '%Harry Potter%' THEN 50
        WHEN l.liv_titulo LIKE '%Menina que Roubava Livros%' THEN 18
        ELSE 0
    END,
    CASE
        WHEN l.liv_titulo LIKE '%Senhor dos Anéis%' THEN 55.93
        WHEN l.liv_titulo LIKE '%Dom Casmurro%' THEN 20.93
        WHEN l.liv_titulo LIKE '%Duna%' THEN 55.93
        WHEN l.liv_titulo LIKE '%1984%' THEN 27.93
        WHEN l.liv_titulo LIKE '%O Hobbit%' THEN 34.93
        WHEN l.liv_titulo LIKE '%Silmarillion%' THEN 41.93
        WHEN l.liv_titulo LIKE '%Revolução dos Bichos%' THEN 24.43
        WHEN l.liv_titulo LIKE '%Código Limpo%' THEN 51.00
        WHEN l.liv_titulo LIKE '%Harry Potter%' THEN 31.43
        WHEN l.liv_titulo LIKE '%Menina que Roubava Livros%' THEN 34.93
        ELSE 0.00
    END,
    0,
    CURRENT_DATE - INTERVAL '30 days',
    'NF-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0'),
    'seed_catalogo_mock_021'
FROM livros l
WHERE NOT EXISTS (
    SELECT 1 FROM historico_entradas_estoque h
    WHERE h.liv_id = l.liv_id AND h.hee_observacoes = 'seed_catalogo_mock_021'
);

UPDATE historico_entradas_estoque
SET hee_valor_total = hee_quantidade * hee_valor_custo_unitario
WHERE hee_observacoes = 'seed_catalogo_mock_021';

UPDATE livros SET liv_uuid = 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'::uuid WHERE liv_isbn = '978-85-325-1077-6';
UPDATE livros SET liv_uuid = 'b2c3d4e5-f6a7-8901-2345-6789abcdef01'::uuid WHERE liv_isbn = '978-85-359-0277-5';
UPDATE livros SET liv_uuid = 'f0e1d2c3-b4a5-6789-0123-456789abcdef'::uuid WHERE liv_isbn = '978-85-250-6166-5';
UPDATE livros SET liv_uuid = '1a2b3c4d-5e6f-7890-abcd-ef0123456789'::uuid WHERE liv_isbn = '978-85-250-6237-2';
UPDATE livros SET liv_uuid = '98765432-10fe-dcba-0987-654321fedcba'::uuid WHERE liv_isbn = '978-85-8063-226-5';
UPDATE livros SET liv_uuid = '67890abc-def0-1234-5678-9abcdef01234'::uuid WHERE liv_isbn = '978-85-325-1078-3';
UPDATE livros SET liv_uuid = '23456789-01ab-cdef-1234-567890abcdef'::uuid WHERE liv_isbn = '978-85-250-3836-0';
UPDATE livros SET liv_uuid = '87654321-4321-4321-4321-876543210987'::uuid WHERE liv_isbn = '978-85-7608-597-1';
UPDATE livros SET liv_uuid = '11223344-5566-7788-9900-aabbccddeeff'::uuid WHERE liv_isbn = '978-85-325-2963-1';
UPDATE livros SET liv_uuid = '55667788-1122-3344-aabb-ccddeeff0011'::uuid WHERE liv_isbn = '978-85-325-2019-5';
