-- Migration: 065_seed_demo_30_clientes_100_livros.sql
-- 30 clientes sintéticos (idades e endereços no Brasil) + catálogo até 100 livros
-- Senha padrão dos clientes demo: Cliente@123
-- Idempotente: emails demo.clienteNN@les.demo.br e ISBN 978-65-9900-XXXX-X

BEGIN;

INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES
('História', 'Obras sobre fatos e contextos históricos.'),
('Biografia', 'Vidas e trajetórias de personalidades.'),
('Infantil', 'Literatura para crianças.'),
('Filosofia', 'Reflexão e correntes filosóficas.'),
('Ciência', 'Divulgação e temas científicos.'),
('Romance', 'Narrativas de amor e relações.'),
('Aventura', 'Jornadas e explorações.')
ON CONFLICT (cat_nome) DO NOTHING;

INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES
('Globo Livros', '00.000.000/0002-10'),
('Objetiva', '00.000.000/0002-11'),
('Novatec', '00.000.000/0002-12'),
('Aleph', '00.000.000/0002-13'),
('Agir', '00.000.000/0002-14'),
('Gen LTC', '00.000.000/0002-15'),
('Pearson', '00.000.000/0002-16'),
('Bookman', '00.000.000/0002-17'),
('Galera Record', '00.000.000/0002-18'),
('L&PM', '00.000.000/0002-19'),
('Nova Fronteira', '00.000.000/0002-20'),
('Arqueiro', '00.000.000/0002-21'),
('Suma', '00.000.000/0002-22'),
('Gente', '00.000.000/0002-23'),
('Leya', '00.000.000/0002-24')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_papel_cliente INTEGER;
  v_loj_id BIGINT;
  v_ttp_id INTEGER;
  v_tre_id INTEGER;
  v_tlo_id INTEGER;
  v_gpr_id INTEGER;
  v_total_livros INTEGER;
  rec RECORD;
  v_usu_id BIGINT;
  v_cid_id INTEGER;
  v_bai_id INTEGER;
  v_log_id INTEGER;
  v_pai_id INTEGER;
  v_aut_id INTEGER;
  v_edi_id INTEGER;
  v_cat_id INTEGER;
  v_liv_id BIGINT;
  i INTEGER;
BEGIN
  SELECT pap_id INTO v_papel_cliente FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente' LIMIT 1;
  SELECT loj_id INTO v_loj_id FROM livraria_gestao.lojas ORDER BY loj_id LIMIT 1;
  IF v_papel_cliente IS NULL OR v_loj_id IS NULL THEN RAISE EXCEPTION 'Papel cliente ou loja não encontrados'; END IF;

  -- Cliente 01: Ana Beatriz Souza
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente01@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Ana Beatriz Souza', 'demo.cliente01@les.demo.br', '100.200.300-10', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1998-03-14'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente01@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1998-03-14'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '11912340001') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '11912340001', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'SP') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('São Paulo - SP', 'SP'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('São Paulo') AND e.est_sigla = 'SP' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'São Paulo', upper('São Paulo'), est_id FROM livraria_ref.estados WHERE est_sigla = 'SP' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Bela Vista') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Bela Vista', upper('Bela Vista'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '01310100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('01310100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Paulista' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Paulista') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 01') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 01', v_tre_id, v_log_id, '1200', 'Apto 42', v_cid_id, v_bai_id, '01310100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 02: Bruno Henrique Lima
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente02@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Bruno Henrique Lima', 'demo.cliente02@les.demo.br', '101.201.301-11', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1985-07-22'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente02@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1985-07-22'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '21987650002') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '21987650002', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'RJ') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Rio de Janeiro - RJ', 'RJ'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Rio de Janeiro') AND e.est_sigla = 'RJ' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Rio de Janeiro', upper('Rio de Janeiro'), est_id FROM livraria_ref.estados WHERE est_sigla = 'RJ' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Copacabana') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Copacabana', upper('Copacabana'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '22021001') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('22021001', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Atlântica' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Atlântica') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 02') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 02', v_tre_id, v_log_id, '500', 'Bloco B', v_cid_id, v_bai_id, '22021001', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 03: Camila Rocha Dias
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente03@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Camila Rocha Dias', 'demo.cliente03@les.demo.br', '102.202.302-12', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1992-11-05'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente03@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1992-11-05'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '31998760003') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '31998760003', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'MG') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Belo Horizonte - MG', 'MG'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Belo Horizonte') AND e.est_sigla = 'MG' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Belo Horizonte', upper('Belo Horizonte'), est_id FROM livraria_ref.estados WHERE est_sigla = 'MG' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Funcionários') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Funcionários', upper('Funcionários'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '30130100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('30130100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Afonso Pena' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Afonso Pena') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 03') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 03', v_tre_id, v_log_id, '1500', 'Sala 3', v_cid_id, v_bai_id, '30130100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 04: Diego Martins Alves
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente04@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Diego Martins Alves', 'demo.cliente04@les.demo.br', '103.203.303-13', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1978-01-30'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente04@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1978-01-30'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '41991230004') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '41991230004', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'PR') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Curitiba - PR', 'PR'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Curitiba') AND e.est_sigla = 'PR' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Curitiba', upper('Curitiba'), est_id FROM livraria_ref.estados WHERE est_sigla = 'PR' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '80020310') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('80020310', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'XV de Novembro' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'XV de Novembro') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 04') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 04', v_tre_id, v_log_id, '800', NULL, v_cid_id, v_bai_id, '80020310', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 05: Elena Ferreira Costa
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente05@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Elena Ferreira Costa', 'demo.cliente05@les.demo.br', '104.204.304-14', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '2001-09-18'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente05@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '2001-09-18'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '51992340005') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '51992340005', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'RS') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Porto Alegre - RS', 'RS'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Porto Alegre') AND e.est_sigla = 'RS' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Porto Alegre', upper('Porto Alegre'), est_id FROM livraria_ref.estados WHERE est_sigla = 'RS' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro Histórico') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro Histórico', upper('Centro Histórico'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '90020008') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('90020008', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'dos Andradas' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'dos Andradas') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 05') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 05', v_tre_id, v_log_id, '1234', NULL, v_cid_id, v_bai_id, '90020008', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 06: Felipe Nogueira Pires
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente06@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Felipe Nogueira Pires', 'demo.cliente06@les.demo.br', '105.205.305-15', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1990-12-02'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente06@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1990-12-02'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '71993450006') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '71993450006', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'BA') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Salvador - BA', 'BA'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Salvador') AND e.est_sigla = 'BA' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Salvador', upper('Salvador'), est_id FROM livraria_ref.estados WHERE est_sigla = 'BA' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Barra') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Barra', upper('Barra'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '40140100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('40140100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Oceânica' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Oceânica') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 06') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 06', v_tre_id, v_log_id, '2100', 'Casa', v_cid_id, v_bai_id, '40140100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 07: Gabriela Teixeira Melo
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente07@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Gabriela Teixeira Melo', 'demo.cliente07@les.demo.br', '106.206.306-16', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1988-06-25'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente07@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1988-06-25'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '48994560007') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '48994560007', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'SC') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Florianópolis - SC', 'SC'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Florianópolis') AND e.est_sigla = 'SC' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Florianópolis', upper('Florianópolis'), est_id FROM livraria_ref.estados WHERE est_sigla = 'SC' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '88015100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('88015100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Felipe Schmidt' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Felipe Schmidt') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 07') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 07', v_tre_id, v_log_id, '300', 'Loja 2', v_cid_id, v_bai_id, '88015100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 08: Henrique Barros Ribeiro
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente08@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Henrique Barros Ribeiro', 'demo.cliente08@les.demo.br', '107.207.307-17', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1975-04-11'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente08@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1975-04-11'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '81995670008') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '81995670008', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'PE') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Recife - PE', 'PE'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Recife') AND e.est_sigla = 'PE' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Recife', upper('Recife'), est_id FROM livraria_ref.estados WHERE est_sigla = 'PE' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Boa Viagem') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Boa Viagem', upper('Boa Viagem'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '51020000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('51020000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Boa Viagem' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Boa Viagem') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 08') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 08', v_tre_id, v_log_id, '1500', 'Apto 801', v_cid_id, v_bai_id, '51020000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 09: Isabela Cardoso Araújo
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente09@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Isabela Cardoso Araújo', 'demo.cliente09@les.demo.br', '108.208.308-18', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1996-08-07'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente09@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1996-08-07'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '85996780009') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '85996780009', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'CE') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Fortaleza - CE', 'CE'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Fortaleza') AND e.est_sigla = 'CE' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Fortaleza', upper('Fortaleza'), est_id FROM livraria_ref.estados WHERE est_sigla = 'CE' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Meireles') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Meireles', upper('Meireles'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '60165120') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('60165120', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Beira Mar' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Beira Mar') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 09') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 09', v_tre_id, v_log_id, '2200', NULL, v_cid_id, v_bai_id, '60165120', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 10: João Pedro Cavalcanti
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente10@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'João Pedro Cavalcanti', 'demo.cliente10@les.demo.br', '109.209.309-19', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1982-02-28'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente10@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1982-02-28'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '61997890010') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '61997890010', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'DF') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Brasília - DF', 'DF'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Brasília') AND e.est_sigla = 'DF' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Brasília', upper('Brasília'), est_id FROM livraria_ref.estados WHERE est_sigla = 'DF' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Asa Sul') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Asa Sul', upper('Asa Sul'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '70390100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('70390100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'W3 Sul' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'W3 Sul') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 10') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 10', v_tre_id, v_log_id, '500', 'Bloco A', v_cid_id, v_bai_id, '70390100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 11: Karina Mendes Freitas
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente11@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Karina Mendes Freitas', 'demo.cliente11@les.demo.br', '110.210.310-20', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1994-10-15'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente11@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1994-10-15'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '62998901011') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '62998901011', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'GO') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Goiânia - GO', 'GO'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Goiânia') AND e.est_sigla = 'GO' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Goiânia', upper('Goiânia'), est_id FROM livraria_ref.estados WHERE est_sigla = 'GO' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Setor Bueno') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Setor Bueno', upper('Setor Bueno'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '74230100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('74230100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'T-10' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'T-10') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 11') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 11', v_tre_id, v_log_id, '1200', NULL, v_cid_id, v_bai_id, '74230100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 12: Leonardo Duarte Prado
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente12@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Leonardo Duarte Prado', 'demo.cliente12@les.demo.br', '111.211.311-21', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '2003-05-03'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente12@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '2003-05-03'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '92999012012') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '92999012012', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'AM') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Manaus - AM', 'AM'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Manaus') AND e.est_sigla = 'AM' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Manaus', upper('Manaus'), est_id FROM livraria_ref.estados WHERE est_sigla = 'AM' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Adrianópolis') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Adrianópolis', upper('Adrianópolis'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '69057002') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('69057002', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Djalma Batista' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Djalma Batista') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 12') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 12', v_tre_id, v_log_id, '1000', NULL, v_cid_id, v_bai_id, '69057002', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 13: Mariana Lopes Batista
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente13@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Mariana Lopes Batista', 'demo.cliente13@les.demo.br', '112.212.312-22', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1987-12-20'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente13@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1987-12-20'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '91990123013') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '91990123013', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'PA') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Belém - PA', 'PA'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Belém') AND e.est_sigla = 'PA' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Belém', upper('Belém'), est_id FROM livraria_ref.estados WHERE est_sigla = 'PA' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Nazaré') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Nazaré', upper('Nazaré'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '66035100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('66035100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Presidente Vargas' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Presidente Vargas') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 13') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 13', v_tre_id, v_log_id, '800', NULL, v_cid_id, v_bai_id, '66035100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 14: Nicolas Vieira Campos
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente14@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Nicolas Vieira Campos', 'demo.cliente14@les.demo.br', '113.213.313-23', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1991-07-09'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente14@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1991-07-09'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '27991234014') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '27991234014', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'ES') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Vitória - ES', 'ES'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Vitória') AND e.est_sigla = 'ES' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Vitória', upper('Vitória'), est_id FROM livraria_ref.estados WHERE est_sigla = 'ES' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Praia do Canto') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Praia do Canto', upper('Praia do Canto'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '29055600') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('29055600', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Champagnat' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Champagnat') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 14') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 14', v_tre_id, v_log_id, '400', NULL, v_cid_id, v_bai_id, '29055600', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 15: Olívia Gomes Santana
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente15@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Olívia Gomes Santana', 'demo.cliente15@les.demo.br', '114.214.314-24', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1999-01-26'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente15@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1999-01-26'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '83992345015') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '83992345015', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'PB') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('João Pessoa - PB', 'PB'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('João Pessoa') AND e.est_sigla = 'PB' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'João Pessoa', upper('João Pessoa'), est_id FROM livraria_ref.estados WHERE est_sigla = 'PB' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Tambaú') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Tambaú', upper('Tambaú'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '58039100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('58039100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Epitácio Pessoa' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Epitácio Pessoa') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 15') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 15', v_tre_id, v_log_id, '900', NULL, v_cid_id, v_bai_id, '58039100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 16: Paulo Ricardo Muniz
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente16@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Paulo Ricardo Muniz', 'demo.cliente16@les.demo.br', '115.215.315-25', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1972-11-18'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente16@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1972-11-18'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '84993456016') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '84993456016', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'RN') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Natal - RN', 'RN'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Natal') AND e.est_sigla = 'RN' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Natal', upper('Natal'), est_id FROM livraria_ref.estados WHERE est_sigla = 'RN' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Ponta Negra') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Ponta Negra', upper('Ponta Negra'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '59090200') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('59090200', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Engenheiro Roberto Freire' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Engenheiro Roberto Freire') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 16') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 16', v_tre_id, v_log_id, '2500', NULL, v_cid_id, v_bai_id, '59090200', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 17: Queila Andrade Borges
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente17@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Queila Andrade Borges', 'demo.cliente17@les.demo.br', '116.216.316-26', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1993-04-04'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente17@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1993-04-04'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '82994567017') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '82994567017', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'AL') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Maceió - AL', 'AL'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Maceió') AND e.est_sigla = 'AL' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Maceió', upper('Maceió'), est_id FROM livraria_ref.estados WHERE est_sigla = 'AL' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Pajuçara') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Pajuçara', upper('Pajuçara'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '57030100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('57030100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Dr. Antônio Gouveia' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Dr. Antônio Gouveia') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 17') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 17', v_tre_id, v_log_id, '600', NULL, v_cid_id, v_bai_id, '57030100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 18: Rafael Correa Nunes
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente18@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Rafael Correa Nunes', 'demo.cliente18@les.demo.br', '117.217.317-27', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1986-09-12'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente18@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1986-09-12'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '79995678018') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '79995678018', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'SE') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Aracaju - SE', 'SE'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Aracaju') AND e.est_sigla = 'SE' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Aracaju', upper('Aracaju'), est_id FROM livraria_ref.estados WHERE est_sigla = 'SE' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Atalaia') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Atalaia', upper('Atalaia'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '49037000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('49037000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Santo Antônio' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Santo Antônio') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 18') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 18', v_tre_id, v_log_id, '1500', NULL, v_cid_id, v_bai_id, '49037000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 19: Sandra Oliveira Reis
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente19@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Sandra Oliveira Reis', 'demo.cliente19@les.demo.br', '118.218.318-28', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1970-06-01'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente19@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1970-06-01'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '86996789019') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '86996789019', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'PI') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Teresina - PI', 'PI'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Teresina') AND e.est_sigla = 'PI' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Teresina', upper('Teresina'), est_id FROM livraria_ref.estados WHERE est_sigla = 'PI' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '64000100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('64000100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Rui Barbosa' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Rui Barbosa') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 19') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 19', v_tre_id, v_log_id, '300', NULL, v_cid_id, v_bai_id, '64000100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 20: Thiago Pacheco Lira
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente20@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Thiago Pacheco Lira', 'demo.cliente20@les.demo.br', '119.219.319-29', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '2000-03-23'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente20@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '2000-03-23'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '98997890020') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '98997890020', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'MA') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('São Luís - MA', 'MA'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('São Luís') AND e.est_sigla = 'MA' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'São Luís', upper('São Luís'), est_id FROM livraria_ref.estados WHERE est_sigla = 'MA' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Calhau') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Calhau', upper('Calhau'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '65071380') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('65071380', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Jerônimo de Albuquerque' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Jerônimo de Albuquerque') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 20') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 20', v_tre_id, v_log_id, '1200', NULL, v_cid_id, v_bai_id, '65071380', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 21: Úrsula Farias Monteiro
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente21@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Úrsula Farias Monteiro', 'demo.cliente21@les.demo.br', '120.220.320-30', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1984-08-30'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente21@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1984-08-30'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '65998901021') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '65998901021', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'MT') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Cuiabá - MT', 'MT'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Cuiabá') AND e.est_sigla = 'MT' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Cuiabá', upper('Cuiabá'), est_id FROM livraria_ref.estados WHERE est_sigla = 'MT' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '78005100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('78005100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Miguel Sutil' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Miguel Sutil') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 21') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 21', v_tre_id, v_log_id, '700', NULL, v_cid_id, v_bai_id, '78005100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 22: Victor Hugo Siqueira
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente22@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Victor Hugo Siqueira', 'demo.cliente22@les.demo.br', '121.221.321-31', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1997-12-12'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente22@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1997-12-12'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '67999012022') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '67999012022', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'MS') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Campo Grande - MS', 'MS'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Campo Grande') AND e.est_sigla = 'MS' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Campo Grande', upper('Campo Grande'), est_id FROM livraria_ref.estados WHERE est_sigla = 'MS' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '79002100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('79002100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = '14 de Julho' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, '14 de Julho') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 22') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 22', v_tre_id, v_log_id, '500', NULL, v_cid_id, v_bai_id, '79002100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 23: Wanessa Brito Carvalho
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente23@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Wanessa Brito Carvalho', 'demo.cliente23@les.demo.br', '122.222.322-32', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1989-05-17'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente23@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1989-05-17'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '69990123023') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '69990123023', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'RO') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Porto Velho - RO', 'RO'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Porto Velho') AND e.est_sigla = 'RO' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Porto Velho', upper('Porto Velho'), est_id FROM livraria_ref.estados WHERE est_sigla = 'RO' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Olaria') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Olaria', upper('Olaria'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '76801000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('76801000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Pinheiro Machado' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Pinheiro Machado') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 23') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 23', v_tre_id, v_log_id, '400', NULL, v_cid_id, v_bai_id, '76801000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 24: Xavier Moura Teles
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente24@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Xavier Moura Teles', 'demo.cliente24@les.demo.br', '123.223.323-33', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1981-10-08'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente24@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1981-10-08'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '68991234024') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '68991234024', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'AC') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Rio Branco - AC', 'AC'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Rio Branco') AND e.est_sigla = 'AC' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Rio Branco', upper('Rio Branco'), est_id FROM livraria_ref.estados WHERE est_sigla = 'AC' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Bosque') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Bosque', upper('Bosque'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '69900400') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('69900400', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Ceará' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Ceará') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 24') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 24', v_tre_id, v_log_id, '250', NULL, v_cid_id, v_bai_id, '69900400', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 25: Yasmin Correia Paiva
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente25@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Yasmin Correia Paiva', 'demo.cliente25@les.demo.br', '124.224.324-34', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '2002-07-19'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente25@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '2002-07-19'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '95992345025') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '95992345025', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'RR') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Boa Vista - RR', 'RR'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Boa Vista') AND e.est_sigla = 'RR' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Boa Vista', upper('Boa Vista'), est_id FROM livraria_ref.estados WHERE est_sigla = 'RR' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '69301000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('69301000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Benjamin Constant' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Benjamin Constant') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 25') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 25', v_tre_id, v_log_id, '350', NULL, v_cid_id, v_bai_id, '69301000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 26: Zeca Almeida Furtado
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente26@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Zeca Almeida Furtado', 'demo.cliente26@les.demo.br', '125.225.325-35', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1976-02-14'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente26@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1976-02-14'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '96993456026') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '96993456026', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'AP') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Macapá - AP', 'AP'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Macapá') AND e.est_sigla = 'AP' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Macapá', upper('Macapá'), est_id FROM livraria_ref.estados WHERE est_sigla = 'AP' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '68900000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('68900000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'FAB' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'FAB') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 26') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 26', v_tre_id, v_log_id, '100', NULL, v_cid_id, v_bai_id, '68900000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 27: Alice Moreira Braga
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente27@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Alice Moreira Braga', 'demo.cliente27@les.demo.br', '126.226.326-36', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1995-11-28'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente27@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1995-11-28'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '63994567027') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '63994567027', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'TO') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Palmas - TO', 'TO'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Palmas') AND e.est_sigla = 'TO' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Palmas', upper('Palmas'), est_id FROM livraria_ref.estados WHERE est_sigla = 'TO' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Plano Diretor Sul') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Plano Diretor Sul', upper('Plano Diretor Sul'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '77020000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('77020000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'JK' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'JK') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 27') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 27', v_tre_id, v_log_id, '1500', NULL, v_cid_id, v_bai_id, '77020000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 28: Bernardo Cunha Matos
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente28@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Bernardo Cunha Matos', 'demo.cliente28@les.demo.br', '127.227.327-37', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1983-04-02'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente28@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1983-04-02'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '19995678028') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '19995678028', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'SP') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Campinas - SP', 'SP'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Campinas') AND e.est_sigla = 'SP' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Campinas', upper('Campinas'), est_id FROM livraria_ref.estados WHERE est_sigla = 'SP' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Cambuí') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Cambuí', upper('Cambuí'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '13025000') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('13025000', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Barão de Itapura' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Barão de Itapura') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 28') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 28', v_tre_id, v_log_id, '900', NULL, v_cid_id, v_bai_id, '13025000', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 29: Clara Nascimento Vale
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente29@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Clara Nascimento Vale', 'demo.cliente29@les.demo.br', '128.228.328-38', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'feminino', '1998-08-16'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente29@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'feminino', '1998-08-16'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '21996789029') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '21996789029', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'RJ') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Niterói - RJ', 'RJ'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Niterói') AND e.est_sigla = 'RJ' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Niterói', upper('Niterói'), est_id FROM livraria_ref.estados WHERE est_sigla = 'RJ' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Icaraí') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Icaraí', upper('Icaraí'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '24230100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('24230100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Itacoatiara' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Itacoatiara') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 29') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 29', v_tre_id, v_log_id, '200', NULL, v_cid_id, v_bai_id, '24230100', v_pai_id, TRUE, v_loj_id);
  END IF;

  -- Cliente 30: Daniel Rangel Porto
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente30@les.demo.br') THEN
    INSERT INTO livraria_gestao.usuarios (usu_uuid, usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id, usu_tipo_pessoa, usu_genero, usu_data_nascimento)
    VALUES (gen_random_uuid(), 'Daniel Rangel Porto', 'demo.cliente30@les.demo.br', '129.229.329-39', '$2b$10$bGazvFqZA5vlwOA7OMmcMeErmfbNJKDLXRT9h61.oQ6RyiZFglS1.', v_papel_cliente, TRUE, v_loj_id, 'PF', 'masculino', '1990-01-05'::date);
  END IF;
  SELECT usu_id INTO v_usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'demo.cliente30@les.demo.br';
  INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id) VALUES (v_usu_id, 'masculino', '1990-01-05'::date, v_loj_id) ON CONFLICT (usu_id) DO UPDATE SET cli_data_nascimento = EXCLUDED.cli_data_nascimento, cli_genero = EXCLUDED.cli_genero;
  INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em) VALUES (v_usu_id, v_papel_cliente, TRUE, NOW(), NOW()) ON CONFLICT (usu_id, pap_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular') THEN INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('Celular'); END IF;
  SELECT ttp_id INTO v_ttp_id FROM livraria_ref.tipos_telefones WHERE ttp_descricao = 'Celular' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.telefones WHERE usu_id = v_usu_id AND tel_numero = '34997890030') THEN
    INSERT INTO livraria_gestao.telefones (usu_id, ttp_id, tel_numero, tel_principal) VALUES (v_usu_id, v_ttp_id, '34997890030', TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_residencias WHERE tre_descricao = 'Apartamento') THEN INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento'); END IF;
  SELECT tre_id INTO v_tre_id FROM livraria_ref.tipos_residencias WHERE tre_descricao IN ('Apartamento','Casa') ORDER BY tre_id LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.tipos_logradouros WHERE tlo_descricao = 'Rua') THEN INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua'); END IF;
  SELECT tlo_id INTO v_tlo_id FROM livraria_ref.tipos_logradouros WHERE tlo_descricao IN ('Avenida','Rua') ORDER BY CASE WHEN tlo_descricao = 'Avenida' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.paises WHERE pai_nome = 'Brasil') THEN INSERT INTO livraria_ref.paises (pai_nome, pai_sigla) VALUES ('Brasil', 'BRA'); END IF;
  SELECT pai_id INTO v_pai_id FROM livraria_ref.paises WHERE pai_nome = 'Brasil' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.estados WHERE est_sigla = 'MG') THEN INSERT INTO livraria_ref.estados (est_nome, est_sigla) VALUES ('Uberlândia - MG', 'MG'); END IF;
  SELECT cid_id INTO v_cid_id FROM livraria_ref.cidades c JOIN livraria_ref.estados e ON c.est_id = e.est_id WHERE upper(c.cid_nome) = upper('Uberlândia') AND e.est_sigla = 'MG' LIMIT 1;
  IF v_cid_id IS NULL THEN INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id) SELECT 'Uberlândia', upper('Uberlândia'), est_id FROM livraria_ref.estados WHERE est_sigla = 'MG' RETURNING cid_id INTO v_cid_id; END IF;
  SELECT bai_id INTO v_bai_id FROM livraria_ref.bairros WHERE upper(bai_nome) = upper('Centro') AND cid_id = v_cid_id LIMIT 1;
  IF v_bai_id IS NULL THEN INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id) VALUES ('Centro', upper('Centro'), v_cid_id) RETURNING bai_id INTO v_bai_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_ref.ceps WHERE cep_numero = '38400100') THEN INSERT INTO livraria_ref.ceps (cep_numero, cid_id, bai_id) VALUES ('38400100', v_cid_id, v_bai_id); END IF;
  SELECT log_id INTO v_log_id FROM livraria_ref.logradouros WHERE log_nome = 'Rui Barbosa' AND tlo_id = v_tlo_id LIMIT 1;
  IF v_log_id IS NULL THEN INSERT INTO livraria_ref.logradouros (tlo_id, log_nome) VALUES (v_tlo_id, 'Rui Barbosa') RETURNING log_id INTO v_log_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM livraria_gestao.enderecos WHERE usu_id = v_usu_id AND end_apelido = 'Residência 30') THEN
    INSERT INTO livraria_gestao.enderecos (usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento, cid_id, bai_id, cep_id, pai_id, end_principal, loj_id)
    VALUES (v_usu_id, 'entrega', 'Residência 30', v_tre_id, v_log_id, '450', NULL, v_cid_id, v_bai_id, '38400100', v_pai_id, TRUE, v_loj_id);
  END IF;

  SELECT gpr_id INTO v_gpr_id FROM livraria_comercial.grupos_precificacao WHERE gpr_descricao IN ('Varejo','Livros de Ficção') ORDER BY gpr_id LIMIT 1;
  IF v_gpr_id IS NULL THEN INSERT INTO livraria_comercial.grupos_precificacao (gpr_descricao, gpr_margem_lucro_percentual) VALUES ('Varejo', 30) RETURNING gpr_id INTO v_gpr_id; END IF;

  SELECT COUNT(*) INTO v_total_livros FROM livraria_comercial.livros;
  RAISE NOTICE 'Livros atuais: %, meta: 100', v_total_livros;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-01-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Paulo Coelho', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Paulo Coelho');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Paulo Coelho';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Alquimista', lower('O Alquimista'), 1988, '1ª edição', '978-65-9900-00-01-X', 208, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 15, 0, 29.90, 15.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-02-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Machado de Assis', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Memórias Póstumas de Brás Cubas', lower('Memórias Póstumas de Brás Cubas'), 2011, '1ª edição', '978-65-9900-00-02-X', 256, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 16, 0, 31.00, 16.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-03-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jorge Amado', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Capitães da Areia', lower('Capitães da Areia'), 1937, '1ª edição', '978-65-9900-00-03-X', 320, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 17, 0, 32.10, 17.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-04-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Graciliano Ramos', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Graciliano Ramos');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Graciliano Ramos';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Record' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Record', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Vidas Secas', lower('Vidas Secas'), 1938, '1ª edição', '978-65-9900-00-04-X', 176, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 18, 0, 33.20, 18.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-05-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'João Guimarães Rosa', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'João Guimarães Rosa');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'João Guimarães Rosa';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Nova Fronteira' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Nova Fronteira', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Grande Sertão: Veredas', lower('Grande Sertão: Veredas'), 1956, '1ª edição', '978-65-9900-00-05-X', 624, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 19, 0, 34.30, 19.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-06-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Clarice Lispector', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Clarice Lispector');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Clarice Lispector';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Hora da Estrela', lower('A Hora da Estrela'), 1977, '1ª edição', '978-65-9900-00-06-X', 96, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 20, 0, 35.40, 20.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-07-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Gabriel García Márquez', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Gabriel García Márquez');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Gabriel García Márquez';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Record' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Record', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Cem Anos de Solidão', lower('Cem Anos de Solidão'), 1967, '1ª edição', '978-65-9900-00-07-X', 432, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 21, 0, 36.50, 21.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-08-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Fiódor Dostoiévski', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Fiódor Dostoiévski');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Fiódor Dostoiévski';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Crime e Castigo', lower('Crime e Castigo'), 1996, '1ª edição', '978-65-9900-00-08-X', 576, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 22, 0, 37.60, 22.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-09-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jane Austen', 'Autor(a) de obras Romance.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jane Austen');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jane Austen';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Orgulho e Preconceito', lower('Orgulho e Preconceito'), 2013, '1ª edição', '978-65-9900-00-09-X', 424, 'Obra de Romance — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Romance', 'Categoria Romance') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Romance';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 23, 0, 38.70, 23.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-10-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Antoine de Saint-Exupéry', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Antoine de Saint-Exupéry');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Antoine de Saint-Exupéry';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Agir' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Agir', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Pequeno Príncipe', lower('O Pequeno Príncipe'), 1943, '1ª edição', '978-65-9900-00-10-X', 96, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 24, 0, 39.80, 24.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-11-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Yuval Noah Harari', 'Autor(a) de obras História.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Yuval Noah Harari');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Yuval Noah Harari';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Sapiens: Uma Breve História da Humanidade', lower('Sapiens: Uma Breve História da Humanidade'), 2011, '1ª edição', '978-65-9900-00-11-X', 464, 'Obra de História — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('História', 'Categoria História') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'História';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 25, 0, 40.90, 25.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-12-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Charles Duhigg', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Charles Duhigg');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Charles Duhigg';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Objetiva' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Objetiva', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Poder do Hábito', lower('O Poder do Hábito'), 2012, '1ª edição', '978-65-9900-00-12-X', 408, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 26, 0, 42.00, 26.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-13-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Carol S. Dweck', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Carol S. Dweck');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Carol S. Dweck';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Objetiva' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Objetiva', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Mindset: A Nova Psicologia do Sucesso', lower('Mindset: A Nova Psicologia do Sucesso'), 2006, '1ª edição', '978-65-9900-00-13-X', 320, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 27, 0, 43.10, 27.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-14-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Brené Brown', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Brené Brown');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Brené Brown';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Sextante' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Sextante', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Coragem de Ser Imperfeito', lower('A Coragem de Ser Imperfeito'), 2012, '1ª edição', '978-65-9900-00-14-X', 320, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 28, 0, 44.20, 28.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-15-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'George S. Clason', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'George S. Clason');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'George S. Clason';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Gente' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Gente', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Homem Mais Rico da Babilônia', lower('O Homem Mais Rico da Babilônia'), 1926, '1ª edição', '978-65-9900-00-15-X', 144, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 29, 0, 45.30, 29.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-16-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Robert T. Kiyosaki', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Robert T. Kiyosaki');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Robert T. Kiyosaki';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Alta Books' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Alta Books', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Pai Rico, Pai Pobre', lower('Pai Rico, Pai Pobre'), 1997, '1ª edição', '978-65-9900-00-16-X', 336, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 30, 0, 46.40, 30.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-17-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Eric Ries', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Eric Ries');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Eric Ries';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Leya' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Leya', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Startup Enxuta', lower('A Startup Enxuta'), 2011, '1ª edição', '978-65-9900-00-17-X', 336, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 31, 0, 47.50, 31.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-18-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Peter Thiel', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Peter Thiel');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Peter Thiel';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Zero to One', lower('Zero to One'), 2014, '1ª edição', '978-65-9900-00-18-X', 224, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 32, 0, 48.60, 32.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-19-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Robert C. Martin', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Robert C. Martin');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Robert C. Martin';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Alta Books' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Alta Books', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Arquitetura Limpa', lower('Arquitetura Limpa'), 2017, '1ª edição', '978-65-9900-00-19-X', 432, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 33, 0, 49.70, 33.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-20-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Martin Fowler', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Martin Fowler');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Martin Fowler';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Alta Books' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Alta Books', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Refatoração', lower('Refatoração'), 1999, '1ª edição', '978-65-9900-00-20-X', 448, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 34, 0, 50.80, 34.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-21-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Gang of Four', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Gang of Four');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Gang of Four';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Bookman' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Bookman', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Design Patterns', lower('Design Patterns'), 1994, '1ª edição', '978-65-9900-00-21-X', 416, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 35, 0, 51.90, 15.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-22-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Thomas H. Cormen', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Thomas H. Cormen');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Thomas H. Cormen';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Gen LTC' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Gen LTC', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Introdução aos Algoritmos', lower('Introdução aos Algoritmos'), 2009, '1ª edição', '978-65-9900-00-22-X', 1312, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 36, 0, 53.00, 16.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-23-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Andrew S. Tanenbaum', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Andrew S. Tanenbaum');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Andrew S. Tanenbaum';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Pearson' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Pearson', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Redes de Computadores', lower('Redes de Computadores'), 2010, '1ª edição', '978-65-9900-00-23-X', 960, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 37, 0, 54.10, 17.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-24-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Andrew Hunt', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Andrew Hunt');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Andrew Hunt';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Bookman' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Bookman', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Programador Pragmático', lower('O Programador Pragmático'), 1999, '1ª edição', '978-65-9900-00-24-X', 352, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 38, 0, 55.20, 18.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-25-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Eric Gunnerson', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Eric Gunnerson');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Eric Gunnerson';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Alta Books' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Alta Books', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'C# em Nível de Especialista', lower('C# em Nível de Especialista'), 2002, '1ª edição', '978-65-9900-00-25-X', 800, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 39, 0, 56.30, 19.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-26-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Luciano Ramalho', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Luciano Ramalho');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Luciano Ramalho';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Novatec' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Novatec', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Python Fluente', lower('Python Fluente'), 2015, '1ª edição', '978-65-9900-00-26-X', 792, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 40, 0, 57.40, 20.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-27-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'David Flanagan', 'Autor(a) de obras Tecnologia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'David Flanagan');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'David Flanagan';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Alta Books' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Alta Books', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'JavaScript: O Guia Definitivo', lower('JavaScript: O Guia Definitivo'), 2011, '1ª edição', '978-65-9900-00-27-X', 1096, 'Obra de Tecnologia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Tecnologia', 'Categoria Tecnologia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Tecnologia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 41, 0, 58.50, 21.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-28-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'William Golding', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'William Golding');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'William Golding';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Senhor das Moscas', lower('O Senhor das Moscas'), 1954, '1ª edição', '978-65-9900-00-28-X', 224, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 42, 0, 59.60, 22.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-29-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Aldous Huxley', 'Autor(a) de obras Distopia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Aldous Huxley');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Aldous Huxley';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Admirável Mundo Novo', lower('Admirável Mundo Novo'), 1932, '1ª edição', '978-65-9900-00-29-X', 288, 'Obra de Distopia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Distopia', 'Categoria Distopia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Distopia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 43, 0, 60.70, 23.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-30-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Ray Bradbury', 'Autor(a) de obras Distopia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Ray Bradbury');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Ray Bradbury';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Fahrenheit 451', lower('Fahrenheit 451'), 1953, '1ª edição', '978-65-9900-00-30-X', 256, 'Obra de Distopia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Distopia', 'Categoria Distopia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Distopia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 44, 0, 61.80, 24.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-31-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Margaret Atwood', 'Autor(a) de obras Distopia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Margaret Atwood');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Margaret Atwood';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Conto da Aia', lower('O Conto da Aia'), 1985, '1ª edição', '978-65-9900-00-31-X', 320, 'Obra de Distopia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Distopia', 'Categoria Distopia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Distopia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 45, 0, 62.90, 25.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-32-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'William Gibson', 'Autor(a) de obras Ficção Científica.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'William Gibson');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'William Gibson';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Aleph' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Aleph', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Neuromancer', lower('Neuromancer'), 1984, '1ª edição', '978-65-9900-00-32-X', 320, 'Obra de Ficção Científica — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Ficção Científica', 'Categoria Ficção Científica') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Ficção Científica';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 46, 0, 64.00, 26.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-33-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Isaac Asimov', 'Autor(a) de obras Ficção Científica.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Isaac Asimov');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Isaac Asimov';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Aleph' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Aleph', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Fundação', lower('Fundação'), 1951, '1ª edição', '978-65-9900-00-33-X', 320, 'Obra de Ficção Científica — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Ficção Científica', 'Categoria Ficção Científica') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Ficção Científica';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 47, 0, 65.10, 27.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-34-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Liu Cixin', 'Autor(a) de obras Ficção Científica.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Liu Cixin');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Liu Cixin';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Problema dos Três Corpos', lower('O Problema dos Três Corpos'), 2008, '1ª edição', '978-65-9900-00-34-X', 384, 'Obra de Ficção Científica — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Ficção Científica', 'Categoria Ficção Científica') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Ficção Científica';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 48, 0, 66.20, 28.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-35-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Andy Weir', 'Autor(a) de obras Ficção Científica.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Andy Weir');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Andy Weir';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Projeto Hail Mary', lower('Projeto Hail Mary'), 2021, '1ª edição', '978-65-9900-00-35-X', 496, 'Obra de Ficção Científica — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Ficção Científica', 'Categoria Ficção Científica') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Ficção Científica';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 49, 0, 67.30, 29.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-36-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Patrick Rothfuss', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Patrick Rothfuss');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Patrick Rothfuss';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Arqueiro' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Arqueiro', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Nome do Vento', lower('O Nome do Vento'), 2007, '1ª edição', '978-65-9900-00-36-X', 672, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 15, 0, 68.40, 30.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-37-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Brandon Sanderson', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Brandon Sanderson');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Brandon Sanderson';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Arqueiro' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Arqueiro', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Mistborn: O Império Final', lower('Mistborn: O Império Final'), 2006, '1ª edição', '978-65-9900-00-37-X', 544, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 16, 0, 69.50, 31.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-38-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Raymond E. Feist', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Raymond E. Feist');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Raymond E. Feist';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Mago', lower('O Mago'), 1982, '1ª edição', '978-65-9900-00-38-X', 480, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 17, 0, 70.60, 32.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-39-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Christopher Paolini', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Christopher Paolini');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Christopher Paolini';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Eragon', lower('Eragon'), 2002, '1ª edição', '978-65-9900-00-39-X', 528, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 18, 0, 71.70, 33.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-40-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Stephen King', 'Autor(a) de obras Terror.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Stephen King');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Stephen King';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Suma' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Suma', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'It: A Coisa', lower('It: A Coisa'), 1986, '1ª edição', '978-65-9900-00-40-X', 1136, 'Obra de Terror — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Terror', 'Categoria Terror') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Terror';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 19, 0, 72.80, 34.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-41-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Stephen King', 'Autor(a) de obras Terror.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Stephen King');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Stephen King';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Suma' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Suma', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Iluminado', lower('O Iluminado'), 1977, '1ª edição', '978-65-9900-00-41-X', 448, 'Obra de Terror — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Terror', 'Categoria Terror') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Terror';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 20, 0, 73.90, 15.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-42-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Bram Stoker', 'Autor(a) de obras Terror.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Bram Stoker');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Bram Stoker';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Drácula', lower('Drácula'), 1957, '1ª edição', '978-65-9900-00-42-X', 448, 'Obra de Terror — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Terror', 'Categoria Terror') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Terror';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 21, 0, 75.00, 16.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-43-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Dan Brown', 'Autor(a) de obras Mistério.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Dan Brown');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Dan Brown';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Sextante' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Sextante', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Código Da Vinci', lower('O Código Da Vinci'), 2003, '1ª edição', '978-65-9900-00-43-X', 432, 'Obra de Mistério — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Mistério', 'Categoria Mistério') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Mistério';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 22, 0, 76.10, 17.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-44-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Paula Hawkins', 'Autor(a) de obras Mistério.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Paula Hawkins');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Paula Hawkins';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Record' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Record', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Garota no Trem', lower('A Garota no Trem'), 2015, '1ª edição', '978-65-9900-00-44-X', 336, 'Obra de Mistério — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Mistério', 'Categoria Mistério') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Mistério';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 23, 0, 77.20, 18.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-45-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Ivan Mizanzuk', 'Autor(a) de obras Mistério.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Ivan Mizanzuk');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Ivan Mizanzuk';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Caso Evandro', lower('O Caso Evandro'), 2019, '1ª edição', '978-65-9900-00-45-X', 384, 'Obra de Mistério — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Mistério', 'Categoria Mistério') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Mistério';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 24, 0, 78.30, 19.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-46-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Harper Lee', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Harper Lee');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Harper Lee';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Sol é Para Todos', lower('O Sol é Para Todos'), 1960, '1ª edição', '978-65-9900-00-46-X', 336, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 25, 0, 79.40, 20.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-47-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Roald Dahl', 'Autor(a) de obras Infantil.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Roald Dahl');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Roald Dahl';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Matilda', lower('Matilda'), 1988, '1ª edição', '978-65-9900-00-47-X', 240, 'Obra de Infantil — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Infantil', 'Categoria Infantil') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Infantil';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 26, 0, 80.50, 21.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-48-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jeff Kinney', 'Autor(a) de obras Infantil.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jeff Kinney');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jeff Kinney';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Galera Record' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Galera Record', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Diário de um Banana', lower('Diário de um Banana'), 2007, '1ª edição', '978-65-9900-00-48-X', 224, 'Obra de Infantil — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Infantil', 'Categoria Infantil') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Infantil';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 27, 0, 81.60, 22.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-49-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Rick Riordan', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Rick Riordan');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Rick Riordan';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Percy Jackson e o Ladrão de Raios', lower('Percy Jackson e o Ladrão de Raios'), 2005, '1ª edição', '978-65-9900-00-49-X', 400, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 28, 0, 82.70, 23.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-50-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Cassandra Clare', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Cassandra Clare');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Cassandra Clare';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Galera Record' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Galera Record', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Cidade do Pecado', lower('Cidade do Pecado'), 2007, '1ª edição', '978-65-9900-00-50-X', 512, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 29, 0, 83.80, 24.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-51-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'John Green', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'John Green');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'John Green';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Culpa é das Estrelas', lower('A Culpa é das Estrelas'), 2012, '1ª edição', '978-65-9900-00-51-X', 288, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 30, 0, 29.90, 25.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-52-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Anne Frank', 'Autor(a) de obras Biografia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Anne Frank');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Anne Frank';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Record' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Record', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Diário de Anne Frank', lower('O Diário de Anne Frank'), 1947, '1ª edição', '978-65-9900-00-52-X', 352, 'Obra de Biografia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Biografia', 'Categoria Biografia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Biografia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 31, 0, 31.00, 26.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-53-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Walter Isaacson', 'Autor(a) de obras Biografia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Walter Isaacson');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Walter Isaacson';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Steve Jobs', lower('Steve Jobs'), 2011, '1ª edição', '978-65-9900-00-53-X', 656, 'Obra de Biografia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Biografia', 'Categoria Biografia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Biografia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 32, 0, 32.10, 27.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-54-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Michelle Obama', 'Autor(a) de obras Biografia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Michelle Obama');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Michelle Obama';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Minha Vida', lower('Minha Vida'), 2018, '1ª edição', '978-65-9900-00-54-X', 448, 'Obra de Biografia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Biografia', 'Categoria Biografia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Biografia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 33, 0, 33.20, 28.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-55-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Laurentino Gomes', 'Autor(a) de obras História.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Laurentino Gomes');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Laurentino Gomes';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Globo Livros' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Globo Livros', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), '1808', lower('1808'), 2007, '1ª edição', '978-65-9900-00-55-X', 384, 'Obra de História — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('História', 'Categoria História') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'História';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 34, 0, 34.30, 29.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-56-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Lilia Schwarcz', 'Autor(a) de obras História.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Lilia Schwarcz');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Lilia Schwarcz';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Brasil: Uma Biografia', lower('Brasil: Uma Biografia'), 2015, '1ª edição', '978-65-9900-00-56-X', 800, 'Obra de História — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('História', 'Categoria História') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'História';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 35, 0, 35.40, 30.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-57-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Yuval Noah Harari', 'Autor(a) de obras História.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Yuval Noah Harari');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Yuval Noah Harari';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Sapiens Ilustrado', lower('Sapiens Ilustrado'), 2020, '1ª edição', '978-65-9900-00-57-X', 240, 'Obra de História — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('História', 'Categoria História') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'História';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 36, 0, 36.50, 31.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-58-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Platão', 'Autor(a) de obras Filosofia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Platão');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Platão';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Mito da Caverna', lower('O Mito da Caverna'), 2010, '1ª edição', '978-65-9900-00-58-X', 128, 'Obra de Filosofia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Filosofia', 'Categoria Filosofia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Filosofia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 37, 0, 37.60, 32.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-59-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Marco Aurélio', 'Autor(a) de obras Filosofia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Marco Aurélio');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Marco Aurélio';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Meditations', lower('Meditations'), 2008, '1ª edição', '978-65-9900-00-59-X', 256, 'Obra de Filosofia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Filosofia', 'Categoria Filosofia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Filosofia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 38, 0, 38.70, 33.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-60-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jostein Gaarder', 'Autor(a) de obras Filosofia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jostein Gaarder');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jostein Gaarder';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Mundo de Sofia', lower('O Mundo de Sofia'), 1991, '1ª edição', '978-65-9900-00-60-X', 544, 'Obra de Filosofia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Filosofia', 'Categoria Filosofia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Filosofia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 39, 0, 39.80, 34.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-61-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Sun Tzu', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Sun Tzu');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Sun Tzu';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Arte da Guerra', lower('A Arte da Guerra'), 2012, '1ª edição', '978-65-9900-00-61-X', 160, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 40, 0, 40.90, 15.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-62-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Dale Carnegie', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Dale Carnegie');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Dale Carnegie';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Sextante' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Sextante', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Como Fazer Amigos e Influenciar Pessoas', lower('Como Fazer Amigos e Influenciar Pessoas'), 1936, '1ª edição', '978-65-9900-00-62-X', 320, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 41, 0, 42.00, 16.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-63-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Stephen R. Covey', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Stephen R. Covey');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Stephen R. Covey';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Agir' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Agir', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Os Sete Hábitos das Pessoas Eficazes', lower('Os Sete Hábitos das Pessoas Eficazes'), 1989, '1ª edição', '978-65-9900-00-63-X', 432, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 42, 0, 43.10, 17.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-64-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Mark Manson', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Mark Manson');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Mark Manson';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Sutil Arte de Ligar o Foda-se', lower('A Sutil Arte de Ligar o Foda-se'), 2016, '1ª edição', '978-65-9900-00-64-X', 224, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 43, 0, 44.20, 18.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-65-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'James Clear', 'Autor(a) de obras Desenvolvimento Pessoal.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'James Clear');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'James Clear';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Alta Books' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Alta Books', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Atomic Habits', lower('Atomic Habits'), 2018, '1ª edição', '978-65-9900-00-65-X', 320, 'Obra de Desenvolvimento Pessoal — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Desenvolvimento Pessoal', 'Categoria Desenvolvimento Pessoal') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Desenvolvimento Pessoal';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 44, 0, 45.30, 19.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-66-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Benjamin Graham', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Benjamin Graham');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Benjamin Graham';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Investidor Inteligente', lower('O Investidor Inteligente'), 1949, '1ª edição', '978-65-9900-00-66-X', 640, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 45, 0, 46.40, 20.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-67-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Daniel Kahneman', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Daniel Kahneman');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Daniel Kahneman';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Objetiva' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Objetiva', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Rápido e Devagar', lower('Rápido e Devagar'), 2011, '1ª edição', '978-65-9900-00-67-X', 608, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 46, 0, 47.50, 21.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-68-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Steven D. Levitt', 'Autor(a) de obras Negócios.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Steven D. Levitt');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Steven D. Levitt';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Objetiva' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Objetiva', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Freakonomics', lower('Freakonomics'), 2005, '1ª edição', '978-65-9900-00-68-X', 336, 'Obra de Negócios — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Negócios', 'Categoria Negócios') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Negócios';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 47, 0, 48.60, 22.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-69-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'George Orwell', 'Autor(a) de obras Distopia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'George Orwell');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'George Orwell';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Revolução dos Bichos', lower('A Revolução dos Bichos'), 1945, '1ª edição', '978-65-9900-00-69-X', 152, 'Obra de Distopia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Distopia', 'Categoria Distopia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Distopia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 48, 0, 49.70, 23.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-70-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Aluísio Azevedo', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Aluísio Azevedo');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Aluísio Azevedo';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Cortiço', lower('O Cortiço'), 1950, '1ª edição', '978-65-9900-00-70-X', 256, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 49, 0, 50.80, 24.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-71-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'José de Alencar', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'José de Alencar');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'José de Alencar';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Iracema', lower('Iracema'), 1995, '1ª edição', '978-65-9900-00-71-X', 160, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 15, 0, 51.90, 25.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-72-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'José de Alencar', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'José de Alencar');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'José de Alencar';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Guarani', lower('O Guarani'), 1987, '1ª edição', '978-65-9900-00-72-X', 384, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 16, 0, 53.00, 26.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-73-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Machado de Assis', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Quincas Borba', lower('Quincas Borba'), 1951, '1ª edição', '978-65-9900-00-73-X', 288, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 17, 0, 54.10, 27.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-74-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Machado de Assis', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Helena', lower('Helena'), 2006, '1ª edição', '978-65-9900-00-74-X', 224, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 18, 0, 55.20, 28.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-75-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Joaquim Manuel de Macedo', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Joaquim Manuel de Macedo');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Joaquim Manuel de Macedo';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Moreninha', lower('A Moreninha'), 1974, '1ª edição', '978-65-9900-00-75-X', 192, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 19, 0, 56.30, 29.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-76-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Machado de Assis', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Machado de Assis';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Alienista', lower('O Alienista'), 2012, '1ª edição', '978-65-9900-00-76-X', 96, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 20, 0, 57.40, 30.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-77-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Mário de Andrade', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Mário de Andrade');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Mário de Andrade';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Macunaíma', lower('Macunaíma'), 1928, '1ª edição', '978-65-9900-00-77-X', 160, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 21, 0, 58.50, 31.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-78-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Mário de Andrade', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Mário de Andrade');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Mário de Andrade';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Pauliceia Desvairada', lower('Pauliceia Desvairada'), 1922, '1ª edição', '978-65-9900-00-78-X', 96, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 22, 0, 59.60, 32.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-79-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jorge Amado', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Capitães da Areia - Edição Especial', lower('Capitães da Areia - Edição Especial'), 1937, '1ª edição', '978-65-9900-00-79-X', 400, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 23, 0, 60.70, 33.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-80-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jorge Amado', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Tenda dos Milagres', lower('Tenda dos Milagres'), 1969, '1ª edição', '978-65-9900-00-80-X', 384, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 24, 0, 61.80, 34.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-81-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jorge Amado', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jorge Amado';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Gabriela, Cravo e Canela', lower('Gabriela, Cravo e Canela'), 1958, '1ª edição', '978-65-9900-00-81-X', 320, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 25, 0, 62.90, 15.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-82-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Erico Verissimo', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Erico Verissimo');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Erico Verissimo';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Globo Livros' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Globo Livros', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Tempo e o Vento', lower('O Tempo e o Vento'), 1949, '1ª edição', '978-65-9900-00-82-X', 576, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 26, 0, 64.00, 16.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-83-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Erico Verissimo', 'Autor(a) de obras Literatura Brasileira.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Erico Verissimo');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Erico Verissimo';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Globo Livros' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Globo Livros', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Incidente em Antares', lower('Incidente em Antares'), 1971, '1ª edição', '978-65-9900-00-83-X', 448, 'Obra de Literatura Brasileira — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Literatura Brasileira', 'Categoria Literatura Brasileira') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Literatura Brasileira';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 27, 0, 65.10, 17.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-84-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Luis Fernando Verissimo', 'Autor(a) de obras Humor.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Luis Fernando Verissimo');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Luis Fernando Verissimo';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'L&PM' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('L&PM', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Hora do Starbuck', lower('A Hora do Starbuck'), 1983, '1ª edição', '978-65-9900-00-84-X', 160, 'Obra de Humor — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Humor', 'Categoria Humor') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Humor';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 28, 0, 66.20, 18.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-85-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Luis Fernando Verissimo', 'Autor(a) de obras Humor.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Luis Fernando Verissimo');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Luis Fernando Verissimo';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'L&PM' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('L&PM', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Fantástico Mistério de Feiurinha', lower('O Fantástico Mistério de Feiurinha'), 1985, '1ª edição', '978-65-9900-00-85-X', 128, 'Obra de Humor — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Humor', 'Categoria Humor') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Humor';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 29, 0, 67.30, 19.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-86-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Terry Pratchett', 'Autor(a) de obras Humor.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Terry Pratchett');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Terry Pratchett';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Discworld: A Cor da Magia', lower('Discworld: A Cor da Magia'), 1983, '1ª edição', '978-65-9900-00-86-X', 288, 'Obra de Humor — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Humor', 'Categoria Humor') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Humor';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 30, 0, 68.40, 20.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-87-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Terry Pratchett', 'Autor(a) de obras Humor.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Terry Pratchett');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Terry Pratchett';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Guards! Guards! - Edição Brasileira', lower('Guards! Guards! - Edição Brasileira'), 1989, '1ª edição', '978-65-9900-00-87-X', 352, 'Obra de Humor — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Humor', 'Categoria Humor') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Humor';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 31, 0, 69.50, 21.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-88-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.R.R. Tolkien', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Hobbit - Edição Ilustrada', lower('O Hobbit - Edição Ilustrada'), 1937, '1ª edição', '978-65-9900-00-88-X', 320, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 32, 0, 70.60, 22.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-89-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.R.R. Tolkien', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'As Duas Torres', lower('As Duas Torres'), 1954, '1ª edição', '978-65-9900-00-89-X', 448, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 33, 0, 71.70, 23.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-90-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.R.R. Tolkien', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Retorno do Rei', lower('O Retorno do Rei'), 1955, '1ª edição', '978-65-9900-00-90-X', 512, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 34, 0, 72.80, 24.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-91-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.K. Rowling', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.K. Rowling');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.K. Rowling';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Harry Potter e a Câmara Secreta', lower('Harry Potter e a Câmara Secreta'), 1998, '1ª edição', '978-65-9900-00-91-X', 368, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 35, 0, 73.90, 25.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-92-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.K. Rowling', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.K. Rowling');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.K. Rowling';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Harry Potter e o Prisioneiro de Azkaban', lower('Harry Potter e o Prisioneiro de Azkaban'), 1999, '1ª edição', '978-65-9900-00-92-X', 448, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 36, 0, 75.00, 26.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-93-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.K. Rowling', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.K. Rowling');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.K. Rowling';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Harry Potter e o Cálice de Fogo', lower('Harry Potter e o Cálice de Fogo'), 2000, '1ª edição', '978-65-9900-00-93-X', 640, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 37, 0, 76.10, 27.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-94-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Suzanne Collins', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Suzanne Collins');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Suzanne Collins';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Catching Fire', lower('Catching Fire'), 2009, '1ª edição', '978-65-9900-00-94-X', 400, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 38, 0, 77.20, 28.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-95-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Suzanne Collins', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Suzanne Collins');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Suzanne Collins';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Rocco' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Rocco', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Mockingjay', lower('Mockingjay'), 2010, '1ª edição', '978-65-9900-00-95-X', 400, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 39, 0, 78.30, 29.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-96-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.R.R. Tolkien', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Senhor dos Anéis: As Duas Torres', lower('O Senhor dos Anéis: As Duas Torres'), 1954, '1ª edição', '978-65-9900-00-96-X', 464, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 40, 0, 79.40, 30.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-97-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'J.R.R. Tolkien', 'Autor(a) de obras Fantasia.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'J.R.R. Tolkien';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'HarperCollins' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('HarperCollins', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Senhor dos Anéis: O Retorno do Rei', lower('O Senhor dos Anéis: O Retorno do Rei'), 1955, '1ª edição', '978-65-9900-00-97-X', 544, 'Obra de Fantasia — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Fantasia', 'Categoria Fantasia') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Fantasia';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 41, 0, 80.50, 31.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-98-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Markus Zusak', 'Autor(a) de obras Young Adult.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Markus Zusak');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Markus Zusak';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Menina que Roubava Livros - Ed. Especial', lower('A Menina que Roubava Livros - Ed. Especial'), 2005, '1ª edição', '978-65-9900-00-98-X', 480, 'Obra de Young Adult — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Young Adult', 'Categoria Young Adult') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Young Adult';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 42, 0, 81.60, 32.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-00-99-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Khaled Hosseini', 'Autor(a) de obras Romance.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Khaled Hosseini');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Khaled Hosseini';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Caçador de Pipas', lower('O Caçador de Pipas'), 2003, '1ª edição', '978-65-9900-00-99-X', 384, 'Obra de Romance — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Romance', 'Categoria Romance') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Romance';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 43, 0, 82.70, 33.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-00-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Khaled Hosseini', 'Autor(a) de obras Romance.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Khaled Hosseini');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Khaled Hosseini';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Montanha da Sorte', lower('A Montanha da Sorte'), 2007, '1ª edição', '978-65-9900-01-00-X', 384, 'Obra de Romance — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Romance', 'Categoria Romance') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Romance';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 44, 0, 83.80, 34.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-01-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Jojo Moyes', 'Autor(a) de obras Romance.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Jojo Moyes');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Jojo Moyes';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Como Eu Era Antes de Você', lower('Como Eu Era Antes de Você'), 2012, '1ª edição', '978-65-9900-01-01-X', 384, 'Obra de Romance — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Romance', 'Categoria Romance') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Romance';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 45, 0, 29.90, 15.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-02-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'John Green', 'Autor(a) de obras Romance.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'John Green');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'John Green';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Intrínseca' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Intrínseca', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Culpa é das Estrelas - Ed. Capa Dura', lower('A Culpa é das Estrelas - Ed. Capa Dura'), 2012, '1ª edição', '978-65-9900-01-02-X', 320, 'Obra de Romance — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Romance', 'Categoria Romance') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Romance';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 46, 0, 31.00, 16.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-03-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Hermann Hesse', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Hermann Hesse');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Hermann Hesse';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Lobo da Estepe', lower('O Lobo da Estepe'), 1927, '1ª edição', '978-65-9900-01-03-X', 256, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 47, 0, 32.10, 17.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-04-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Hermann Hesse', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Hermann Hesse');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Hermann Hesse';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Sidarta', lower('Sidarta'), 1922, '1ª edição', '978-65-9900-01-04-X', 160, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 48, 0, 33.20, 18.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-05-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Hermann Hesse', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Hermann Hesse');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Hermann Hesse';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Penguin Classics' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Penguin Classics', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'Demian', lower('Demian'), 1919, '1ª edição', '978-65-9900-01-05-X', 192, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 49, 0, 34.30, 19.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-06-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Albert Camus', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Albert Camus');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Albert Camus';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'O Estrangeiro', lower('O Estrangeiro'), 1942, '1ª edição', '978-65-9900-01-06-X', 160, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 15, 0, 35.40, 20.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  IF v_total_livros < 100 AND NOT EXISTS (SELECT 1 FROM livraria_comercial.livros WHERE liv_isbn = '978-65-9900-01-07-X') THEN
    INSERT INTO livraria_comercial.autores (aut_nome, aut_descricao) SELECT 'Albert Camus', 'Autor(a) de obras Clássicos.' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Albert Camus');
    SELECT aut_id INTO v_aut_id FROM livraria_comercial.autores WHERE aut_nome = 'Albert Camus';
    SELECT edi_id INTO v_edi_id FROM livraria_comercial.editoras WHERE edi_nome = 'Companhia das Letras' LIMIT 1;
    IF v_edi_id IS NULL THEN INSERT INTO livraria_comercial.editoras (edi_nome, edi_cnpj) VALUES ('Companhia das Letras', '00.000.000/0099-00') RETURNING edi_id INTO v_edi_id; END IF;
    INSERT INTO livraria_comercial.livros (liv_uuid, liv_titulo, liv_titulo_norm, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse, liv_altura, liv_largura, liv_peso, liv_profundidade, aut_id, edi_id, gpr_id, liv_ativo)
    VALUES (gen_random_uuid(), 'A Peste', lower('A Peste'), 1947, '1ª edição', '978-65-9900-01-07-X', 320, 'Obra de Clássicos — edição demo para ambiente de desenvolvimento.', 21.0, 14.0, 0.350, 3.0, v_aut_id, v_edi_id, v_gpr_id, TRUE)
    RETURNING liv_id INTO v_liv_id;
    INSERT INTO livraria_comercial.categorias (cat_nome, cat_descricao) VALUES ('Clássicos', 'Categoria Clássicos') ON CONFLICT (cat_nome) DO NOTHING;
    SELECT cat_id INTO v_cat_id FROM livraria_comercial.categorias WHERE cat_nome = 'Clássicos';
    INSERT INTO livraria_comercial.livro_categorias (liv_id, cat_id) VALUES (v_liv_id, v_cat_id) ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM livraria_comercial.estoques WHERE liv_id = v_liv_id) THEN
    INSERT INTO livraria_comercial.estoques (etq_uuid, liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
    VALUES (gen_random_uuid(), v_liv_id, 16, 0, 36.50, 21.00, TRUE, v_loj_id);
    END IF;
    v_total_livros := v_total_livros + 1;
  END IF;

  SELECT COUNT(*) INTO v_total_livros FROM livraria_comercial.livros;
  RAISE NOTICE 'Seed 065 concluído. Total de livros: %', v_total_livros;
END $$;

COMMIT;
