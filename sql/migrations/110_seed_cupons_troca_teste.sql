-- Migration: 110_seed_cupons_troca_teste.sql
-- Descrição: Seed de cupons de troca para testes E2E do Cypress
-- Objetivos: Criar cupons de troca vinculados ao cliente de teste para validação de RN0036 e RN0035

-- Inserir cupons de troca para o cliente de teste (clientetest@email.com)
INSERT INTO livraria_comercial.cupons_troca (
    cpt_codigo, 
    cpt_valor, 
    cpt_cliente_id, 
    cpt_status, 
    cpt_valido_ate, 
    loj_id
) VALUES
-- Cupom de troca de R$ 50 para cliente de teste
('TROCA50-TESTE', 50.00, 
 (SELECT c.cli_id FROM livraria_gestao.clientes c JOIN livraria_gestao.usuarios u ON c.usu_id = u.usu_id WHERE u.usu_email = 'clientetest@email.com'),
 'DISPONIVEL', 
 CURRENT_DATE + INTERVAL '1 year',
 32),
-- Cupom de troca de R$ 30 para cliente de teste
('TROCA30-TESTE', 30.00,
 (SELECT c.cli_id FROM livraria_gestao.clientes c JOIN livraria_gestao.usuarios u ON c.usu_id = u.usu_id WHERE u.usu_email = 'clientetest@email.com'),
 'DISPONIVEL',
 CURRENT_DATE + INTERVAL '1 year',
 32),
-- Cupom de troca de R$ 100 para cliente de teste
('TROCA100-TESTE', 100.00,
 (SELECT c.cli_id FROM livraria_gestao.clientes c JOIN livraria_gestao.usuarios u ON c.usu_id = u.usu_id WHERE u.usu_email = 'clientetest@email.com'),
 'DISPONIVEL',
 CURRENT_DATE + INTERVAL '1 year',
 32)
ON CONFLICT (cpt_codigo) DO NOTHING;

COMMENT ON TABLE livraria_comercial.cupons_troca IS 'Seed de cupons de troca para testes E2E do Cypress - vinculados ao cliente de teste';
