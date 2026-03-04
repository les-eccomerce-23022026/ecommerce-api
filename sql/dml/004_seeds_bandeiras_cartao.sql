-- =============================================================================
-- DML 004 — Seeds para bandeiras de cartão
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Insere as bandeiras de cartão suportadas (RN0025)
-- -----------------------------------------------------------------------------
INSERT INTO ecm_bandeira_cartao (dsc_bandeira) VALUES
('Visa'),
('Mastercard'),
('Elo'),
('American Express'),
('Hipercard')
ON CONFLICT (dsc_bandeira) DO NOTHING;