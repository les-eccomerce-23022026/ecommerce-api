-- =============================================================================
-- DML 004 — Seeds para bandeiras de cartão
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Insere as bandeiras de cartão suportadas (RN0025)
-- -----------------------------------------------------------------------------
INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao) VALUES
('Visa'),
('Mastercard'),
('Elo'),
('American Express'),
('Hipercard')
ON CONFLICT (ban_descricao) DO NOTHING;
