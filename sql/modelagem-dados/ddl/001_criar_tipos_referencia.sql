
CREATE TABLE IF NOT EXISTS ecm_papel_usuario (
    id_papel        SERIAL          PRIMARY KEY,
    dsc_papel       VARCHAR(30)     NOT NULL,
    dat_criacao     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_papel_usuario_dsc UNIQUE (dsc_papel)
);

COMMENT ON TABLE  ecm_papel_usuario           IS 'Papéis de acesso dos usuários do sistema.';
COMMENT ON COLUMN ecm_papel_usuario.id_papel  IS 'Identificador interno do papel (nunca exposto nas rotas).';
COMMENT ON COLUMN ecm_papel_usuario.dsc_papel IS 'Nome canônico do papel (ex.: cliente, admin).';


CREATE TABLE IF NOT EXISTS ecm_tipo_telefone (
    id_tipo_telefone    SERIAL      PRIMARY KEY,
    dsc_tipo_telefone   VARCHAR(30) NOT NULL,

    CONSTRAINT uq_tipo_telefone_dsc UNIQUE (dsc_tipo_telefone)
);

COMMENT ON TABLE  ecm_tipo_telefone                   IS 'Tipos de telefone aceitos pelo sistema (celular, residencial, comercial…).';
COMMENT ON COLUMN ecm_tipo_telefone.id_tipo_telefone  IS 'Identificador interno do tipo de telefone.';
COMMENT ON COLUMN ecm_tipo_telefone.dsc_tipo_telefone IS 'Descrição do tipo (ex.: celular, residencial, comercial).';


CREATE TABLE IF NOT EXISTS ecm_tipo_logradouro (
    id_tipo_logradouro    SERIAL      PRIMARY KEY,
    dsc_tipo_logradouro   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_tipo_logradouro_dsc UNIQUE (dsc_tipo_logradouro)
);

COMMENT ON TABLE  ecm_tipo_logradouro                     IS 'Tipos de logradouro (Rua, Avenida, Alameda, Travessa…).';
COMMENT ON COLUMN ecm_tipo_logradouro.id_tipo_logradouro  IS 'Identificador interno do tipo de logradouro.';
COMMENT ON COLUMN ecm_tipo_logradouro.dsc_tipo_logradouro IS 'Descrição do tipo (ex.: Rua, Avenida, Alameda).';


CREATE TABLE IF NOT EXISTS ecm_tipo_residencia (
    id_tipo_residencia    SERIAL      PRIMARY KEY,
    dsc_tipo_residencia   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_tipo_residencia_dsc UNIQUE (dsc_tipo_residencia)
);

COMMENT ON TABLE  ecm_tipo_residencia                     IS 'Tipos de residência vinculados a endereços dos clientes.';
COMMENT ON COLUMN ecm_tipo_residencia.id_tipo_residencia  IS 'Identificador interno do tipo de residência.';
COMMENT ON COLUMN ecm_tipo_residencia.dsc_tipo_residencia IS 'Descrição do tipo (ex.: Casa, Apartamento, Condomínio).';


CREATE TABLE IF NOT EXISTS ecm_estado_brasileiro (
    id_estado   SERIAL      PRIMARY KEY,
    sig_estado  CHAR(2)     NOT NULL,
    nom_estado  VARCHAR(60) NOT NULL,

    CONSTRAINT uq_estado_brasileiro_sig UNIQUE (sig_estado),
    CONSTRAINT uq_estado_brasileiro_nom UNIQUE (nom_estado)
);

COMMENT ON TABLE  ecm_estado_brasileiro            IS 'Estados e Distrito Federal do Brasil.';
COMMENT ON COLUMN ecm_estado_brasileiro.id_estado  IS 'Identificador interno do estado.';
COMMENT ON COLUMN ecm_estado_brasileiro.sig_estado IS 'Sigla de dois caracteres (ex.: SP, RJ, MG).';
COMMENT ON COLUMN ecm_estado_brasileiro.nom_estado IS 'Nome completo do estado (ex.: São Paulo, Rio de Janeiro).';
