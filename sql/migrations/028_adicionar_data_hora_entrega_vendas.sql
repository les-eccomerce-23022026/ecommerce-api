-- Migration: 028_adicionar_data_hora_entrega_vendas.sql
-- Adiciona campo de data/hora de entrega na tabela de vendas para suporte ao prazo de troca (RN0043, Sprint 2).

ALTER TABLE vendas
  ADD COLUMN IF NOT EXISTS ven_data_hora_entrega TIMESTAMPTZ;

COMMENT ON COLUMN vendas.ven_data_hora_entrega IS 'Data e hora em que a entrega foi confirmada. Usada para calcular o prazo de 7 dias para solicitação de troca (RN0043).';
