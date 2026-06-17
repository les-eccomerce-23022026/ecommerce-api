-- =============================================================================
-- DDL 016 — Tabela de status de cupom
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_comercial
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: status_cupom
-- Status possíveis para cupons de desconto
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_comercial.status_cupom (
    scu_id              SERIAL      PRIMARY KEY,
    scu_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    scu_codigo          VARCHAR(20) UNIQUE NOT NULL,
    scu_descricao       VARCHAR(100) NOT NULL,
    scu_ativo           BOOLEAN     NOT NULL    DEFAULT true,
    scu_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_status_cupom_uuid UNIQUE (scu_uuid)
);

COMMENT ON TABLE  livraria_comercial.status_cupom                IS 'Status possíveis para cupons de desconto.';
COMMENT ON COLUMN livraria_comercial.status_cupom.scu_id         IS 'Identificador interno do status de cupom.';
COMMENT ON COLUMN livraria_comercial.status_cupom.scu_uuid       IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_comercial.status_cupom.scu_codigo     IS 'Código do status (ex.: ATIVO, EXPIRADO, USADO, CANCELADO).';
COMMENT ON COLUMN livraria_comercial.status_cupom.scu_descricao  IS 'Descrição do status (ex.: Ativo, Expirado, Usado, Cancelado).';
COMMENT ON COLUMN livraria_comercial.status_cupom.scu_ativo      IS 'Indica se o status está ativo para uso.';
COMMENT ON COLUMN livraria_comercial.status_cupom.scu_criado_em  IS 'Timestamp de criação do status.';

-- -----------------------------------------------------------------------------
-- Índices para performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_status_cupom_ativo ON livraria_comercial.status_cupom(scu_ativo);
CREATE INDEX IF NOT EXISTS idx_status_cupom_codigo ON livraria_comercial.status_cupom(scu_codigo);
