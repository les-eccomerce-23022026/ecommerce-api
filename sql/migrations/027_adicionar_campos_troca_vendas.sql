-- Migration: 027_adicionar_campos_troca_vendas.sql
-- Adiciona suporte para trocas e devoluções (Sprint 2).
-- Correção: Usar nomes corretos das tabelas (ecm_venda, ecm_item_venda, ecm_status_venda)
--            pois a migration 015 foi desativada

-- 1. Adicionar motivo de troca na venda
ALTER TABLE livraria_comercial.ecm_venda
  ADD COLUMN IF NOT EXISTS ven_motivo_troca TEXT;

COMMENT ON COLUMN livraria_comercial.ecm_venda.ven_motivo_troca IS 'Motivo informado pelo cliente ao solicitar troca ou devolução.';

-- 2. Adicionar flag de item em troca
ALTER TABLE livraria_comercial.ecm_item_venda
  ADD COLUMN IF NOT EXISTS itv_em_troca BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN livraria_comercial.ecm_item_venda.itv_em_troca IS 'Indica se este item específico da venda foi solicitado para troca.';

-- 3. Adicionar novos status de venda
INSERT INTO livraria_comercial.ecm_status_venda (stv_descricao) VALUES
('TROCA REJEITADA')
ON CONFLICT (stv_descricao) DO NOTHING;
