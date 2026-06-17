-- Migration: 095_seed_desenvolvimento_minimo_corrigido.sql
-- Descrição: Seed mínimo corrigido para desenvolvimento com 2 clientes e 1 admin de loja
-- Ambiente: Desenvolvimento
-- Autor: Cascade AI
-- Data: 2026-06-08

BEGIN;

-- ============================================
-- PASSO 1: Criar Admin de Loja
-- ============================================
DO $$
DECLARE
  v_papel_admin_id INTEGER := 2;
  v_loja_id BIGINT;
  v_admin_id BIGINT;
BEGIN
  SELECT loj_id INTO v_loja_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
  LIMIT 1;

  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'Loja padrão não encontrada';
  END IF;

  INSERT INTO livraria_gestao.usuarios (
    usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
    pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_telefone_rapido
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
  RETURNING usu_id INTO v_admin_id;

  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_admin_id, v_loja_id, 'admin_loja', TRUE, 'LOJA');

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_admin_id, v_papel_admin_id, TRUE, NOW(), NOW());

  RAISE NOTICE 'Admin de loja criado: %', v_admin_id;
END $$;

-- ============================================
-- PASSO 2: Criar 2 Clientes com dados completos
-- ============================================
DO $$
DECLARE
  v_papel_cliente_id INTEGER := 3;
  v_loja_id BIGINT;
  v_cliente1_id BIGINT;
  v_cliente2_id BIGINT;
  v_bandeira_visa INTEGER;
  v_bandeira_master INTEGER;
BEGIN
  SELECT loj_id INTO v_loja_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
  LIMIT 1;

  SELECT ban_id INTO v_bandeira_visa
  FROM livraria_financeiro.bandeiras_cartao
  WHERE ban_descricao = 'Visa'
  LIMIT 1;

  SELECT ban_id INTO v_bandeira_master
  FROM livraria_financeiro.bandeiras_cartao
  WHERE ban_descricao = 'Mastercard'
  LIMIT 1;

  -- Cliente 1: Maria Silva
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
    pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_telefone_rapido,
    usu_genero, usu_data_nascimento
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
  RETURNING usu_id INTO v_cliente1_id;

  -- Cliente 2: João Santos
  INSERT INTO livraria_gestao.usuarios (
    usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash,
    pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_telefone_rapido,
    usu_genero, usu_data_nascimento
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
  RETURNING usu_id INTO v_cliente2_id;

  -- Perfis de clientes
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente1_id, 'feminino', '1990-05-15', v_loja_id);
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente2_id, 'masculino', '1985-08-20', v_loja_id);

  -- Papéis
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente1_id, v_papel_cliente_id, TRUE, NOW(), NOW());
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente2_id, v_papel_cliente_id, TRUE, NOW(), NOW());

  -- Endereços
  INSERT INTO livraria_gestao.enderecos (
    end_uuid, end_tipo, end_numero, end_complemento,
    end_principal, usu_id, loj_id, pai_id
  )
  VALUES (
    gen_random_uuid(), 'entrega', '123', 'Apto 1',
    TRUE, v_cliente1_id, v_loja_id, 1
  );

  INSERT INTO livraria_gestao.enderecos (
    end_uuid, end_tipo, end_numero, end_complemento,
    end_principal, usu_id, loj_id, pai_id
  )
  VALUES (
    gen_random_uuid(), 'entrega', '456', 'Apto 2',
    TRUE, v_cliente2_id, v_loja_id, 1
  );

  -- Telefones (sem tel_tipo)
  INSERT INTO livraria_gestao.telefones (
    tel_uuid, tel_numero, tel_principal, usu_id, loj_id
  )
  VALUES (
    gen_random_uuid(), '(11) 97777-1111', TRUE, v_cliente1_id, v_loja_id
  );

  INSERT INTO livraria_gestao.telefones (
    tel_uuid, tel_numero, tel_principal, usu_id, loj_id
  )
  VALUES (
    gen_random_uuid(), '(11) 96666-2222', TRUE, v_cliente2_id, v_loja_id
  );

  -- Cartões
  IF v_bandeira_visa IS NOT NULL THEN
    INSERT INTO livraria_financeiro.cartoes (
      crt_uuid, usu_id, ban_id, crt_token, crt_final,
      crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
      gen_random_uuid(), v_cliente1_id, v_bandeira_visa,
      'tok_visa_cliente1', '1234', 'MARIA SILVA',
      (CURRENT_DATE + INTERVAL '2 years')::date, TRUE
    );
  END IF;

  IF v_bandeira_master IS NOT NULL THEN
    INSERT INTO livraria_financeiro.cartoes (
      crt_uuid, usu_id, ban_id, crt_token, crt_final,
      crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
      gen_random_uuid(), v_cliente2_id, v_bandeira_master,
      'tok_master_cliente2', '5678', 'JOAO SANTOS',
      (CURRENT_DATE + INTERVAL '2 years')::date, TRUE
    );
  END IF;

  RAISE NOTICE 'Clientes criados: %, %', v_cliente1_id, v_cliente2_id;
END $$;

-- ============================================
-- PASSO 3: Criar 10 livros com estoques
-- ============================================
DO $$
DECLARE
  v_loja_id BIGINT;
  v_categoria_ficcao INTEGER;
  v_editora_record INTEGER;
  v_autor_stephen INTEGER;
  v_genero_ficcao INTEGER;
  v_livro_id BIGINT;
BEGIN
  SELECT loj_id INTO v_loja_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
  LIMIT 1;

  SELECT cat_id INTO v_categoria_ficcao FROM livraria_comercial.categorias WHERE cat_descricao = 'Ficção Científica' LIMIT 1;
  SELECT edi_id INTO v_editora_record FROM livraria_comercial.editoras WHERE edi_descricao = 'Record' LIMIT 1;
  SELECT aut_id INTO v_autor_stephen FROM livraria_comercial.autores WHERE aut_descricao = 'Stephen King' LIMIT 1;
  SELECT gen_id INTO v_genero_ficcao FROM livraria_comercial.generos WHERE gen_descricao = 'Ficção' LIMIT 1;

  -- Criar 10 livros
  FOR i IN 1..10 LOOP
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
    RETURNING liv_id INTO v_livro_id;

    INSERT INTO livraria_comercial.estoques (
      liv_id, loj_id, etq_quantidade_disponivel, etq_preco_venda,
      etq_criado_em, etq_atualizado_em
    )
    VALUES (v_livro_id, v_loja_id, 20 + (i * 5), 39.90 + (i * 5), NOW(), NOW());
  END LOOP;

  RAISE NOTICE '10 livros criados com estoques';
END $$;

COMMIT;
