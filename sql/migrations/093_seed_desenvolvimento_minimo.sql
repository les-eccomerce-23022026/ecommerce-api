-- Migration: 093_seed_desenvolvimento_minimo.sql
-- Descrição: Seed mínimo para desenvolvimento com 2 clientes e 1 admin de loja
-- Ambiente: Desenvolvimento
-- Autor: Cascade AI
-- Data: 2026-06-08

BEGIN;

-- ============================================
-- PASSO 1: Criar Loja Padrão (se não existir)
-- ============================================
INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
VALUES (
  '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID,
  'Livraria Padrão',
  'livraria-padrao',
  '00.000.000/0001-00',
  TRUE
)
ON CONFLICT (loj_slug) DO NOTHING;

-- ============================================
-- PASSO 2: Criar Admin de Loja
-- ============================================
DO $$
DECLARE
  v_papel_admin_id INTEGER;
  v_loja_id BIGINT;
  v_admin_id BIGINT;
BEGIN
  -- Buscar ID do papel admin
  SELECT pap_id INTO v_papel_admin_id
  FROM livraria_gestao.papeis
  WHERE pap_descricao = 'admin'
  LIMIT 1;

  IF v_papel_admin_id IS NULL THEN
    RAISE EXCEPTION 'Papel admin não encontrado na tabela papeis';
  END IF;

  -- Buscar ID da loja padrão
  SELECT loj_id INTO v_loja_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
  LIMIT 1;

  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'Loja padrão não encontrada';
  END IF;

  -- Criar admin de loja
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid,
    usu_nome,
    usu_email,
    usu_cpf,
    usu_senha_hash,
    pap_id,
    usu_ativo,
    loj_id,
    usu_tipo_pessoa,
    usu_telefone_rapido
  )
  VALUES (
    gen_random_uuid(),
    'Admin Livraria',
    'admin_loja@livraria.com.br',
    '123.456.789-00',
    '$2a$10$tYGTh/XQGURgPhGWjhcCPuzyA6BnJqDKCENMF8esZBmulWhjBv45i',
    v_papel_admin_id,
    TRUE,
    v_loja_id,
    'PF',
    '(11) 98888-0000'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_id;

  -- Se o usuário já existia, buscar seu ID
  IF v_admin_id IS NULL THEN
    SELECT usu_id INTO v_admin_id
    FROM livraria_gestao.usuarios
    WHERE usu_email = 'admin_loja@livraria.com.br';
  END IF;

  -- Vincular admin à loja com escopo LOJA
  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_admin_id, v_loja_id, 'admin_loja', TRUE, 'LOJA')
  ON CONFLICT (usu_id, loj_id) DO NOTHING;

  -- Inserir papel na tabela usuario_papeis
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_admin_id, v_papel_admin_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  RAISE NOTICE 'Admin de loja criado: usu_id=%, email=%', v_admin_id, 'admin_loja@livraria.com.br';
END $$;

-- ============================================
-- PASSO 3: Criar 2 Clientes com dados completos
-- ============================================
DO $$
DECLARE
  v_papel_cliente_id INTEGER;
  v_loja_id BIGINT;
  v_cliente1_id BIGINT;
  v_cliente2_id BIGINT;
  v_bandeira_visa INTEGER;
  v_bandeira_master INTEGER;
BEGIN
  -- Buscar ID do papel cliente
  SELECT pap_id INTO v_papel_cliente_id
  FROM livraria_gestao.papeis
  WHERE pap_descricao = 'cliente'
  LIMIT 1;

  IF v_papel_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Papel cliente não encontrado na tabela papeis';
  END IF;

  -- Buscar ID da loja padrão
  SELECT loj_id INTO v_loja_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
  LIMIT 1;

  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'Loja padrão não encontrada';
  END IF;

  -- Buscar bandeiras de cartão
  SELECT ban_id INTO v_bandeira_visa
  FROM livraria_financeiro.bandeiras_cartao
  WHERE ban_descricao = 'Visa'
  LIMIT 1;

  SELECT ban_id INTO v_bandeira_master
  FROM livraria_financeiro.bandeiras_cartao
  WHERE ban_descricao = 'Mastercard'
  LIMIT 1;

  -- Criar cliente 1
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid,
    usu_nome,
    usu_email,
    usu_cpf,
    usu_senha_hash,
    pap_id,
    usu_ativo,
    loj_id,
    usu_tipo_pessoa,
    usu_telefone_rapido,
    usu_genero,
    usu_data_nascimento
  )
  VALUES (
    gen_random_uuid(),
    'Maria Silva',
    'cliente1@livraria.com.br',
    '456.789.012-34',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_id,
    'PF',
    '(11) 97777-1111',
    'feminino',
    '1990-05-15'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente1_id;

  -- Criar cliente 2
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid,
    usu_nome,
    usu_email,
    usu_cpf,
    usu_senha_hash,
    pap_id,
    usu_ativo,
    loj_id,
    usu_tipo_pessoa,
    usu_telefone_rapido,
    usu_genero,
    usu_data_nascimento
  )
  VALUES (
    gen_random_uuid(),
    'João Santos',
    'cliente2@livraria.com.br',
    '567.890.123-45',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_id,
    'PF',
    '(11) 96666-2222',
    'masculino',
    '1985-08-20'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente2_id;

  -- Se os usuários já existiam, buscar seus IDs
  IF v_cliente1_id IS NULL THEN
    SELECT usu_id INTO v_cliente1_id FROM livraria_gestao.usuarios WHERE usu_email = 'cliente1@livraria.com.br';
  END IF;

  IF v_cliente2_id IS NULL THEN
    SELECT usu_id INTO v_cliente2_id FROM livraria_gestao.usuarios WHERE usu_email = 'cliente2@livraria.com.br';
  END IF;

  -- Criar perfis de clientes
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente1_id, 'feminino', '1990-05-15', v_loja_id)
  ON CONFLICT (usu_id) DO NOTHING;

  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente2_id, 'masculino', '1985-08-20', v_loja_id)
  ON CONFLICT (usu_id) DO NOTHING;

  -- Inserir papéis na tabela usuario_papeis
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente1_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente2_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  -- Criar endereços para cliente 1
  INSERT INTO livraria_gestao.enderecos (
    end_uuid, end_tipo, end_numero, end_complemento,
    end_principal, usu_id, loj_id, pai_id
  )
  VALUES (
    gen_random_uuid(),
    'entrega',
    '123',
    'Apto 1',
    TRUE,
    v_cliente1_id,
    v_loja_id,
    1
  )
  ON CONFLICT DO NOTHING;

  -- Criar endereços para cliente 2
  INSERT INTO livraria_gestao.enderecos (
    end_uuid, end_tipo, end_numero, end_complemento,
    end_principal, usu_id, loj_id, pai_id
  )
  VALUES (
    gen_random_uuid(),
    'entrega',
    '456',
    'Apto 2',
    TRUE,
    v_cliente2_id,
    v_loja_id,
    1
  )
  ON CONFLICT DO NOTHING;

  -- Criar telefones para cliente 1
  INSERT INTO livraria_gestao.telefones (
    tel_uuid, tel_numero, tel_tipo, tel_principal, usu_id, loj_id
  )
  VALUES (
    gen_random_uuid(),
    '(11) 97777-1111',
    'celular',
    TRUE,
    v_cliente1_id,
    v_loja_id
  )
  ON CONFLICT DO NOTHING;

  -- Criar telefones para cliente 2
  INSERT INTO livraria_gestao.telefones (
    tel_uuid, tel_numero, tel_tipo, tel_principal, usu_id, loj_id
  )
  VALUES (
    gen_random_uuid(),
    '(11) 96666-2222',
    'celular',
    TRUE,
    v_cliente2_id,
    v_loja_id
  )
  ON CONFLICT DO NOTHING;

  -- Criar cartões para cliente 1 (Visa)
  IF v_bandeira_visa IS NOT NULL THEN
    INSERT INTO livraria_financeiro.cartoes (
      crt_uuid, usu_id, ban_id, crt_token, crt_final,
      crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
      gen_random_uuid(),
      v_cliente1_id,
      v_bandeira_visa,
      'tok_visa_cliente1',
      '1234',
      'MARIA SILVA',
      (CURRENT_DATE + INTERVAL '2 years')::date,
      TRUE
    )
    ON CONFLICT (usu_id, crt_token) DO NOTHING;
  END IF;

  -- Criar cartões para cliente 2 (Mastercard)
  IF v_bandeira_master IS NOT NULL THEN
    INSERT INTO livraria_financeiro.cartoes (
      crt_uuid, usu_id, ban_id, crt_token, crt_final,
      crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
      gen_random_uuid(),
      v_cliente2_id,
      v_bandeira_master,
      'tok_master_cliente2',
      '5678',
      'JOAO SANTOS',
      (CURRENT_DATE + INTERVAL '2 years')::date,
      TRUE
    )
    ON CONFLICT (usu_id, crt_token) DO NOTHING;
  END IF;

  RAISE NOTICE 'Clientes criados: Maria=%, João=%', v_cliente1_id, v_cliente2_id;
END $$;

-- ============================================
-- PASSO 4: Criar livros para a loja (múltiplos produtos)
-- ============================================
DO $$
DECLARE
  v_loja_id BIGINT;
  v_categoria_ficcao INTEGER;
  v_categoria_tecnologia INTEGER;
  v_categoria_negocios INTEGER;
  v_editora_record INTEGER;
  v_editora_novatec INTEGER;
  v_autor_stephen INTEGER;
  v_autor_robert INTEGER;
  v_genero_ficcao INTEGER;
  v_genero_tecnologia INTEGER;
  v_livro_id BIGINT;
BEGIN
  -- Buscar ID da loja padrão
  SELECT loj_id INTO v_loja_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
  LIMIT 1;

  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'Loja padrão não encontrada';
  END IF;

  -- Buscar categorias
  SELECT cat_id INTO v_categoria_ficcao FROM livraria_comercial.categorias WHERE cat_descricao = 'Ficção Científica' LIMIT 1;
  SELECT cat_id INTO v_categoria_tecnologia FROM livraria_comercial.categorias WHERE cat_descricao = 'Tecnologia' LIMIT 1;
  SELECT cat_id INTO v_categoria_negocios FROM livraria_comercial.categorias WHERE cat_descricao = 'Negócios' LIMIT 1;

  -- Buscar editoras
  SELECT edi_id INTO v_editora_record FROM livraria_comercial.editoras WHERE edi_descricao = 'Record' LIMIT 1;
  SELECT edi_id INTO v_editora_novatec FROM livraria_comercial.editoras WHERE edi_descricao = 'Novatec' LIMIT 1;

  -- Buscar autores
  SELECT aut_id INTO v_autor_stephen FROM livraria_comercial.autores WHERE aut_descricao = 'Stephen King' LIMIT 1;
  SELECT aut_id INTO v_autor_robert FROM livraria_comercial.autores WHERE aut_descricao = 'Robert C. Martin' LIMIT 1;

  -- Buscar gêneros
  SELECT gen_id INTO v_genero_ficcao FROM livraria_comercial.generos WHERE gen_descricao = 'Ficção' LIMIT 1;
  SELECT gen_id INTO v_genero_tecnologia FROM livraria_comercial.generos WHERE gen_descricao = 'Tecnologia' LIMIT 1;

  -- Criar livros (10 livros variados)
  -- Livro 1: Ficção Científica
  INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_isbn, liv_ano_publicacao, liv_sinopse,
    cat_id, edi_id, aut_id, gen_id, liv_ativo
  )
  VALUES (
    gen_random_uuid(),
    'O Iluminado',
    '978-85-01-08215-1',
    2020,
    'Uma família cuida de um hotel isolado durante o inverno, onde forças sobrenaturais começam a se manifestar.',
    v_categoria_ficcao,
    v_editora_record,
    v_autor_stephen,
    v_genero_ficcao,
    TRUE
  )
  ON CONFLICT (liv_isbn) DO NOTHING
  RETURNING liv_id INTO v_livro_id;

  IF v_livro_id IS NOT NULL THEN
    INSERT INTO livraria_comercial.estoques (
      liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
      etq_criado_em, etq_atualizado_em
    )
    VALUES (v_livro_id, v_loja_id, 50, 49.90, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Livro 2: Tecnologia
  INSERT INTO livraria_comercial.livros (
    liv_uuid, liv_titulo, liv_isbn, liv_ano_publicacao, liv_sinopse,
    cat_id, edi_id, aut_id, gen_id, liv_ativo
  )
  VALUES (
    gen_random_uuid(),
    'Código Limpo',
    '978-85-7522-317-1',
    2019,
    'Habilidades práticas para escrever código limpo e manutenível.',
    v_categoria_tecnologia,
    v_editora_novatec,
    v_autor_robert,
    v_genero_tecnologia,
    TRUE
  )
  ON CONFLICT (liv_isbn) DO NOTHING
  RETURNING liv_id INTO v_livro_id;

  IF v_livro_id IS NOT NULL THEN
    INSERT INTO livraria_comercial.estoques (
      liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
      etq_criado_em, etq_atualizado_em
    )
    VALUES (v_livro_id, v_loja_id, 30, 89.90, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Criar mais 8 livros com dados genéricos
  FOR i IN 3..10 LOOP
    INSERT INTO livraria_comercial.livros (
      liv_uuid, liv_titulo, liv_isbn, liv_ano_publicacao, liv_sinopse,
      cat_id, edi_id, aut_id, gen_id, liv_ativo
    )
    VALUES (
      gen_random_uuid(),
      'Livro Exemplo ' || i,
      '978-85-01-00000-' || LPAD(i::text, 2, '0'),
      2020,
      'Sinopse do livro exemplo ' || i,
      COALESCE(v_categoria_ficcao, 1),
      COALESCE(v_editora_record, 1),
      COALESCE(v_autor_stephen, 1),
      COALESCE(v_genero_ficcao, 1),
      TRUE
    )
    ON CONFLICT (liv_isbn) DO NOTHING
    RETURNING liv_id INTO v_livro_id;

    IF v_livro_id IS NOT NULL THEN
      INSERT INTO livraria_comercial.estoques (
        liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
        etq_criado_em, etq_atualizado_em
      )
      VALUES (v_livro_id, v_loja_id, 20 + (i * 5), 39.90 + (i * 5), NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RAISE NOTICE 'Livros criados para loja padrão';
END $$;

-- ============================================
-- RESUMO DO SEED
-- ============================================
-- ✅ 1 loja criada: Livraria Padrão
-- ✅ 1 admin de loja criado: admin_loja@livraria.com.br
-- ✅ 2 clientes criados com dados completos:
--    - cliente1@livraria.com.br (Maria Silva) - endereço, telefone, cartão Visa
--    - cliente2@livraria.com.br (João Santos) - endereço, telefone, cartão Mastercard
-- ✅ 10 livros criados com estoques
-- Senhas: Admin@123 (admin), Cliente@123 (clientes)

COMMIT;
