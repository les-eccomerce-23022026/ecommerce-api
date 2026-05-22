-- =============================================================================
-- DML 003 — Seed Multi-Tenant Completo (3 Lojas, 3 Admins, 15 Produtos, 9 Clientes)
-- Sistema: LES – E-Commerce de Livros
-- Execute após 002_seed_usuario_admin_inicial.sql.
--
-- Este script substitui o conceito de "Administrador Mestre" por um modelo
-- multi-tenant onde cada administrador gerencia sua própria loja.
--
-- Estrutura:
-- - 3 Lojas (livraria-sao-paulo, livraria-rio, livraria-belo-horizonte)
-- - 3 Administradores (1 por loja)
-- - 15 Livros (5 por loja)
-- - 9 Clientes (3 por loja)
-- - Estoques e preços por loja
-- =============================================================================

DO $$
DECLARE
    v_id_papel_admin  INTEGER;
    v_id_papel_cliente INTEGER;
BEGIN
    -- Obtém os IDs dos papéis
    SELECT pap_id INTO v_id_papel_admin FROM livraria_comercial.papeis WHERE pap_descricao = 'admin' LIMIT 1;
    SELECT pap_id INTO v_id_papel_cliente FROM livraria_comercial.papeis WHERE pap_descricao = 'cliente' LIMIT 1;
    
    IF v_id_papel_admin IS NULL OR v_id_papel_cliente IS NULL THEN
        RAISE EXCEPTION 'Papeis não encontrados. Execute 001_seeds_tipos_referencia.sql antes.';
    END IF;
    
    -- ========================================================================
    -- 1. CRIAR 3 LOJAS
    -- ========================================================================
    
    -- Loja 1: Livraria São Paulo
    INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
    VALUES (
        gen_random_uuid(),
        'Livraria São Paulo',
        'livraria-sao-paulo',
        '12.345.678/0001-90',
        TRUE
    ) ON CONFLICT (loj_slug) DO NOTHING;
    
    -- Loja 2: Livraria Rio de Janeiro
    INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
    VALUES (
        gen_random_uuid(),
        'Livraria Rio de Janeiro',
        'livraria-rio',
        '12.345.678/0002-71',
        TRUE
    ) ON CONFLICT (loj_slug) DO NOTHING;
    
    -- Loja 3: Livraria Belo Horizonte
    INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
    VALUES (
        gen_random_uuid(),
        'Livraria Belo Horizonte',
        'livraria-belo-horizonte',
        '12.345.678/0003-52',
        TRUE
    ) ON CONFLICT (loj_slug) DO NOTHING;
    
    -- ========================================================================
    -- 2. CRIAR 3 ADMINISTRADORES (1 por loja)
    -- Senhas: Admin@123 (hash bcrypt rounds=10)
    -- Hash: $2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG
    -- ========================================================================
    
    -- Admin 1: São Paulo
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'Carlos Silva',
        'carlos.silva@livrariasp.com.br',
        '123.456.789-01',
        '$2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG',
        v_id_papel_admin,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1)
    ) ON CONFLICT (usu_email) DO NOTHING;
    
    -- Admin 2: Rio de Janeiro
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'Ana Oliveira',
        'ana.oliveira@livrariario.com.br',
        '234.567.890-12',
        '$2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG',
        v_id_papel_admin,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1)
    ) ON CONFLICT (usu_email) DO NOTHING;
    
    -- Admin 3: Belo Horizonte
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'Roberto Costa',
        'roberto.costa@livrariabh.com.br',
        '345.678.901-23',
        '$2b$10$yuWANtRYomduSkkaeE8BuurLgaMZ1zs1a8Ga2S3YS6YaxW8GDQ0VG',
        v_id_papel_admin,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1)
    ) ON CONFLICT (usu_email) DO NOTHING;
    
    -- ========================================================================
    -- 3. CRIAR 15 LIVROS (5 por loja)
    -- ========================================================================
    
    -- Livros para Loja São Paulo (Fantasia e Aventura)
    INSERT INTO livraria_comercial.livros (
        liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_isbn,
        aut_id, edi_id, gpr_id, liv_ativo, liv_imagem_url, liv_sinopse
    )
    VALUES
    (
        gen_random_uuid(),
        'A Sociedade do Anel',
        lower('A Sociedade do Anel'),
        1954,
        '9788532510776',
        1, 1, 1, TRUE,
        'https://m.media-amazon.com/images/I/81hCVEC0ExL._SY466_.jpg',
        'Em uma terra fantástica e única, um hobbit recebe de presente de seu tio um anel mágico e invisível. Mas esse anel é, na verdade, o mais poderoso instrumento de poder existente.'
    ),
    (
        gen_random_uuid(),
        'As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa',
        lower('As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa'),
        1950,
        '9788578270870',
        1, 2, 1, TRUE,
        'https://m.media-amazon.com/images/I/91xRz58JtDL._SY466_.jpg',
        'Quatro crianças descobrem um mundo mágico através de um guarda-roupa e embarcam em uma aventura épica.'
    ),
    (
        gen_random_uuid(),
        'O Hobbit',
        lower('O Hobbit'),
        1937,
        '9788532506166',
        1, 1, 1, TRUE,
        'https://m.media-amazon.com/images/I/41Gz-OoRQOL._SX342_SY445_ML2_.jpg',
        'Bilbo Bolseiro é um hobbit que desfruta de uma vida confortável e sem ambiciona. Mas tudo muda quando o mago Gandalf chega à sua porta.'
    ),
    (
        gen_random_uuid(),
        'Harry Potter e a Pedra Filosofal',
        lower('Harry Potter e a Pedra Filosofal'),
        1997,
        '9788532529631',
        5, 3, 1, TRUE,
        'https://m.media-amazon.com/images/I/81iqZ2HHD-L._SY466_.jpg',
        'Harry Potter é um garoto órfão que descobre aos 11 anos que é um bruxo e é convidado a estudar na Escola de Magia e Bruxaria Hogwarts.'
    ),
    (
        gen_random_uuid(),
        'Percy Jackson e o Ladrão de Raios',
        lower('Percy Jackson e o Ladrão de Raios'),
        2005,
        '9788576830861',
        5, 4, 1, TRUE,
        'https://m.media-amazon.com/images/I/51qKX5E3H8L._SY445_.jpg',
        'Percy Jackson descobre que é um semideus, filho de Poseidon, e embarca em uma jornada para recuperar o raio de Zeus.'
    )
    ON CONFLICT (liv_isbn) DO NOTHING;
    
    -- Livros para Loja Rio de Janeiro (Ficção Científica e Distopia)
    INSERT INTO livraria_comercial.livros (
        liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_isbn,
        aut_id, edi_id, gpr_id, liv_ativo, liv_imagem_url, liv_sinopse
    )
    VALUES
    (
        gen_random_uuid(),
        'Duna',
        lower('Duna'),
        1965,
        '9788577105377',
        3, 5, 1, TRUE,
        'https://m.media-amazon.com/images/I/41MRn6hy8-L._SY445_SX342_ML2_.jpg',
        'No planeta Arrakis, conhecido como Duna, as grandes casas nobres lutam pelo controle da especiaria mais valiosa do universo.'
    ),
    (
        gen_random_uuid(),
        '1984',
        lower('1984'),
        1949,
        '9788525062372',
        4, 2, 1, TRUE,
        'https://m.media-amazon.com/images/I/71XvO7F9uDL._SY466_.jpg',
        'Winston Smith vive em uma sociedade totalitária onde o Grande Irmão controla tudo e a verdade é manipulada.'
    ),
    (
        gen_random_uuid(),
        'Admirável Mundo Novo',
        lower('Admirável Mundo Novo'),
        1932,
        '9788525413995',
        4, 2, 1, TRUE,
        'https://m.media-amazon.com/images/I/71KRh0zY8TL._SY466_.jpg',
        'Em um futuro onde a genética determina o papel de cada pessoa na sociedade, um homem questiona o sistema.'
    ),
    (
        gen_random_uuid(),
        'Fahrenheit 451',
        lower('Fahrenheit 451'),
        1953,
        '9788577105407',
        4, 5, 1, TRUE,
        'https://m.media-amazon.com/images/I/51s6+JZ8qZL._SY445_.jpg',
        'Em um futuro onde livros são proibidos e queimados, um bombeiro começa a questionar seu trabalho.'
    ),
    (
        gen_random_uuid(),
        'Neuromancer',
        lower('Neuromancer'),
        1984,
        '9788577105414',
        3, 5, 1, TRUE,
        'https://m.media-amazon.com/images/I/51M7h5Z8Z8L._SY445_.jpg',
        'Case é um hacker de elite que perdeu sua habilidade e é recrutado para uma última missão perigosa.'
    )
    ON CONFLICT (liv_isbn) DO NOTHING;
    
    -- Livros para Loja Belo Horizonte (Clássicos, Literatura Brasileira e Negócios)
    INSERT INTO livraria_comercial.livros (
        liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_isbn,
        aut_id, edi_id, gpr_id, liv_ativo, liv_imagem_url, liv_sinopse
    )
    VALUES
    (
        gen_random_uuid(),
        'Dom Casmurro',
        lower('Dom Casmurro'),
        1900,
        '9788535902775',
        2, 4, 1, TRUE,
        'https://m.media-amazon.com/images/I/416E0ngf0xL._SY445_SX342_ML2_.jpg',
        'Bento Santiago narra sua história de amor por Capitu e sua dúvida sobre a traição da esposa.'
    ),
    (
        gen_random_uuid(),
        'Memórias Póstumas de Brás Cubas',
        lower('Memórias Póstumas de Brás Cubas'),
        1901,
        '9788535902782',
        2, 4, 1, TRUE,
        'https://m.media-amazon.com/images/I/51K7Z5Z8Z8L._SY445_.jpg',
        'Brás Cubas narra sua vida após a morte, com humor e ironia sobre a sociedade brasileira do século XIX.'
    ),
    (
        gen_random_uuid(),
        'O Alienista',
        lower('O Alienista'),
        1902,
        '9788535902799',
        2, 4, 1, TRUE,
        'https://m.media-amazon.com/images/I/51L8Z5Z8Z8L._SY445_.jpg',
        'O dr. Simão Bacamarte funda um asilo em uma pequena cidade para estudar a loucura humana.'
    ),
    (
        gen_random_uuid(),
        'Como Fazer Amigos e Influenciar Pessoas',
        lower('Como Fazer Amigos e Influenciar Pessoas'),
        1936,
        '9788577105421',
        7, 6, 1, TRUE,
        'https://m.media-amazon.com/images/I/51N7Z5Z8Z8L._SY445_.jpg',
        'Um guia prático sobre como melhorar relacionamentos pessoais e profissionais.'
    ),
    (
        gen_random_uuid(),
        'O Poder do Hábito',
        lower('O Poder do Hábito'),
        2012,
        '9788577105438',
        7, 5, 1, TRUE,
        'https://m.media-amazon.com/images/I/51O7Z5Z8Z8L._SY445_.jpg',
        'Descubra como hábitos funcionam e como transformá-los para alcançar seus objetivos.'
    )
    ON CONFLICT (liv_isbn) DO NOTHING;
    
    -- ========================================================================
    -- 3.5. ASSOCIAR CATEGORIAS AOS LIVROS
    -- ========================================================================
    
    -- Associar categorias aos livros de São Paulo (Fantasia e Aventura)
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn IN ('9788532510776', '9788578270870', '9788532506166')
      AND c.cat_slug = 'fantasia'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn IN ('9788532529631', '9788576830861')
      AND c.cat_slug = 'aventura'
    ON CONFLICT DO NOTHING;
    
    -- Associar categorias aos livros do Rio de Janeiro (Distopia, Ficção Científica, Young Adult)
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn IN ('9788525062372', '9788525413995', '9788577105407')
      AND c.cat_slug = 'distopia'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn = '9788577105414'
      AND c.cat_slug = 'ficcao-cientifica'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn = '9788577105377'
      AND c.cat_slug = 'young-adult'
    ON CONFLICT DO NOTHING;
    
    -- Associar categorias aos livros de Belo Horizonte (Clássicos, Literatura Brasileira, Negócios)
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn IN ('9788535902775', '9788535902782', '9788535902799')
      AND c.cat_slug = 'classicos'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn IN ('9788535902775', '9788535902782', '9788535902799')
      AND c.cat_slug = 'literatura-brasileira'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id)
    SELECT l.liv_id, c.cat_id
    FROM livraria_comercial.livros l
    CROSS JOIN livraria_comercial.categorias c
    WHERE l.liv_isbn IN ('9788577105421', '9788577105438')
      AND c.cat_slug = 'negocios'
    ON CONFLICT DO NOTHING;
    
    -- ========================================================================
    -- 4. CRIAR ESTOQUES (5 livros por loja)
    -- ========================================================================
    
    -- Estoques para Loja São Paulo
    INSERT INTO livraria_comercial.estoques (
        etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada,
        etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id
    )
    SELECT
        gen_random_uuid(),
        liv_id,
        20,  -- quantidade disponível
        0,   -- quantidade reservada
        49.90,  -- preço venda
        25.00,  -- custo
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1)
    FROM livraria_comercial.livros
    WHERE liv_isbn IN (
        '9788532510776', '9788578270870', '9788532506166',
        '9788532529631', '9788576830861'
    )
    ON CONFLICT (liv_id) DO NOTHING;
    
    -- Estoques para Loja Rio de Janeiro
    INSERT INTO livraria_comercial.estoques (
        etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada,
        etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id
    )
    SELECT
        gen_random_uuid(),
        liv_id,
        15,
        0,
        59.90,
        30.00,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1)
    FROM livraria_comercial.livros
    WHERE liv_isbn IN (
        '9788577105377', '9788525062372', '9788525413995',
        '9788577105407', '9788577105414'
    )
    ON CONFLICT (liv_id) DO NOTHING;
    
    -- Estoques para Loja Belo Horizonte
    INSERT INTO livraria_comercial.estoques (
        etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada,
        etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id
    )
    SELECT
        gen_random_uuid(),
        liv_id,
        25,
        0,
        39.90,
        20.00,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1)
    FROM livraria_comercial.livros
    WHERE liv_isbn IN (
        '9788535902775', '9788535902782', '9788535902799',
        '9788577105421', '9788577105438'
    )
    ON CONFLICT (liv_id) DO NOTHING;
    
    -- ========================================================================
    -- 5. CRIAR 9 CLIENTES (3 por loja)
    -- Senhas: Cliente@123 (hash bcrypt rounds=10)
    -- Hash: $2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.
    -- ========================================================================
    
    -- Clientes para Loja São Paulo
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES
    (
        gen_random_uuid(),
        'Fernanda Santos',
        'fernanda.santos@email.com',
        '456.789.012-34',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1)
    ),
    (
        gen_random_uuid(),
        'Lucas Pereira',
        'lucas.pereira@email.com',
        '567.890.123-45',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1)
    ),
    (
        gen_random_uuid(),
        'Juliana Lima',
        'juliana.lima@email.com',
        '678.901.234-56',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1)
    )
    ON CONFLICT (usu_email) DO NOTHING;
    
    -- Clientes para Loja Rio de Janeiro
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES
    (
        gen_random_uuid(),
        'Marcos Almeida',
        'marcos.almeida@email.com',
        '789.012.345-67',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1)
    ),
    (
        gen_random_uuid(),
        'Carla Rodrigues',
        'carla.rodrigues@email.com',
        '890.123.456-78',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1)
    ),
    (
        gen_random_uuid(),
        'Rafael Gomes',
        'rafael.gomes@email.com',
        '901.234.567-89',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1)
    )
    ON CONFLICT (usu_email) DO NOTHING;
    
    -- Clientes para Loja Belo Horizonte
    INSERT INTO livraria_gestao.usuarios (
        usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
        pap_id, usu_ativo, loj_id
    )
    VALUES
    (
        gen_random_uuid(),
        'Patricia Martins',
        'patricia.martins@email.com',
        '012.345.678-90',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1)
    ),
    (
        gen_random_uuid(),
        'André Souza',
        'andre.souza@email.com',
        '123.456.789-00',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1)
    ),
    (
        gen_random_uuid(),
        'Mariana Ferreira',
        'mariana.ferreira@email.com',
        '234.567.890-11',
        '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.',
        v_id_papel_cliente,
        TRUE,
        (SELECT loj_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1)
    )
    ON CONFLICT (usu_email) DO NOTHING;
    
    -- ========================================================================
    -- 6. CRIAR REGISTROS DE CLIENTES (tabela clientes)
    -- ========================================================================
    
    INSERT INTO livraria_gestao.clientes (cli_uuid, usu_id, cli_genero, cli_data_nascimento, loj_id)
    SELECT
        gen_random_uuid(),
        u.usu_id,
        CASE WHEN u.usu_nome LIKE '%Fernanda%' OR u.usu_nome LIKE '%Juliana%' OR u.usu_nome LIKE '%Carla%' OR u.usu_nome LIKE '%Patricia%' OR u.usu_nome LIKE '%Mariana%'
             THEN 'Feminino'
             ELSE 'Masculino'
        END,
        '1990-01-15'::date,
        u.loj_id
    FROM livraria_gestao.usuarios u
    JOIN livraria_comercial.papeis p ON u.pap_id = p.pap_id
    WHERE p.pap_descricao = 'cliente'
      AND u.usu_email IN (
          'fernanda.santos@email.com', 'lucas.pereira@email.com', 'juliana.lima@email.com',
          'marcos.almeida@email.com', 'carla.rodrigues@email.com', 'rafael.gomes@email.com',
          'patricia.martins@email.com', 'andre.souza@email.com', 'mariana.ferreira@email.com'
      )
    ON CONFLICT (usu_id) DO NOTHING;
    
    RAISE NOTICE 'Seed multi-tenant completo criado com sucesso!';
    RAISE NOTICE '3 Lojas, 3 Administradores, 15 Livros, 9 Clientes criados.';
END;
$$;
