-- =============================================================================
-- DML 012 — Seeds de status de rastreamento
-- Sistema: LES – E-Commerce de Livros
-- Execute após: 014_criar_tabela_status_rastreamento.sql
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Status de Rastreamento
-- Status possíveis para rastreamento de entregas (ordenados por timeline)
-- -----------------------------------------------------------------------------

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('POSTADO', 'Postado', 1, true)
ON CONFLICT (sra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('EM_TRANSITO', 'Em trânsito', 2, true)
ON CONFLICT (sra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('EM_ROTA_DE_ENTREGA', 'Em rota de entrega', 3, true)
ON CONFLICT (sra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('ENTREGUE', 'Entregue', 4, true)
ON CONFLICT (sra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('FALHA_ENTREGA', 'Falha na entrega', 5, true)
ON CONFLICT (sra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('DEVOLVIDO', 'Devolvido ao remetente', 6, true)
ON CONFLICT (sra_codigo) DO NOTHING;

INSERT INTO livraria_logistica.status_rastreamento (sra_codigo, sra_descricao, sra_ordem, sra_ativo)
VALUES ('CANCELADO', 'Cancelado', 7, true)
ON CONFLICT (sra_codigo) DO NOTHING;
