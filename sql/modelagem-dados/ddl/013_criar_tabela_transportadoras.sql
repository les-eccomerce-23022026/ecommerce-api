-- =============================================================================
-- DDL 013 — Tabela de transportadoras
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_logistica
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: transportadoras
-- Transportadoras disponíveis para entrega de pedidos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_logistica.transportadoras (
    tra_id              SERIAL      PRIMARY KEY,
    tra_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    tra_nome            VARCHAR(100) UNIQUE NOT NULL,
    tra_codigo          VARCHAR(20) UNIQUE NOT NULL,
    tra_ativo           BOOLEAN     NOT NULL    DEFAULT true,
    tra_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_transportadoras_uuid UNIQUE (tra_uuid)
);

COMMENT ON TABLE  livraria_logistica.transportadoras                IS 'Transportadoras disponíveis para entrega de pedidos.';
COMMENT ON COLUMN livraria_logistica.transportadoras.tra_id         IS 'Identificador interno da transportadora.';
COMMENT ON COLUMN livraria_logistica.transportadoras.tra_uuid       IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_logistica.transportadoras.tra_nome       IS 'Nome da transportadora (ex.: Correios, Sedex, Loggi).';
COMMENT ON COLUMN livraria_logistica.transportadoras.tra_codigo     IS 'Código interno da transportadora (ex.: COR, SED, LOG).';
COMMENT ON COLUMN livraria_logistica.transportadoras.tra_ativo      IS 'Indica se a transportadora está ativa para uso.';
COMMENT ON COLUMN livraria_logistica.transportadoras.tra_criado_em  IS 'Timestamp de criação da transportadora.';

-- -----------------------------------------------------------------------------
-- Índices para performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transportadoras_ativo ON livraria_logistica.transportadoras(tra_ativo);
CREATE INDEX IF NOT EXISTS idx_transportadoras_codigo ON livraria_logistica.transportadoras(tra_codigo);
