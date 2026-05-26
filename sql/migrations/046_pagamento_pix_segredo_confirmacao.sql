-- Migration: 046_pagamento_pix_segredo_confirmacao.sql
-- Adiciona coluna de segredo para confirmação do webhook PIX simulado (alinha código ao domínio).

ALTER TABLE livraria_financeiro.pagamento_pix_simulado
    ADD COLUMN IF NOT EXISTS pps_segredo_confirmacao VARCHAR(128);

COMMENT ON COLUMN livraria_financeiro.pagamento_pix_simulado.pps_segredo_confirmacao IS
    'Segredo enviado ao webhook para confirmar liquidação (simula assinatura do PSP).';
