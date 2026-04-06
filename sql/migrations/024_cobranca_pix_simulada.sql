-- Migration: 024_cobranca_pix_simulada.sql
-- Status de venda para pedido com PIX pendente + dados da cobrança simulada (QR / copia e cola).

INSERT INTO status_vendas (stv_descricao)
VALUES ('AGUARDANDO PAGAMENTO')
ON CONFLICT (stv_descricao) DO NOTHING;

CREATE TABLE IF NOT EXISTS pagamento_pix_simulado (
    ppx_id              BIGSERIAL       PRIMARY KEY,
    pag_id              BIGINT          NOT NULL UNIQUE
        REFERENCES pagamento(pag_id) ON DELETE CASCADE,
    ppx_copia_cola      TEXT            NOT NULL,
    ppx_qr_base64       TEXT,
    ppx_expira_em       TIMESTAMPTZ     NOT NULL,
    ppx_segredo_confirmacao VARCHAR(128) NOT NULL
);

COMMENT ON TABLE pagamento_pix_simulado IS 'Cobrança PIX simulada (copia-e-cola, QR, expiração, segredo para webhook).';
COMMENT ON COLUMN pagamento_pix_simulado.ppx_segredo_confirmacao IS 'Segredo enviado ao webhook para confirmar liquidação (simula assinatura do PSP).';

CREATE INDEX IF NOT EXISTS idx_pagamento_pix_simulado_pag_id ON pagamento_pix_simulado(pag_id);
