-- =============================================================================
-- DML 011 — Seeds de transportadoras
-- Sistema: LES – E-Commerce de Livros
-- Execute após: 013_criar_tabela_transportadoras.sql
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transportadoras
-- Transportadoras disponíveis para entrega de pedidos
-- -----------------------------------------------------------------------------

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('Correios', 'COR', true)
ON CONFLICT (tra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('Sedex', 'SED', true)
ON CONFLICT (tra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('Loggi', 'LOG', true)
ON CONFLICT (tra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('JadLog', 'JAD', true)
ON CONFLICT (tra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('Braspress', 'BRA', true)
ON CONFLICT (tra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('Total Express', 'TOT', true)
ON CONFLICT (tra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.transportadoras (tra_nome, tra_codigo, tra_ativo)
VALUES ('Direct', 'DIR', true)
ON CONFLICT (tra_codigo) DO NOTHING;
