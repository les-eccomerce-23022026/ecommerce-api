-- =============================================================================
-- DDL 005 — Tabelas de cidades e bairros
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_ref
-- =============================================================================

CREATE TABLE IF NOT EXISTS livraria_ref.cidades (
    cid_id              SERIAL      PRIMARY KEY,
    cid_nome            VARCHAR(100) NOT NULL,
    cid_nome_norm       VARCHAR(100) NOT NULL,
    est_id              INTEGER     NOT NULL,

    CONSTRAINT uq_cidades_nome_estado UNIQUE (cid_nome_norm, est_id),

    CONSTRAINT fk_cidades_estado FOREIGN KEY (est_id) REFERENCES livraria_ref.estados(est_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  livraria_ref.cidades                IS 'Cidades brasileiras vinculadas a estados.';
COMMENT ON COLUMN livraria_ref.cidades.cid_id         IS 'Chave primária interna.';
COMMENT ON COLUMN livraria_ref.cidades.cid_nome       IS 'Nome da cidade (ex.: São Paulo, Rio de Janeiro).';
COMMENT ON COLUMN livraria_ref.cidades.cid_nome_norm  IS 'Nome normalizado (maiúsculas, sem acentos) para busca case-insensitive.';
COMMENT ON COLUMN livraria_ref.cidades.est_id         IS 'FK para estados.';


CREATE TABLE IF NOT EXISTS livraria_ref.bairros (
    bai_id              SERIAL      PRIMARY KEY,
    bai_nome            VARCHAR(100) NOT NULL,
    bai_nome_norm       VARCHAR(100) NOT NULL,
    cid_id              INTEGER     NOT NULL,

    CONSTRAINT uq_bairros_nome_cidade UNIQUE (bai_nome_norm, cid_id),

    CONSTRAINT fk_bairros_cidade FOREIGN KEY (cid_id) REFERENCES livraria_ref.cidades(cid_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  livraria_ref.bairros                IS 'Bairros vinculados a cidades.';
COMMENT ON COLUMN livraria_ref.bairros.bai_id         IS 'Chave primária interna.';
COMMENT ON COLUMN livraria_ref.bairros.bai_nome       IS 'Nome do bairro (ex.: Centro, Copacabana).';
COMMENT ON COLUMN livraria_ref.bairros.bai_nome_norm  IS 'Nome normalizado (maiúsculas, sem acentos) para busca case-insensitive.';
COMMENT ON COLUMN livraria_ref.bairros.cid_id         IS 'FK para cidades.';
