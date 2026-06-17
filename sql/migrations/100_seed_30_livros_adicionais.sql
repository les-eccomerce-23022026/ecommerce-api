-- Seed: 30 livros adicionais para atingir 50 livros no catálogo
-- Data: 2026-06-08
-- Objetivo: Expandir catálogo com diferentes categorias e estoques aleatórios (1-25)

-- Inserir 30 livros em categorias variadas
INSERT INTO livraria_comercial.livros (liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, aut_id, edi_id, gpr_id, liv_ativo, liv_imagem_url) VALUES
-- Aventura
('O Código Da Vinci', 'o codigo da vinci', 2003, '1ª', '978-85-01-00021-01', 480, 'Um thriller que mistura arte, história e religião', 23.0, 15.5, 0.750, 2.5, '7891234567890', 9, 1, 1, true, NULL),
('A Ilha do Tesouro', 'a ilha do tesouro', 1900, '1ª', '978-85-01-00021-02', 224, 'A clássica história de piratas e aventuras', 20.0, 13.0, 0.300, 1.8, '7891234567891', 10, 1, 1, true, NULL),

-- Biografia
('Steve Jobs', 'steve jobs', 2011, '1ª', '978-85-01-00021-03', 656, 'A biografia autorizada do cofundador da Apple', 24.0, 16.0, 0.900, 3.0, '7891234567892', 74, 1, 1, true, NULL),
('Einstein: Sua Vida, Seu Universo', 'einstein sua vida seu universo', 2007, '1ª', '978-85-01-00021-04', 320, 'Biografia do gênio da física', 21.0, 14.0, 0.450, 2.0, '7891234567893', 41, 1, 1, true, NULL),

-- Ciência
('Uma Breve História do Tempo', 'uma breve historia do tempo', 1988, '1ª', '978-85-01-00021-05', 256, 'O universo explicado por Stephen Hawking', 20.0, 13.0, 0.280, 1.5, '7891234567894', 41, 1, 1, true, NULL),
('Cosmos', 'cosmos', 1980, '1ª', '978-85-01-00021-06', 365, 'Uma jornada pelo universo', 22.0, 15.0, 0.500, 2.2, '7891234567895', 41, 1, 1, true, NULL),

-- Clássicos
('Dom Casmurro', 'dom casmurro', 1900, '1ª', '978-85-01-00021-07', 256, 'O clássico de Machado de Assis', 19.0, 12.0, 0.250, 1.5, '7891234567896', 77, 1, 1, true, NULL),
('Orgulho e Preconceito', 'orgulho e preconceito', 1900, '1ª', '978-85-01-00021-08', 432, 'Romance clássico de Jane Austen', 21.0, 14.0, 0.400, 2.0, '7891234567897', 10, 1, 1, true, NULL),

-- Desenvolvimento Pessoal
('O Poder do Hábito', 'o poder do habito', 2012, '1ª', '978-85-01-00021-09', 400, 'Como criar hábitos positivos', 22.0, 15.0, 0.450, 2.0, '7891234567898', 74, 1, 1, true, NULL),
('Como Fazer Amigos e Influenciar Pessoas', 'como fazer amigos e influenciar pessoas', 1940, '1ª', '978-85-01-00021-10', 288, 'O clássico das relações humanas', 20.0, 13.0, 0.320, 1.6, '7891234567899', 74, 1, 1, true, NULL),

-- Distopia
('1984', '1984', 1949, '1ª', '978-85-01-00021-11', 328, 'O distópico clássico de George Orwell', 19.0, 12.0, 0.300, 1.5, '7891234567900', 41, 1, 1, true, NULL),
('Fahrenheit 451', 'fahrenheit 451', 1953, '1ª', '978-85-01-00021-12', 192, 'Um mundo onde livros são proibidos', 18.0, 11.0, 0.220, 1.3, '7891234567901', 41, 1, 1, true, NULL),

-- Fantasia
('As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', 'as cronicas de narnia o leao a feiticeira e o guarda roupa', 1950, '1ª', '978-85-01-00021-13', 176, 'A entrada mágica para Nárnia', 19.0, 13.0, 0.250, 1.5, '7891234567902', 23, 1, 1, true, NULL),
('O Hobbit', 'o hobbit', 1937, '1ª', '978-85-01-00021-14', 310, 'A jornada de Bilbo Bolseiro', 20.0, 13.0, 0.350, 1.8, '7891234567903', 10, 1, 1, true, NULL),

-- Filosofia
('Meditações', 'meditacoes', 1900, '1ª', '978-85-01-00021-15', 256, 'Os pensamentos do imperador romano Marco Aurélio', 19.0, 12.0, 0.280, 1.5, '7891234567904', 41, 1, 1, true, NULL),
('Assim Falou Zaratustra', 'assim falou zaratustra', 1900, '1ª', '978-85-01-00021-16', 352, 'A obra filosófica de Nietzsche', 21.0, 14.0, 0.400, 2.0, '7891234567905', 41, 1, 1, true, NULL),

-- História
('Sapiens: Uma Breve História da Humanidade', 'sapiens uma breve historia da humanidade', 2011, '1ª', '978-85-01-00021-17', 444, 'A evolução humana dos primórdios aos dias atuais', 23.0, 15.5, 0.700, 2.5, '7891234567906', 41, 1, 1, true, NULL),
('Gun, Germs, and Steel', 'gun germs and steel', 1997, '1ª', '978-85-01-00021-18', 480, 'Os destinos das sociedades humanas', 22.0, 15.0, 0.650, 2.3, '7891234567907', 41, 1, 1, true, NULL),

-- Humor
('Diário de um Banana', 'diario de um banana', 2007, '1ª', '978-85-01-00021-19', 224, 'As aventuras hilárias de Greg Heffley', 20.0, 13.0, 0.300, 1.5, '7891234567908', 74, 1, 1, true, NULL),
('O Mundo de Sofia', 'o mundo de sofia', 1991, '1ª', '978-85-01-00021-20', 518, 'Um romance filosófico divertido', 21.0, 14.0, 0.550, 2.2, '7891234567909', 41, 1, 1, true, NULL),

-- Infantil
('O Pequeno Príncipe', 'o pequeno principe', 1943, '1ª', '978-85-01-00021-21', 96, 'Uma fábula sobre amor e amizade', 18.0, 11.0, 0.150, 1.0, '7891234567910', 23, 1, 1, true, NULL),
('Alice no País das Maravilhas', 'alice no pais das maravilhas', 1900, '1ª', '978-85-01-00021-22', 160, 'A aventura de Alice no mundo fantástico', 19.0, 12.0, 0.200, 1.3, '7891234567911', 10, 1, 1, true, NULL),

-- Literatura Brasileira
('Capitães da Areia', 'capitaes da areia', 1940, '1ª', '978-85-01-00021-23', 312, 'A vida dos menores abandonados em Salvador', 20.0, 13.0, 0.350, 1.8, '7891234567912', 77, 1, 1, true, NULL),
('Vidas Secas', 'vidas secas', 1940, '1ª', '978-85-01-00021-24', 160, 'A luta de uma família no sertão', 19.0, 12.0, 0.220, 1.4, '7891234567913', 77, 1, 1, true, NULL),

-- Mistério
('O Silêncio dos Inocentes', 'o silencio dos inocentes', 1988, '1ª', '978-85-01-00021-25', 368, 'Um thriller psicológico intenso', 21.0, 14.0, 0.420, 2.0, '7891234567914', 9, 1, 1, true, NULL),
('A Garota do Trem', 'a garota do trem', 2015, '1ª', '978-85-01-00021-26', 336, 'Um mistério envolvendo um desaparecimento', 20.0, 13.0, 0.380, 1.9, '7891234567915', 74, 1, 1, true, NULL),

-- Negócios
('A Startup Enxuta', 'a startup enxuta', 2011, '1ª', '978-85-01-00021-27', 336, 'Como criar empresas ágeis e lucrativas', 21.0, 14.0, 0.400, 2.0, '7891234567916', 74, 1, 1, true, NULL),
('O Investidor Inteligente', 'o investidor inteligente', 1950, '1ª', '978-85-01-00021-28', 640, 'O guia definitivo para investimentos', 24.0, 16.0, 0.850, 3.2, '7891234567917', 74, 1, 1, true, NULL),

-- Romance
('O Amor nos Tempos do Cólera', 'o amor nos tempos do colera', 1985, '1ª', '978-85-01-00021-29', 368, 'Uma história de amor que dura décadas', 21.0, 14.0, 0.420, 2.0, '7891234567918', 74, 1, 1, true, NULL),
('Jane Eyre', 'jane eyre', 1900, '1ª', '978-85-01-00021-30', 504, 'O romance gótico clássico', 20.0, 13.0, 0.480, 2.2, '7891234567919', 10, 1, 1, true, NULL),

-- Tecnologia
('Clean Code', 'clean code', 2008, '1ª', '978-85-01-00021-31', 464, 'Código limpo: práticas de programação', 23.0, 15.0, 0.550, 2.3, '7891234567920', 36, 1, 1, true, NULL),
('Design Patterns', 'design patterns', 1994, '1ª', '978-85-01-00021-32', 416, 'Padrões de projeto orientados a objetos', 22.0, 14.0, 0.500, 2.1, '7891234567921', 35, 1, 1, true, NULL),

-- Terror
('It: A Coisa', 'it a coisa', 1986, '1ª', '978-85-01-00021-33', 1138, 'O terror de Stephen King', 24.0, 16.0, 1.200, 4.0, '7891234567922', 74, 1, 1, true, NULL),
('O Exorcista', 'o exorcista', 1971, '1ª', '978-85-01-00021-34', 400, 'O clássico do terror sobrenatural', 20.0, 13.0, 0.380, 1.9, '7891234567923', 74, 1, 1, true, NULL),

-- Young Adult
('Jogos Vorazes', 'jogos vorazes', 2008, '1ª', '978-85-01-00021-35', 374, 'A distopia young adult best-seller', 20.0, 13.0, 0.400, 2.0, '7891234567924', 74, 1, 1, true, NULL),
('Divergente', 'divergente', 2011, '1ª', '978-85-01-00021-36', 487, 'Uma sociedade dividida em facções', 21.0, 14.0, 0.450, 2.1, '7891234567925', 74, 1, 1, true, NULL);

-- Associar livros às categorias (inserções diretas por ID)
-- IDs dos novos livros inseridos: 167-202 (36 livros)
INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES
-- Aventura (cat_id=8): livros 167-168
(167, 8), (168, 8),
-- Biografia (cat_id=16): livros 169-170
(169, 16), (170, 16),
-- Ciência (cat_id=19): livros 171-172
(171, 19), (172, 19),
-- Clássicos (cat_id=3): livros 173-174
(173, 3), (174, 3),
-- Desenvolvimento Pessoal (cat_id=14): livros 175-176
(175, 14), (176, 14),
-- Distopia (cat_id=4): livros 177-178
(177, 4), (178, 4),
-- Fantasia (cat_id=1): livros 179-180
(179, 1), (180, 1),
-- Filosofia (cat_id=18): livros 181-182
(181, 18), (182, 18),
-- História (cat_id=15): livros 183-184
(183, 15), (184, 15),
-- Humor (cat_id=13): livros 185-186
(185, 13), (186, 13),
-- Infantil (cat_id=17): livros 187-188
(187, 17), (188, 17),
-- Literatura Brasileira (cat_id=5): livros 189-190
(189, 5), (190, 5),
-- Mistério (cat_id=12): livros 191-192
(191, 12), (192, 12),
-- Negócios (cat_id=6): livros 193-194
(193, 6), (194, 6),
-- Romance (cat_id=10): livros 195-196
(195, 10), (196, 10),
-- Tecnologia (cat_id=7): livros 197-198
(197, 7), (198, 7),
-- Terror (cat_id=11): livros 199-200
(199, 11), (200, 11),
-- Young Adult (cat_id=9): livros 201-202
(201, 9), (202, 9);

-- Criar estoques com quantidades aleatórias entre 1 e 25 para os novos livros
-- Usa loj_id=32 (Livraria Padrão) e preços aleatórios entre 20 e 100
-- IDs dos novos livros: 167-202 (36 livros inseridos acima)
INSERT INTO livraria_comercial.estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_ativo, loj_id, etq_criado_em, etq_atualizado_em)
SELECT 
  l.liv_id,
  (FLOOR(RANDOM() * 25) + 1)::integer as etq_quantidade_disponivel,
  0 as etq_quantidade_reservada,
  (FLOOR(RANDOM() * 80) + 20)::numeric(10,2) as etq_preco_venda,
  true as etq_ativo,
  32 as loj_id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM livraria_comercial.livros l
WHERE l.liv_id >= 167 AND l.liv_id <= 202;

-- Atualizar estoques dos livros existentes também para quantidades aleatórias entre 1 e 25
UPDATE livraria_comercial.estoques
SET etq_quantidade_disponivel = (FLOOR(RANDOM() * 25) + 1)::integer,
    etq_atualizado_em = CURRENT_TIMESTAMP
WHERE liv_id <= 20;

-- Verificar resultado
SELECT 'Total de livros no catálogo:' as info, COUNT(*) as valor FROM livraria_comercial.livros WHERE liv_ativo = true
UNION ALL
SELECT 'Total de livros novos inseridos:', COUNT(*) FROM livraria_comercial.livros WHERE liv_id > 20
UNION ALL
SELECT 'Média de estoque:', AVG(etq_quantidade_disponivel)::integer FROM livraria_comercial.estoques
UNION ALL
SELECT 'Total em estoque:', SUM(etq_quantidade_disponivel) FROM livraria_comercial.estoques;
