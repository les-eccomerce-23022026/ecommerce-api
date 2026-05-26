-- Migration: 050_seed_multi_tenant_completo.sql
-- Descrição: Seed completo de multi-tenancy com dados sintéticos realistas
-- Ambiente: Desenvolvimento, Testes
-- Autor: Senior DBA
-- Data: 2026-05-26

BEGIN;

-- ============================================
-- PASSO 1: Criar 3 lojas distintas
-- ============================================
INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_cnpj, loj_ativo)
VALUES
  (gen_random_uuid(), 'Livraria Centro', 'livraria-centro', '12.345.678/0001-90', TRUE),
  (gen_random_uuid(), 'Livraria Norte', 'livraria-norte', '23.456.789/0001-01', TRUE),
  (gen_random_uuid(), 'Livraria Sul', 'livraria-sul', '34.567.890/0001-12', TRUE)
ON CONFLICT (loj_slug) DO NOTHING;

-- ============================================
-- PASSO 2: Criar 1 admin do sistema (escopo SISTEMA)
-- ============================================
DO $$
DECLARE
  v_admin_sistema_id BIGINT;
  v_papel_admin_sistema_id INTEGER;
  v_loja_centro_id BIGINT;
BEGIN
  -- Buscar ID do papel admin_sistema
  SELECT pap_id INTO v_papel_admin_sistema_id
  FROM livraria_gestao.papeis
  WHERE pap_descricao = 'admin_sistema'
  LIMIT 1;

  IF v_papel_admin_sistema_id IS NULL THEN
    RAISE EXCEPTION 'Papel admin_sistema não encontrado na tabela papeis';
  END IF;

  -- Buscar ID da loja centro (para loj_id do usuário)
  SELECT loj_id INTO v_loja_centro_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-centro'
  LIMIT 1;

  IF v_loja_centro_id IS NULL THEN
    RAISE EXCEPTION 'Loja centro não encontrada';
  END IF;

  -- Criar usuário admin do sistema
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
    'Administrador do Sistema',
    'admin_sistema@livraria.com.br',
    '999.999.999-99',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_admin_sistema_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 99999-0000'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_sistema_id;

  -- Se o usuário já existia, buscar seu ID
  IF v_admin_sistema_id IS NULL THEN
    SELECT usu_id INTO v_admin_sistema_id
    FROM livraria_gestao.usuarios
    WHERE usu_email = 'admin_sistema@livraria.com.br';
  END IF;

  -- Vincular admin do sistema à loja centro com escopo SISTEMA
  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_admin_sistema_id, v_loja_centro_id, 'admin_sistema', TRUE, 'SISTEMA')
  ON CONFLICT (usu_id, loj_id) DO NOTHING;

  -- Inserir papel na tabela usuario_papeis
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_admin_sistema_id, v_papel_admin_sistema_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  RAISE NOTICE 'Admin do sistema criado: usu_id=%, email=%', v_admin_sistema_id, 'admin_sistema@livraria.com.br';
END $$;

-- ============================================
-- PASSO 3: Criar 3 admins tenant (um por loja)
-- ============================================
DO $$
DECLARE
  v_papel_admin_id INTEGER;
  v_loja_centro_id BIGINT;
  v_loja_norte_id BIGINT;
  v_loja_sul_id BIGINT;
  v_admin_centro_id BIGINT;
  v_admin_norte_id BIGINT;
  v_admin_sul_id BIGINT;
BEGIN
  -- Buscar ID do papel admin
  SELECT pap_id INTO v_papel_admin_id
  FROM livraria_gestao.papeis
  WHERE pap_descricao = 'admin'
  LIMIT 1;

  IF v_papel_admin_id IS NULL THEN
    RAISE EXCEPTION 'Papel admin não encontrado na tabela papeis';
  END IF;

  -- Buscar IDs das lojas
  SELECT loj_id INTO v_loja_centro_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-centro';
  SELECT loj_id INTO v_loja_norte_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-norte';
  SELECT loj_id INTO v_loja_sul_id FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sul';

  IF v_loja_centro_id IS NULL OR v_loja_norte_id IS NULL OR v_loja_sul_id IS NULL THEN
    RAISE EXCEPTION 'Uma ou mais lojas não encontradas';
  END IF;

  -- Criar admin da Livraria Centro
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
    'Admin Livraria Centro',
    'admin_centro@livraria.com.br',
    '234.567.890-18',
    '$2a$10$tYGTh/XQGURgPhGWjhcCPuzyA6BnJqDKCENMF8esZBmulWhjBv45i',
    v_papel_admin_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 98888-1111'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_centro_id;

  -- Criar admin da Livraria Norte
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
    'Admin Livraria Norte',
    'admin_norte@livraria.com.br',
    '345.678.901-27',
    '$2a$10$tYGTh/XQGURgPhGWjhcCPuzyA6BnJqDKCENMF8esZBmulWhjBv45i',
    v_papel_admin_id,
    TRUE,
    v_loja_norte_id,
    'PF',
    '(11) 97777-2222'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_norte_id;

  -- Criar admin da Livraria Sul
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
    'Admin Livraria Sul',
    'admin_sul@livraria.com.br',
    '456.789.012-36',
    '$2a$10$tYGTh/XQGURgPhGWjhcCPuzyA6BnJqDKCENMF8esZBmulWhjBv45i',
    v_papel_admin_id,
    TRUE,
    v_loja_sul_id,
    'PF',
    '(11) 96666-3333'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_admin_sul_id;

  -- Se os usuários já existiam, buscar seus IDs
  IF v_admin_centro_id IS NULL THEN
    SELECT usu_id INTO v_admin_centro_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin_centro@livraria.com.br';
  END IF;

  IF v_admin_norte_id IS NULL THEN
    SELECT usu_id INTO v_admin_norte_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin_norte@livraria.com.br';
  END IF;

  IF v_admin_sul_id IS NULL THEN
    SELECT usu_id INTO v_admin_sul_id FROM livraria_gestao.usuarios WHERE usu_email = 'admin_sul@livraria.com.br';
  END IF;

  -- Vincular admins às suas lojas com escopo LOJA
  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_admin_centro_id, v_loja_centro_id, 'admin_loja', TRUE, 'LOJA')
  ON CONFLICT (usu_id, loj_id) DO NOTHING;

  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_admin_norte_id, v_loja_norte_id, 'admin_loja', TRUE, 'LOJA')
  ON CONFLICT (usu_id, loj_id) DO NOTHING;

  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_admin_sul_id, v_loja_sul_id, 'admin_loja', TRUE, 'LOJA')
  ON CONFLICT (usu_id, loj_id) DO NOTHING;

  -- Inserir papéis na tabela usuario_papeis
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_admin_centro_id, v_papel_admin_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_admin_norte_id, v_papel_admin_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_admin_sul_id, v_papel_admin_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  RAISE NOTICE 'Admins tenant criados: Centro=%, Norte=%, Sul=%', v_admin_centro_id, v_admin_norte_id, v_admin_sul_id;
END $$;

-- ============================================
-- PASSO 4: Criar 5 clientes comuns (acesso a todas as lojas)
-- ============================================
DO $$
DECLARE
  v_papel_cliente_id INTEGER;
  v_loja_centro_id BIGINT;
  v_cliente_1_id BIGINT;
  v_cliente_2_id BIGINT;
  v_cliente_3_id BIGINT;
  v_cliente_4_id BIGINT;
  v_cliente_5_id BIGINT;
BEGIN
  -- Buscar ID do papel cliente
  SELECT pap_id INTO v_papel_cliente_id
  FROM livraria_gestao.papeis
  WHERE pap_descricao = 'cliente'
  LIMIT 1;

  IF v_papel_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Papel cliente não encontrado na tabela papeis';
  END IF;

  -- Buscar ID da loja centro (para loj_id dos clientes)
  SELECT loj_id INTO v_loja_centro_id
  FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-centro'
  LIMIT 1;

  IF v_loja_centro_id IS NULL THEN
    RAISE EXCEPTION 'Loja centro não encontrada';
  END IF;

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
    'maria.silva@email.com',
    '666.777.888-99',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 95555-4444',
    'feminino',
    '1990-05-15'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente_1_id;

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
    'joao.santos@email.com',
    '777.888.999-00',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 94444-5555',
    'masculino',
    '1985-08-20'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente_2_id;

  -- Criar cliente 3
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
    'Ana Oliveira',
    'ana.oliveira@email.com',
    '888.999.000-11',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 93333-6666',
    'feminino',
    '1992-03-10'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente_3_id;

  -- Criar cliente 4
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
    'Pedro Costa',
    'pedro.costa@email.com',
    '999.000.111-22',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 92222-7777',
    'masculino',
    '1988-11-25'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente_4_id;

  -- Criar cliente 5
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
    'Carla Ferreira',
    'carla.ferreira@email.com',
    '000.111.222-33',
    '$2a$10$YmnGMLNqa5vzJ.Je7pP1HuaN4J52j7i4Fw32nnr2YoCLtVpFilUuO',
    v_papel_cliente_id,
    TRUE,
    v_loja_centro_id,
    'PF',
    '(11) 91111-8888',
    'feminino',
    '1995-07-30'
  )
  ON CONFLICT (usu_email) DO NOTHING
  RETURNING usu_id INTO v_cliente_5_id;

  -- Se os usuários já existiam, buscar seus IDs
  IF v_cliente_1_id IS NULL THEN
    SELECT usu_id INTO v_cliente_1_id FROM livraria_gestao.usuarios WHERE usu_email = 'maria.silva@email.com';
  END IF;

  IF v_cliente_2_id IS NULL THEN
    SELECT usu_id INTO v_cliente_2_id FROM livraria_gestao.usuarios WHERE usu_email = 'joao.santos@email.com';
  END IF;

  IF v_cliente_3_id IS NULL THEN
    SELECT usu_id INTO v_cliente_3_id FROM livraria_gestao.usuarios WHERE usu_email = 'ana.oliveira@email.com';
  END IF;

  IF v_cliente_4_id IS NULL THEN
    SELECT usu_id INTO v_cliente_4_id FROM livraria_gestao.usuarios WHERE usu_email = 'pedro.costa@email.com';
  END IF;

  IF v_cliente_5_id IS NULL THEN
    SELECT usu_id INTO v_cliente_5_id FROM livraria_gestao.usuarios WHERE usu_email = 'carla.ferreira@email.com';
  END IF;

  -- Criar perfis de clientes na tabela clientes
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente_1_id, 'feminino', '1990-05-15', v_loja_centro_id)
  ON CONFLICT (usu_id) DO NOTHING;

  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente_2_id, 'masculino', '1985-08-20', v_loja_centro_id)
  ON CONFLICT (usu_id) DO NOTHING;

  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente_3_id, 'feminino', '1992-03-10', v_loja_centro_id)
  ON CONFLICT (usu_id) DO NOTHING;

  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente_4_id, 'masculino', '1988-11-25', v_loja_centro_id)
  ON CONFLICT (usu_id) DO NOTHING;

  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
  VALUES (v_cliente_5_id, 'feminino', '1995-07-30', v_loja_centro_id)
  ON CONFLICT (usu_id) DO NOTHING;

  -- Inserir papéis na tabela usuario_papeis
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente_1_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente_2_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente_3_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente_4_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
  VALUES (v_cliente_5_id, v_papel_cliente_id, TRUE, NOW(), NOW())
  ON CONFLICT (usu_id, pap_id) DO NOTHING;

  RAISE NOTICE 'Clientes criados: Maria=%, João=%, Ana=%, Pedro=%, Carla=%',
    v_cliente_1_id, v_cliente_2_id, v_cliente_3_id, v_cliente_4_id, v_cliente_5_id;
END $$;

-- ============================================
-- RESUMO DO SEED
-- ============================================
-- ✅ 3 lojas criadas: Livraria Centro, Livraria Norte, Livraria Sul
-- ✅ 1 admin do sistema criado (escopo SISTEMA): admin_sistema@livraria.com.br
-- ✅ 3 admins tenant criados (escopo LOJA):
--    - admin_centro@livraria.com.br (Livraria Centro)
--    - admin_norte@livraria.com.br (Livraria Norte)
--    - admin_sul@livraria.com.br (Livraria Sul)
-- ✅ 5 clientes criados (acesso a todas as lojas):
--    - maria.silva@email.com
--    - joao.santos@email.com
--    - ana.oliveira@email.com
--    - pedro.costa@email.com
--    - carla.ferreira@email.com
-- ✅ Todos os usuários vinculados à tabela usuario_papeis
-- ✅ Admins vinculados à tabela admin_lojas com escopos corretos
-- ✅ Clientes vinculados à tabela clientes

COMMIT;
