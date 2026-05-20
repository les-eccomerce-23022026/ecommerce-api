-- Migration: 020_cotacao_frete_transportadora.sql
-- Cotações de frete persistidas (agnósticas ao provedor) + extensão simulada + vínculo opcional na venda.

CREATE TABLE IF NOT EXISTS livraria_comercial.cotacao_frete (
    cfr_id              BIGSERIAL       PRIMARY KEY,
    cfr_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    cfr_provedor        VARCHAR(32)     NOT NULL DEFAULT 'simulado',
    cfr_estado          VARCHAR(32)     NOT NULL
        CHECK (cfr_estado IN ('CRIADA', 'CONSUMIDA', 'EXPIRADA', 'CANCELADA')),
    cfr_cep_origem      VARCHAR(8)      NOT NULL,
    cfr_cep_destino     VARCHAR(8)      NOT NULL,
    cfr_peso_kg         DECIMAL(10,3)   NOT NULL CHECK (cfr_peso_kg > 0),
    cfr_valor_itens     DECIMAL(10,2),
    cfr_tipo_servico    VARCHAR(32)     NOT NULL,
    cfr_valor           DECIMAL(10,2)   NOT NULL CHECK (cfr_valor >= 0),
    cfr_prazo_texto     VARCHAR(160)    NOT NULL,
    cfr_expira_em       TIMESTAMPTZ     NOT NULL,
    cfr_criado_em       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ven_id              BIGINT          REFERENCES livraria_comercial.vendas(ven_id) ON DELETE SET NULL
);

COMMENT ON TABLE livraria_comercial.cotacao_frete IS 'Cotação de frete por modalidade; UUID exposto ao cliente para seleção no checkout.';
CREATE INDEX IF NOT EXISTS idx_cotacao_frete_uuid ON livraria_comercial.cotacao_frete(cfr_uuid);
CREATE INDEX IF NOT EXISTS idx_cotacao_frete_estado_expira ON livraria_comercial.cotacao_frete(cfr_estado, cfr_expira_em);
CREATE INDEX IF NOT EXISTS idx_cotacao_frete_ven ON livraria_comercial.cotacao_frete(ven_id);

CREATE TABLE IF NOT EXISTS livraria_comercial.cotacao_frete_simulada (
    cfr_id              BIGINT          PRIMARY KEY REFERENCES livraria_comercial.cotacao_frete(cfr_id) ON DELETE CASCADE,
    cfs_fator_regiao    DECIMAL(10,4)   NOT NULL DEFAULT 1.0,
    cfs_peso_arredondado DECIMAL(10,3)  NOT NULL
);

COMMENT ON TABLE livraria_comercial.cotacao_frete_simulada IS 'Metadados da transportadora simulada (regras internas de cálculo).';

ALTER TABLE livraria_comercial.vendas ADD COLUMN IF NOT EXISTS cfr_id BIGINT REFERENCES livraria_comercial.cotacao_frete(cfr_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendas_cfr ON livraria_comercial.vendas(cfr_id);

COMMENT ON COLUMN livraria_comercial.vendas.cfr_id IS 'Cotação de frete escolhida no checkout (opcional durante migração legado).';
