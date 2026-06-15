-- =============================================================================
-- DDL 015 — Tabela de tipos de cupom
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_comercial
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: tipos_cupom
-- Tipos de cupom disponíveis no sistema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_comercial.tipos_cupom (
    tpc_id              SERIAL      PRIMARY KEY,
    tpc_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    tpc_codigo          VARCHAR(20) UNIQUE NOT NULL,
    tpc_descricao       VARCHAR(100) NOT NULL,
    tpc_ativo           BOOLEAN     NOT NULL    DEFAULT true,
    tpc_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_tipos_cupom_uuid UNIQUE (tpc_uuid)
);

COMMENT ON TABLE  livraria_comercial.tipos_cupom                IS 'Tipos de cupom disponíveis no sistema.';
COMMENT ON COLUMN livraria_comercial.tipos_cupom.tpc_id         IS 'Identificador interno do tipo de cupom.';
COMMENT ON COLUMN livraria_comercial.tipos_cupom.tpc_uuid       IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_comercial.tipos_cupom.tpc_codigo     IS 'Código do tipo (ex.: PERCENTUAL, FIXO, FRETE_GRATIS).';
COMMENT ON COLUMN livraria_comercial.tipos_cupom.tpc_descricao  IS 'Descrição do tipo (ex.: Percentual, Valor Fixo, Frete Grátis).';
COMMENT ON COLUMN livraria_comercial.tipos_cupom.tpc_ativo      IS 'Indica se o tipo está ativo para uso.';
COMMENT ON COLUMN livraria_comercial.tipos_cupom.tpc_criado_em  IS 'Timestamp de criação do tipo.';

-- -----------------------------------------------------------------------------
-- Índices para performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tipos_cupom_ativo ON livraria_comercial.tipos_cupom(tpc_ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_cupom_codigo ON livraria_comercial.tipos_cupom(tpc_codigo);
