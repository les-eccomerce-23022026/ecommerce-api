-- =============================================================================
-- DDL 006 — Tabelas de normalização extra (paises, ceps, logradouros)
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_ref
-- =============================================================================

-- Dropar tabelas antigas se existirem (para garantir estrutura correta)
DROP TABLE IF EXISTS livraria_ref.logradouros CASCADE;
DROP TABLE IF EXISTS livraria_ref.ceps CASCADE;
DROP TABLE IF EXISTS livraria_ref.paises CASCADE;

CREATE TABLE IF NOT EXISTS livraria_ref.paises (
    pai_id              SERIAL      PRIMARY KEY,
    pai_sigla           CHAR(3)     NOT NULL,
    pai_nome            VARCHAR(100) NOT NULL,

    CONSTRAINT uq_paises_sigla UNIQUE (pai_sigla),
    CONSTRAINT uq_paises_nome UNIQUE (pai_nome)
);

COMMENT ON TABLE  livraria_ref.paises                IS 'Países para normalização de endereços.';
COMMENT ON COLUMN livraria_ref.paises.pai_id         IS 'Chave primária interna.';
COMMENT ON COLUMN livraria_ref.paises.pai_sigla      IS 'Sigla ISO de 3 caracteres (ex.: BRA, USA).';
COMMENT ON COLUMN livraria_ref.paises.pai_nome       IS 'Nome do país (ex.: Brasil, Estados Unidos).';


CREATE TABLE IF NOT EXISTS livraria_ref.ceps (
    cep_numero          CHAR(8)     PRIMARY KEY,
    cid_id              INTEGER     NOT NULL,
    bai_id              INTEGER     NOT NULL,

    CONSTRAINT fk_ceps_cidade FOREIGN KEY (cid_id) REFERENCES livraria_ref.cidades(cid_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ceps_bairro FOREIGN KEY (bai_id) REFERENCES livraria_ref.bairros(bai_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  livraria_ref.ceps                   IS 'CEPs brasileiros vinculados a cidades e bairros.';
COMMENT ON COLUMN livraria_ref.ceps.cep_numero       IS 'CEP de 8 dígitos (sem formatação).';
COMMENT ON COLUMN livraria_ref.ceps.cid_id           IS 'FK para cidades.';
COMMENT ON COLUMN livraria_ref.ceps.bai_id           IS 'FK para bairros.';


CREATE TABLE IF NOT EXISTS livraria_ref.logradouros (
    log_id              SERIAL      PRIMARY KEY,
    tlo_id              INTEGER     REFERENCES livraria_ref.tipos_logradouros(tlo_id) ON UPDATE CASCADE ON DELETE SET NULL,
    log_nome            VARCHAR(200) NOT NULL,
    log_criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Garante unicidade do logradouro completo
    CONSTRAINT uq_logradouros_completo UNIQUE (tlo_id, log_nome)
);

COMMENT ON TABLE  livraria_ref.logradouros                    IS 'Logradouros normalizados (tipo + nome). Permite reusar endereços de rua idênticos.';
COMMENT ON COLUMN livraria_ref.logradouros.log_id             IS 'Identificador interno do logradouro.';
COMMENT ON COLUMN livraria_ref.logradouros.tlo_id             IS 'FK para tipos_logradouros (Rua, Avenida…).';
COMMENT ON COLUMN livraria_ref.logradouros.log_nome           IS 'Nome do logradouro sem o tipo.';
COMMENT ON COLUMN livraria_ref.logradouros.log_criado_em      IS 'Timestamp de criação do logradouro.';
