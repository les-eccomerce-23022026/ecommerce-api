-- Migration: 027_adicionar_campos_troca_vendas.sql
-- Adiciona suporte para trocas e devoluções (Sprint 2).

-- 1. Adicionar motivo de troca na venda
ALTER TABLE vendas
  ADD COLUMN IF NOT EXISTS ven_motivo_troca TEXT;

COMMENT ON COLUMN vendas.ven_motivo_troca IS 'Motivo informado pelo cliente ao solicitar troca ou devolução.';

-- 2. Adicionar flag de item em troca
ALTER TABLE itens_venda
  ADD COLUMN IF NOT EXISTS itv_em_troca BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN itens_venda.itv_em_troca IS 'Indica se este item específico da venda foi solicitado para troca.';

-- 3. Adicionar novos status de venda
INSERT INTO status_vendas (stv_descricao) VALUES 
('TROCA REJEITADA')
ON CONFLICT (stv_descricao) DO NOTHING;
