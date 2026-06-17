-- =============================================================================
-- DDL 012 — Tabelas de motivos de troca e devolução
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_comercial
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: motivos_troca
-- Motivos pelos quais um cliente pode solicitar troca de produtos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_comercial.motivos_troca (
    mtr_id              SERIAL      PRIMARY KEY,
    mtr_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    mtr_descricao       VARCHAR(100) UNIQUE NOT NULL,
    mtr_ativo           BOOLEAN     NOT NULL    DEFAULT true,
    mtr_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_motivos_troca_uuid UNIQUE (mtr_uuid)
);

COMMENT ON TABLE  livraria_comercial.motivos_troca                IS 'Motivos pelos quais clientes podem solicitar troca de produtos.';
COMMENT ON COLUMN livraria_comercial.motivos_troca.mtr_id         IS 'Identificador interno do motivo de troca.';
COMMENT ON COLUMN livraria_comercial.motivos_troca.mtr_uuid       IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_comercial.motivos_troca.mtr_descricao  IS 'Descrição do motivo (ex.: defeito, tamanho errado, cor errada).';
COMMENT ON COLUMN livraria_comercial.motivos_troca.mtr_ativo      IS 'Indica se o motivo está ativo para uso.';
COMMENT ON COLUMN livraria_comercial.motivos_troca.mtr_criado_em  IS 'Timestamp de criação do motivo.';

-- -----------------------------------------------------------------------------
-- Tabela: motivos_devolucao
-- Motivos pelos quais um cliente pode solicitar devolução de produtos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_comercial.motivos_devolucao (
    mde_id              SERIAL      PRIMARY KEY,
    mde_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    mde_descricao       VARCHAR(100) UNIQUE NOT NULL,
    mde_ativo           BOOLEAN     NOT NULL    DEFAULT true,
    mde_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_motivos_devolucao_uuid UNIQUE (mde_uuid)
);

COMMENT ON TABLE  livraria_comercial.motivos_devolucao                IS 'Motivos pelos quais clientes podem solicitar devolução de produtos.';
COMMENT ON COLUMN livraria_comercial.motivos_devolucao.mde_id         IS 'Identificador interno do motivo de devolução.';
COMMENT ON COLUMN livraria_comercial.motivos_devolucao.mde_uuid       IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_comercial.motivos_devolucao.mde_descricao  IS 'Descrição do motivo (ex.: defeito, arrependimento, produto diferente).';
COMMENT ON COLUMN livraria_comercial.motivos_devolucao.mde_ativo      IS 'Indica se o motivo está ativo para uso.';
COMMENT ON COLUMN livraria_comercial.motivos_devolucao.mde_criado_em  IS 'Timestamp de criação do motivo.';

-- -----------------------------------------------------------------------------
-- Índices para performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_motivos_troca_ativo ON livraria_comercial.motivos_troca(mtr_ativo);
CREATE INDEX IF NOT EXISTS idx_motivos_devolucao_ativo ON livraria_comercial.motivos_devolucao(mde_ativo);
