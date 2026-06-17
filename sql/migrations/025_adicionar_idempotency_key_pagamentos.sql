-- Migration: 025_adicionar_idempotency_key_pagamentos.sql
-- Descrição: Adiciona idempotency key para prevenir cobranças duplicadas em pagamentos
-- Objetivos: RNF0042 (Idempotência em operações de pagamento)
-- Referência: https://stripe.com/docs/api/idempotent_requests

-- =============================================================================
-- Adicionar coluna de idempotency key
-- =============================================================================
ALTER TABLE livraria_financeiro.pagamento
ADD COLUMN IF NOT EXISTS pag_idempotency_key VARCHAR(255);

-- =============================================================================
-- Criar índice único para garantir idempotência
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamento_idempotency_key
ON livraria_financeiro.pagamento(pag_idempotency_key)
WHERE pag_idempotency_key IS NOT NULL;

-- =============================================================================
-- Adicionar comentário
-- =============================================================================
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_idempotency_key
IS 'Chave de idempotência para prevenir cobranças duplicadas. Se fornecida, operações repetidas com a mesma key retornam o mesmo resultado.';
