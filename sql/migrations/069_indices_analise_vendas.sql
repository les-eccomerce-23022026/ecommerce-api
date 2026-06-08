-- Migration: 069_indices_analise_vendas.sql
-- Descrição: Índices compostos para otimizar query de análise de vendas por categoria
-- Data: 2026-06-06
-- Justificativa: A query de análise de vendas por categoria e período precisa de índices
--              compostos para evitar full table scan e garantir performance < 200ms

-- Índice composto para queries por período + loja (ordem descendente para queries recentes)
CREATE INDEX IF NOT EXISTS idx_vendas_criado_em_loj
  ON livraria_comercial.vendas (ven_criado_em DESC, loj_id);

-- Índice para join itens_venda → livros via UUID
CREATE INDEX IF NOT EXISTS idx_itens_venda_livro_uuid
  ON livraria_comercial.itens_venda (liv_uuid);

-- Índice composto para vendas por período (para queries de análise)
CREATE INDEX IF NOT EXISTS idx_vendas_periodo_loj
  ON livraria_comercial.vendas (ven_criado_em, loj_id);

-- Comentários explicativos
COMMENT ON INDEX livraria_comercial.idx_vendas_criado_em_loj IS 'Índice composto para queries de análise por período e loja (ordem descendente para dados recentes)';
COMMENT ON INDEX livraria_comercial.idx_itens_venda_livro_uuid IS 'Índice para otimizar join itens_venda → livros via UUID';
COMMENT ON INDEX livraria_comercial.idx_vendas_periodo_loj IS 'Índice composto para queries de análise por período e loja';
