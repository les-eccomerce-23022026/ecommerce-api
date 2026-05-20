-- Criar schema livraria_comercial se não existir
CREATE SCHEMA IF NOT EXISTS livraria_comercial;

CREATE TABLE IF NOT EXISTS livraria_comercial.papeis (
    pap_id          SERIAL          PRIMARY KEY,
    pap_descricao   VARCHAR(30)     NOT NULL,
    pap_criado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao)
);

COMMENT ON TABLE  livraria_comercial.papeis                 IS 'Papéis de acesso dos usuários do sistema.';
COMMENT ON COLUMN livraria_comercial.papeis.pap_id          IS 'Identificador interno do papel (nunca exposto nas rotas).';
COMMENT ON COLUMN livraria_comercial.papeis.pap_descricao   IS 'Nome canônico do papel (ex.: cliente, admin).';


-- Criar schema livraria_ref se não existir
CREATE SCHEMA IF NOT EXISTS livraria_ref;

CREATE TABLE IF NOT EXISTS livraria_ref.tipos_telefones (
    ttp_id          SERIAL      PRIMARY KEY,
    ttp_descricao   VARCHAR(30) NOT NULL,

    CONSTRAINT uq_tipos_telefones_descricao UNIQUE (ttp_descricao)
);

COMMENT ON TABLE  livraria_ref.tipos_telefones                 IS 'Tipos de telefone aceitos pelo sistema (celular, residencial, comercial…).';
COMMENT ON COLUMN livraria_ref.tipos_telefones.ttp_id          IS 'Identificador interno do tipo de telefone.';
COMMENT ON COLUMN livraria_ref.tipos_telefones.ttp_descricao   IS 'Descrição do tipo (ex.: celular, residencial, comercial).';


CREATE TABLE IF NOT EXISTS livraria_ref.tipos_logradouros (
    tlo_id          SERIAL      PRIMARY KEY,
    tlo_descricao   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_tipos_logradouros_descricao UNIQUE (tlo_descricao)
);

COMMENT ON TABLE  livraria_ref.tipos_logradouros                   IS 'Tipos de logradouro (Rua, Avenida, Alameda, Travessa…).';
COMMENT ON COLUMN livraria_ref.tipos_logradouros.tlo_id            IS 'Identificador interno do tipo de logradouro.';
COMMENT ON COLUMN livraria_ref.tipos_logradouros.tlo_descricao     IS 'Descrição do tipo (ex.: Rua, Avenida, Alameda).';


CREATE TABLE IF NOT EXISTS livraria_ref.tipos_residencias (
    tre_id          SERIAL      PRIMARY KEY,
    tre_descricao   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_tipos_residencias_descricao UNIQUE (tre_descricao)
);

COMMENT ON TABLE  livraria_ref.tipos_residencias                   IS 'Tipos de residência vinculados a endereços dos clientes.';
COMMENT ON COLUMN livraria_ref.tipos_residencias.tre_id            IS 'Identificador interno do tipo de residência.';
COMMENT ON COLUMN livraria_ref.tipos_residencias.tre_descricao     IS 'Descrição do tipo (ex.: Casa, Apartamento, Condomínio).';


CREATE TABLE IF NOT EXISTS livraria_ref.estados (
    est_id      SERIAL      PRIMARY KEY,
    est_sigla   CHAR(2)     NOT NULL,
    est_nome    VARCHAR(60) NOT NULL,

    CONSTRAINT uq_estados_sigla UNIQUE (est_sigla),
    CONSTRAINT uq_estados_nome UNIQUE (est_nome)
);

COMMENT ON TABLE  livraria_ref.estados            IS 'Estados e Distrito Federal do Brasil.';
COMMENT ON COLUMN livraria_ref.estados.est_id     IS 'Identificador interno do estado.';
COMMENT ON COLUMN livraria_ref.estados.est_sigla  IS 'Sigla de dois caracteres (ex.: SP, RJ, MG).';
COMMENT ON COLUMN livraria_ref.estados.est_nome   IS 'Nome completo do estado (ex.: São Paulo, Rio de Janeiro).';
