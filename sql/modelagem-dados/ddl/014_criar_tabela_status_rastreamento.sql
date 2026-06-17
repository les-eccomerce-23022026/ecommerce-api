-- =============================================================================
-- DDL 014 — Tabela de status de rastreamento
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_logistica
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: status_rastreamento
-- Status possíveis para rastreamento de entregas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_logistica.status_rastreamento (
    sra_id              SERIAL      PRIMARY KEY,
    sra_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    sra_codigo          VARCHAR(20) UNIQUE NOT NULL,
    sra_descricao       VARCHAR(100) NOT NULL,
    sra_ordem           INTEGER     NOT NULL,
    sra_ativo           BOOLEAN     NOT NULL    DEFAULT true,
    sra_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_status_rastreamento_uuid UNIQUE (sra_uuid)
);

COMMENT ON TABLE  livraria_logistica.status_rastreamento                IS 'Status possíveis para rastreamento de entregas.';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_id         IS 'Identificador interno do status de rastreamento.';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_uuid       IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_codigo     IS 'Código do status (ex.: POSTADO, EM_TRANSITO, ENTREGUE).';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_descricao  IS 'Descrição do status (ex.: Postado, Em trânsito, Entregue).';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_ordem      IS 'Ordem do status na timeline (para ordenação).';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_ativo      IS 'Indica se o status está ativo para uso.';
COMMENT ON COLUMN livraria_logistica.status_rastreamento.sra_criado_em  IS 'Timestamp de criação do status.';

-- -----------------------------------------------------------------------------
-- Índices para performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_status_rastreamento_ativo ON livraria_logistica.status_rastreamento(sra_ativo);
CREATE INDEX IF NOT EXISTS idx_status_rastreamento_codigo ON livraria_logistica.status_rastreamento(sra_codigo);
CREATE INDEX IF NOT EXISTS idx_status_rastreamento_ordem ON livraria_logistica.status_rastreamento(sra_ordem);
