-- Migration: 020_remover_restricao_inp_id_unico.sql
-- Remove a restrição de que uma intenção de pagamento só pode estar ligada a um único registro de pagamento.
-- Isso permite o split de pagamentos (múltiplos cartões) para a mesma intenção de checkout.

DROP INDEX IF EXISTS idx_pagamento_inp_id_unico;

-- Cria um índice não-único para manter a performance de busca por intenção.
CREATE INDEX IF NOT EXISTS idx_pagamento_inp_id_nao_unico
  ON pagamento(inp_id)
  WHERE inp_id IS NOT NULL;
