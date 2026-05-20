-- =============================================================================
-- DDL 008 — Tabela de bandeiras de cartão
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_financeiro
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS livraria_financeiro;

CREATE TABLE IF NOT EXISTS livraria_financeiro.bandeiras_cartao (
    ban_id              SERIAL      PRIMARY KEY,
    ban_uuid            UUID            NOT NULL    DEFAULT gen_random_uuid(),
    ban_descricao       VARCHAR(30) UNIQUE NOT NULL,
    ban_criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_bandeiras_uuid UNIQUE (ban_uuid)
);

COMMENT ON TABLE  livraria_financeiro.bandeiras_cartao               IS 'Bandeiras de cartão de crédito suportadas (RN0025).';
COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_id        IS 'Identificador interno da bandeira.';
COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_uuid      IS 'Identificador público (UUID v4).';
COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_descricao IS 'Nome da bandeira (ex.: Visa, Mastercard, American Express).';
COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_criado_em IS 'Timestamp de criação da bandeira.';
