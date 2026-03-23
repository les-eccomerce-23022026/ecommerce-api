-- =============================================================================
-- DDL 009 — Tabela de bandeiras de cartão de crédito
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ban_bandeiras
-- Tabela de domínio para bandeiras de cartão suportadas pelo sistema.
-- RN0025: Bandeiras válidas: Visa, Mastercard, Elo, American Express, Hipercard.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bandeiras_cartao (
    ban_id              SERIAL      PRIMARY KEY,
    ban_uuid            UUID            NOT NULL    DEFAULT gen_random_uuid(),
    ban_descricao       VARCHAR(30) UNIQUE NOT NULL,
    ban_criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_bandeiras_uuid UNIQUE (ban_uuid)
);

COMMENT ON TABLE  bandeiras_cartao               IS 'Bandeiras de cartão de crédito suportadas (RN0025).';
COMMENT ON COLUMN bandeiras_cartao.ban_id        IS 'Identificador interno da bandeira.';
COMMENT ON COLUMN bandeiras_cartao.ban_uuid      IS 'Identificador público (UUID v4) para uso em rotas HTTP.';
COMMENT ON COLUMN bandeiras_cartao.ban_descricao IS 'Nome da bandeira (Visa, Mastercard, Elo, etc.).';
