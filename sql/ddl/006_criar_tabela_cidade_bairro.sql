-- =============================================================================
-- DDL 006 — Tabelas de domínio: cidade e bairro
-- Sistema: LES – E-Commerce de Livros
-- Objetivo: normalizar `nom_cidade` e `nom_bairro` de `ecm_endereco_usuario`.
-- Nota: usa `gen_random_uuid()` já empregado nos demais DDLs do projeto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_cidade
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_cidade (
    id_cidade           SERIAL          PRIMARY KEY,
    uuid_cidade         UUID            NOT NULL DEFAULT gen_random_uuid(),
    nom_cidade          VARCHAR(200)    NOT NULL,
    nom_cidade_norm     VARCHAR(200)    NOT NULL,
    id_estado           INTEGER,
    dat_criacao         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cidade_norm_estado UNIQUE (nom_cidade_norm, id_estado),

    CONSTRAINT fk_cidade_estado
        FOREIGN KEY (id_estado)
        REFERENCES ecm_estado_brasileiro (id_estado)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

COMMENT ON TABLE ecm_cidade IS 'Catálogo normalizado de cidades (nomes normalizados para matching).';
COMMENT ON COLUMN ecm_cidade.nom_cidade_norm IS 'Versão normalizada de nom_cidade (UPPER(TRIM(...))) usada para unicidade e matching.';

CREATE INDEX IF NOT EXISTS idx_cidade_norm_estado ON ecm_cidade (nom_cidade_norm, id_estado);
CREATE INDEX IF NOT EXISTS idx_cidade_uuid ON ecm_cidade (uuid_cidade);


-- -----------------------------------------------------------------------------
-- ecm_bairro
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_bairro (
    id_bairro           SERIAL          PRIMARY KEY,
    uuid_bairro         UUID            NOT NULL DEFAULT gen_random_uuid(),
    nom_bairro          VARCHAR(200)    NOT NULL,
    nom_bairro_norm     VARCHAR(200)    NOT NULL,
    id_cidade           INTEGER         NOT NULL,
    dat_criacao         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_bairro_norm_cidade UNIQUE (nom_bairro_norm, id_cidade),

    CONSTRAINT fk_bairro_cidade
        FOREIGN KEY (id_cidade)
        REFERENCES ecm_cidade (id_cidade)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE ecm_bairro IS 'Catálogo normalizado de bairros por cidade (matching via nom_bairro_norm).';
COMMENT ON COLUMN ecm_bairro.nom_bairro_norm IS 'Versão normalizada de nom_bairro (UPPER(TRIM(...))).';

CREATE INDEX IF NOT EXISTS idx_bairro_norm_cidade ON ecm_bairro (nom_bairro_norm, id_cidade);
CREATE INDEX IF NOT EXISTS idx_bairro_uuid ON ecm_bairro (uuid_bairro);
