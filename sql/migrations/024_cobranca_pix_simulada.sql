-- Migration: 024_cobranca_pix_simulada.sql
-- Status de venda para pedido com PIX pendente + dados da cobrança simulada (QR / copia e cola).
-- Correção: Usar nome correto da tabela ecm_status_venda (migration 015 foi desativada)

INSERT INTO livraria_comercial.ecm_status_venda (stv_descricao)
VALUES ('AGUARDANDO PAGAMENTO')
ON CONFLICT (stv_descricao) DO NOTHING;

CREATE TABLE IF NOT EXISTS livraria_financeiro.pagamento_pix_simulado (
    pps_id BIGSERIAL PRIMARY KEY,
    pps_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    pag_id BIGINT NOT NULL REFERENCES livraria_financeiro.pagamento(pag_id) ON DELETE CASCADE,
    pps_codigo_qr VARCHAR(255),
    pps_codigo_copia_cola VARCHAR(255),
    pps_expiracao_em TIMESTAMPTZ NOT NULL,
    pps_criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_financeiro.pagamento_pix_simulado IS 'Cobrança PIX simulada (copia-e-cola, QR, expiração, segredo para webhook).';

CREATE INDEX IF NOT EXISTS idx_pagamento_pix_simulado_pag_id ON livraria_financeiro.pagamento_pix_simulado(pag_id);
