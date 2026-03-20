-- =============================================================================
-- MIGRATION 006: Refatoração Completa para Padrão de Trigramas
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

BEGIN;

-- 1. REFERÊNCIAS E DOMÍNIOS (LOOKUPS)
--------------------------------------------------------------------------------

-- ecm_papel_usuario -> pap_papeis
ALTER TABLE ecm_papel_usuario RENAME TO pap_papeis;
ALTER TABLE pap_papeis RENAME COLUMN id_papel TO pap_id;
ALTER TABLE pap_papeis RENAME COLUMN dsc_papel TO pap_descricao;
ALTER TABLE pap_papeis RENAME COLUMN dat_criacao TO pap_criado_em;

-- ecm_tipo_telefone -> ttp_tipos_telefones
ALTER TABLE ecm_tipo_telefone RENAME TO ttp_tipos_telefones;
ALTER TABLE ttp_tipos_telefones RENAME COLUMN id_tipo_telefone TO ttp_id;
ALTER TABLE ttp_tipos_telefones RENAME COLUMN dsc_tipo_telefone TO ttp_descricao;

-- ecm_tipo_logradouro -> tlo_tipos_logradouros
ALTER TABLE ecm_tipo_logradouro RENAME TO tlo_tipos_logradouros;
ALTER TABLE tlo_tipos_logradouros RENAME COLUMN id_tipo_logradouro TO tlo_id;
ALTER TABLE tlo_tipos_logradouros RENAME COLUMN dsc_tipo_logradouro TO tlo_descricao;

-- ecm_tipo_residencia -> tre_tipos_residencias
ALTER TABLE ecm_tipo_residencia RENAME TO tre_tipos_residencias;
ALTER TABLE tre_tipos_residencias RENAME COLUMN id_tipo_residencia TO tre_id;
ALTER TABLE tre_tipos_residencias RENAME COLUMN dsc_tipo_residencia TO tre_descricao;

-- ecm_bandeira_cartao -> ban_bandeiras
ALTER TABLE ecm_bandeira_cartao RENAME TO ban_bandeiras;
ALTER TABLE ban_bandeiras RENAME COLUMN id_bandeira_cartao TO ban_id;
ALTER TABLE ban_bandeiras RENAME COLUMN dsc_bandeira TO ban_descricao;
ALTER TABLE ban_bandeiras RENAME COLUMN dat_criacao TO ban_criado_em;

-- 2. IDENTIDADE E USUÁRIOS
--------------------------------------------------------------------------------

-- ecm_usuario -> usu_usuarios
ALTER TABLE ecm_usuario RENAME TO usu_usuarios;
ALTER TABLE usu_usuarios RENAME COLUMN id_usuario TO usu_id;
ALTER TABLE usu_usuarios RENAME COLUMN uuid_usuario TO usu_uuid;
ALTER TABLE usu_usuarios RENAME COLUMN nom_usuario TO usu_nome;
ALTER TABLE usu_usuarios RENAME COLUMN dsc_email TO usu_email;
ALTER TABLE usu_usuarios RENAME COLUMN dsc_cpf TO usu_cpf;
ALTER TABLE usu_usuarios RENAME COLUMN dsc_senha_hash TO usu_senha_hash;
ALTER TABLE usu_usuarios RENAME COLUMN id_papel TO pap_id; -- FK seguindo PK referenciada
ALTER TABLE usu_usuarios RENAME COLUMN flg_ativo TO usu_ativo;
ALTER TABLE usu_usuarios RENAME COLUMN dat_criacao TO usu_criado_em;
ALTER TABLE usu_usuarios RENAME COLUMN dat_atualizacao TO usu_atualizado_em;
ALTER TABLE usu_usuarios RENAME COLUMN dsc_genero TO usu_genero;
ALTER TABLE usu_usuarios RENAME COLUMN dat_nascimento TO usu_data_nascimento;
ALTER TABLE usu_usuarios RENAME COLUMN dsc_telefone TO usu_telefone_rapido;

-- ecm_perfil_cliente -> cli_clientes (Unificado com perfil)
ALTER TABLE ecm_perfil_cliente RENAME TO cli_clientes;
ALTER TABLE cli_clientes RENAME COLUMN id_perfil_cliente TO cli_id;
ALTER TABLE cli_clientes RENAME COLUMN uuid_perfil_cliente TO cli_uuid;
ALTER TABLE cli_clientes RENAME COLUMN id_usuario TO usu_id; -- FK
ALTER TABLE cli_clientes RENAME COLUMN dsc_genero TO cli_genero;
ALTER TABLE cli_clientes RENAME COLUMN dat_nascimento TO cli_data_nascimento;
ALTER TABLE cli_clientes RENAME COLUMN num_ranking TO cli_ranking;
ALTER TABLE cli_clientes RENAME COLUMN dat_criacao TO cli_criado_em;
ALTER TABLE cli_clientes RENAME COLUMN dat_atualizacao TO cli_atualizado_em;

-- 3. LOCALIZAÇÃO E ENDEREÇOS
--------------------------------------------------------------------------------

-- ecm_pais -> pai_paises
ALTER TABLE ecm_pais RENAME TO pai_paises;
ALTER TABLE pai_paises RENAME COLUMN id_pais TO pai_id;
ALTER TABLE pai_paises RENAME COLUMN nom_pais TO pai_nome;
ALTER TABLE pai_paises RENAME COLUMN dat_criacao TO pai_criado_em;

-- ecm_estado_brasileiro -> est_estados
ALTER TABLE ecm_estado_brasileiro RENAME TO est_estados;
ALTER TABLE est_estados RENAME COLUMN id_estado TO est_id;
ALTER TABLE est_estados RENAME COLUMN sig_estado TO est_sigla;
ALTER TABLE est_estados RENAME COLUMN nom_estado TO est_nome;

-- ecm_cidade -> cid_cidades
ALTER TABLE ecm_cidade RENAME TO cid_cidades;
ALTER TABLE cid_cidades RENAME COLUMN id_cidade TO cid_id;
ALTER TABLE cid_cidades RENAME COLUMN uuid_cidade TO cid_uuid;
ALTER TABLE cid_cidades RENAME COLUMN nom_cidade TO cid_nome;
ALTER TABLE cid_cidades RENAME COLUMN nom_cidade_norm TO cid_nome_norm;
ALTER TABLE cid_cidades RENAME COLUMN id_estado TO est_id; -- FK

-- ecm_bairro -> bai_bairros
ALTER TABLE ecm_bairro RENAME TO bai_bairros;
ALTER TABLE bai_bairros RENAME COLUMN id_bairro TO bai_id;
ALTER TABLE bai_bairros RENAME COLUMN uuid_bairro TO bai_uuid;
ALTER TABLE bai_bairros RENAME COLUMN nom_bairro TO bai_nome;
ALTER TABLE bai_bairros RENAME COLUMN nom_bairro_norm TO bai_nome_norm;
ALTER TABLE bai_bairros RENAME COLUMN id_cidade TO cid_id; -- FK

-- ecm_cep -> cep_ceps
ALTER TABLE ecm_cep RENAME TO cep_ceps;
ALTER TABLE cep_ceps RENAME COLUMN id_cep TO cep_id;
ALTER TABLE cep_ceps RENAME COLUMN num_cep TO cep_numero;
ALTER TABLE cep_ceps RENAME COLUMN id_cidade TO cid_id; -- FK
ALTER TABLE cep_ceps RENAME COLUMN id_bairro TO bai_id; -- FK

-- ecm_logradouro -> log_logradouros
ALTER TABLE ecm_logradouro RENAME TO log_logradouros;
ALTER TABLE log_logradouros RENAME COLUMN id_logradouro TO log_id;
ALTER TABLE log_logradouros RENAME COLUMN id_tipo_logradouro TO tlo_id; -- FK
ALTER TABLE log_logradouros RENAME COLUMN dsc_logradouro TO log_nome;

-- ecm_endereco_usuario -> end_enderecos
ALTER TABLE ecm_endereco_usuario RENAME TO end_enderecos;
ALTER TABLE end_enderecos RENAME COLUMN id_endereco TO end_id;
ALTER TABLE end_enderecos RENAME COLUMN uuid_endereco TO end_uuid;
ALTER TABLE end_enderecos RENAME COLUMN id_usuario TO usu_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN dsc_tipo_endereco TO end_tipo;
ALTER TABLE end_enderecos RENAME COLUMN id_tipo_residencia TO tre_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN id_logradouro TO log_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN num_logradouro TO end_numero;
ALTER TABLE end_enderecos RENAME COLUMN dsc_complemento TO end_complemento;
ALTER TABLE end_enderecos RENAME COLUMN nom_apelido TO end_apelido;
ALTER TABLE end_enderecos RENAME COLUMN id_cidade TO cid_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN id_bairro TO bai_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN id_cep TO cep_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN id_pais TO pai_id; -- FK
ALTER TABLE end_enderecos RENAME COLUMN flg_principal TO end_principal;
ALTER TABLE end_enderecos RENAME COLUMN dat_criacao TO end_criado_em;
ALTER TABLE end_enderecos RENAME COLUMN dat_atualizacao TO end_atualizado_em;

-- 4. CONTATOS E CARTÕES
--------------------------------------------------------------------------------

-- ecm_telefone_usuario -> tel_telefones
ALTER TABLE ecm_telefone_usuario RENAME TO tel_telefones;
ALTER TABLE tel_telefones RENAME COLUMN id_telefone TO tel_id;
ALTER TABLE tel_telefones RENAME COLUMN uuid_telefone TO tel_uuid;
ALTER TABLE tel_telefones RENAME COLUMN id_usuario TO usu_id; -- FK
ALTER TABLE tel_telefones RENAME COLUMN id_tipo_telefone TO ttp_id; -- FK
ALTER TABLE tel_telefones RENAME COLUMN num_ddd TO tel_ddd;
ALTER TABLE tel_telefones RENAME COLUMN num_telefone TO tel_numero;
ALTER TABLE tel_telefones RENAME COLUMN flg_principal TO tel_principal;
ALTER TABLE tel_telefones RENAME COLUMN dat_criacao TO tel_criado_em;
ALTER TABLE tel_telefones RENAME COLUMN dat_atualizacao TO tel_atualizado_em;

-- ecm_cartao_usuario -> crt_cartoes
ALTER TABLE ecm_cartao_usuario RENAME TO crt_cartoes;
ALTER TABLE crt_cartoes RENAME COLUMN id_cartao TO crt_id;
ALTER TABLE crt_cartoes RENAME COLUMN uuid_cartao TO crt_uuid;
ALTER TABLE crt_cartoes RENAME COLUMN id_usuario TO usu_id; -- FK
ALTER TABLE crt_cartoes RENAME COLUMN id_bandeira_cartao TO ban_id; -- FK
ALTER TABLE crt_cartoes RENAME COLUMN dsc_token_cartao TO crt_token;
ALTER TABLE crt_cartoes RENAME COLUMN dsc_final_cartao TO crt_final;
ALTER TABLE crt_cartoes RENAME COLUMN dsc_nome_impresso TO crt_nome_impresso;
ALTER TABLE crt_cartoes RENAME COLUMN dat_validade TO crt_validade;
ALTER TABLE crt_cartoes RENAME COLUMN flg_principal TO crt_principal;
ALTER TABLE crt_cartoes RENAME COLUMN dat_criacao TO crt_criado_em;
ALTER TABLE crt_cartoes RENAME COLUMN dat_atualizacao TO crt_atualizado_em;

-- 5. ATUALIZAÇÃO DA LÓGICA DE TRIGGERS
--------------------------------------------------------------------------------

-- Atualiza a função de timestamp para ser genérica e suportar o sufixo _atualizado_em
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Determina o prefixo baseado no nome da tabela (ex: usu_usuarios -> usu)
    -- E define a coluna de atualização dinâmica
    IF TG_TABLE_NAME = 'usu_usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'cli_clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'end_enderecos' THEN NEW.end_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'tel_telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'crt_cartoes'   THEN NEW.crt_atualizado_em := NOW(); END IF;

    RETURN NEW;
END;
$$;

COMMIT;
