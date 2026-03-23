-- =============================================================================
-- DDL 006 — Tabelas de domínio: cidade e bairro
-- Sistema: LES – E-Commerce de Livros
-- Objetivo: normalizar `cid_nome` e `bai_nome` de `enderecos`.
-- Nota: usa `gen_random_uuid()` já empregado nos demais DDLs do projeto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- cidades
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cidades (
    cid_id              SERIAL          PRIMARY KEY,
    cid_uuid            UUID            NOT NULL DEFAULT gen_random_uuid(),
    cid_nome            VARCHAR(200)    NOT NULL,
    cid_nome_norm       VARCHAR(200)    NOT NULL,
    est_id              INTEGER,
    cid_criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cidades_norm_estado UNIQUE (cid_nome_norm, est_id),

    CONSTRAINT fk_cidades_estados
        FOREIGN KEY (est_id)
        REFERENCES estados (est_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

COMMENT ON TABLE cidades IS 'Catálogo normalizado de cidades (nomes normalizados para matching).';
COMMENT ON COLUMN cidades.cid_nome_norm IS 'Versão normalizada de cid_nome (UPPER(TRIM(...))) usada para unicidade e matching.';


-- -----------------------------------------------------------------------------
-- bairros
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bairros (
    bai_id              SERIAL          PRIMARY KEY,
    bai_uuid            UUID            NOT NULL DEFAULT gen_random_uuid(),
    bai_nome            VARCHAR(200)    NOT NULL,
    bai_nome_norm       VARCHAR(200)    NOT NULL,
    cid_id              INTEGER         NOT NULL,
    bai_criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_bairros_norm_cidade UNIQUE (bai_nome_norm, cid_id),

    CONSTRAINT fk_bairros_cidades
        FOREIGN KEY (cid_id)
        REFERENCES cidades (cid_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE bairros IS 'Catálogo normalizado de bairros por cidade (matching via bai_nome_norm).';
COMMENT ON COLUMN bairros.bai_nome_norm IS 'Versão normalizada de bai_nome (UPPER(TRIM(...))).';
