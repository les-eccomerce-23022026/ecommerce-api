-- =============================================================================
-- DML 010 — Seeds de motivos de troca e devolução
-- Sistema: LES – E-Commerce de Livros
-- Execute após: 012_criar_tabelas_motivos_troca_devolucao.sql
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Motivos de Troca
-- Motivos pelos quais um cliente pode solicitar troca de produtos
-- -----------------------------------------------------------------------------

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Defeito no produto', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Tamanho errado', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Cor errada', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Produto diferente do pedido', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Não gostei do produto', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Produto danificado durante transporte', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Produto incompleto', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_troca (mtr_descricao, mtr_ativo)
VALUES ('Erro no pedido', true)
ON CONFLICT (mtr_descricao) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Motivos de Devolução
-- Motivos pelos quais um cliente pode solicitar devolução de produtos
-- -----------------------------------------------------------------------------

INSERT INTO livraria_comercial.motivos_devolucao (mde_descricao, mde_ativo)
VALUES ('Defeito no produto', true)
ON CONFLICT (mde_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_devolucao (mde_descricao, mde_ativo)
VALUES ('Arrependimento de compra', true)
ON CONFLICT (mde_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_devolucao (mde_descricao, mde_ativo)
VALUES ('Produto diferente do pedido', true)
ON CONFLICT (mde_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_devolucao (mde_descricao, mde_ativo)
VALUES ('Produto danificado durante transporte', true)
ON CONFLICT (mde_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_devolucao (mde_descricao, mde_ativo)
VALUES ('Produto incompleto', true)
ON CONFLICT (mde_descricao) DO NOTHING;

INSERT INTO livraria_comercial.motivos_devolucao (mde_descricao, mde_ativo)
VALUES ('Erro no pedido', true)
ON CONFLICT (mde_descricao) DO NOTHING;
