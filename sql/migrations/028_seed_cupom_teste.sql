-- Migration: 028_seed_cupom_teste.sql
-- Descrição: Seed de cupons para testes E2E do Cypress
-- Objetivos: Criar cupons DESCONTO10, DESCONTO20, TROCA50, TROCA30, TROCA100 para testes
-- Correção: Adicionado schema livraria_comercial e cupom TROCA100

-- Inserir cupons de teste
INSERT INTO livraria_comercial.cupom (cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo, cup_valido_de, cup_valido_ate, cup_ativo) VALUES
-- Cupom promocional (máximo 1 por compra)
('DESCONTO10', 'promocional', 10.00, 0.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', true),
('DESCONTO20', 'promocional', 20.00, 50.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', true),
-- Cupons de troca (múltiplos permitidos)
('TROCA50', 'troca', 50.00, 0.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', true),
('TROCA30', 'troca', 30.00, 0.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', true),
('TROCA100', 'troca', 100.00, 0.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', true)
ON CONFLICT (cup_codigo) DO NOTHING;

COMMENT ON TABLE livraria_comercial.cupom IS 'Seed de cupons para testes E2E do Cypress';
