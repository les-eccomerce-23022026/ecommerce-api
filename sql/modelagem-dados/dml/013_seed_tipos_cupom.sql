-- =============================================================================
-- DML 013 — Seeds de tipos de cupom
-- Sistema: LES – E-Commerce de Livros
-- Execute após: 015_criar_tabela_tipos_cupom.sql
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos de Cupom
-- Tipos de cupom disponíveis no sistema
-- -----------------------------------------------------------------------------

INSERT INTO livraria_comercial.tipos_cupom (tpc_codigo, tpc_descricao, tpc_ativo)
VALUES ('PERCENTUAL', 'Percentual de desconto', true)
ON CONFLICT (tpc_codigo) DO NOTHING;

INSERT INTO livraria_comercial.tipos_cupom (tpc_codigo, tpc_descricao, tpc_ativo)
VALUES ('FIXO', 'Valor fixo de desconto', true)
ON CONFLICT (tpc_codigo) DO NOTHING;

INSERT INTO livraria_comercial.tipos_cupom (tpc_codigo, tpc_descricao, tpc_ativo)
VALUES ('FRETE_GRATIS', 'Frete grátis', true)
ON CONFLICT (tpc_codigo) DO NOTHING;
