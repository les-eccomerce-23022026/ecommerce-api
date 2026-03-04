-- =============================================================================
-- DDL 009 — Tabela de bandeiras de cartão de crédito
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_bandeira_cartao
-- Tabela de domínio para bandeiras de cartão suportadas pelo sistema.
-- RN0025: Bandeiras válidas: Visa, Mastercard, Elo, American Express, Hipercard.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_bandeira_cartao (
    id_bandeira_cartao  SERIAL      PRIMARY KEY,
    dsc_bandeira        VARCHAR(30) UNIQUE NOT NULL,
    dat_criacao         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  ecm_bandeira_cartao                       IS 'Bandeiras de cartão de crédito suportadas (RN0025).';
COMMENT ON COLUMN ecm_bandeira_cartao.id_bandeira_cartao    IS 'Identificador interno da bandeira.';
COMMENT ON COLUMN ecm_bandeira_cartao.dsc_bandeira          IS 'Nome da bandeira (Visa, Mastercard, Elo, etc.).';