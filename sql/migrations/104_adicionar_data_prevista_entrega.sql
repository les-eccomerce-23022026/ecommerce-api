-- Migration 104: Adiciona data prevista de entrega na tabela de vendas
-- Necessário para o job de auto-confirmação de entrega após prazo expirado

ALTER TABLE livraria_comercial.vendas
  ADD COLUMN IF NOT EXISTS ven_data_prevista_entrega TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN livraria_comercial.vendas.ven_data_prevista_entrega
  IS 'Data prevista de entrega calculada no despacho. Usada pelo job de auto-confirmação quando o cliente não confirmar o recebimento.';
