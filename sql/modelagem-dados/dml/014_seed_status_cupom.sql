-- =============================================================================
-- DML 014 — Seeds de status de cupom
-- Sistema: LES – E-Commerce de Livros
-- Execute após: 016_criar_tabela_status_cupom.sql
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Status de Cupom
-- Status possíveis para cupons de desconto
-- -----------------------------------------------------------------------------

INSERT INTO livraria_comercial.status_cupom (scu_codigo, scu_descricao, scu_ativo)
VALUES ('ATIVO', 'Ativo', true)
ON CONFLICT (scu_codigo) DO NOTHING;

INSERT INTO livraria_comercial.status_cupom (scu_codigo, scu_descricao, scu_ativo)
VALUES ('EXPIRADO', 'Expirado', true)
ON CONFLICT (scu_codigo) DO NOTHING;

INSERT INTO livraria_comercial.status_cupom (scu_codigo, scu_descricao, scu_ativo)
VALUES ('USADO', 'Usado', true)
ON CONFLICT (scu_codigo) DO NOTHING;

INSERT INTO livraria_comercial.status_cupom (scu_codigo, scu_descricao, scu_ativo)
VALUES ('CANCELADO', 'Cancelado', true)
ON CONFLICT (scu_codigo) DO NOTHING;
