-- Migration: 018_criar_tabelas_intencao_pagamento.sql
-- Intenção de cobrança persistida (agnóstica ao provedor); segredo apenas como HMAC no backend.

CREATE TABLE IF NOT EXISTS livraria_financeiro.intencao_pagamento (
    inp_id                      BIGSERIAL       PRIMARY KEY,
    inp_uuid                    UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    inp_valor                   DECIMAL(10,2)   NOT NULL CHECK (inp_valor > 0),
    inp_moeda                   VARCHAR(3)      NOT NULL DEFAULT 'BRL',
    inp_provedor                VARCHAR(32)     NOT NULL,
    inp_estado                  VARCHAR(32)     NOT NULL
        CHECK (inp_estado IN ('CRIADA', 'CONFIRMADA', 'RECUSADA', 'EXPIRADA', 'CANCELADA')),
    inp_hash_segredo            VARCHAR(128)    NOT NULL,
    inp_criado_em               TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inp_expira_em               TIMESTAMPTZ     NOT NULL,
    inp_tentativas_confirmacao  INTEGER         NOT NULL DEFAULT 0 CHECK (inp_tentativas_confirmacao >= 0),
    inp_confirmado_em           TIMESTAMPTZ,
    inp_recusado_em             TIMESTAMPTZ,
    ven_id                      BIGINT          REFERENCES livraria_comercial.ecm_venda(ven_id) ON DELETE SET NULL
);

COMMENT ON TABLE livraria_financeiro.intencao_pagamento IS 'Intenção de pagamento/cobrança antes da confirmação no provedor (valor travado, TTL, estado).';
COMMENT ON COLUMN livraria_financeiro.intencao_pagamento.inp_hash_segredo IS 'HMAC-SHA-256 (hex) do segredo de confirmação; nunca armazenar segredo em claro.';
COMMENT ON COLUMN livraria_financeiro.intencao_pagamento.inp_expira_em IS 'Após este instante a intenção não pode ser confirmada (validação obrigatória na API).';

CREATE INDEX IF NOT EXISTS idx_intencao_pagamento_uuid ON livraria_financeiro.intencao_pagamento(inp_uuid);
CREATE INDEX IF NOT EXISTS idx_intencao_pagamento_estado_expira ON livraria_financeiro.intencao_pagamento(inp_estado, inp_expira_em);

-- Extensão mínima para o provedor simulado (reserva para flags futuras)
CREATE TABLE IF NOT EXISTS livraria_financeiro.intencao_pagamento_simulado (
    inp_id      BIGINT  PRIMARY KEY REFERENCES livraria_financeiro.intencao_pagamento(inp_id) ON DELETE CASCADE
);

COMMENT ON TABLE livraria_financeiro.intencao_pagamento_simulado IS 'Metadados específicos do provedor de pagamento simulado.';

-- Extensão para Stripe (IDs externos; sem client_secret em claro)
CREATE TABLE IF NOT EXISTS livraria_financeiro.intencao_pagamento_stripe (
    inp_id                      BIGINT          PRIMARY KEY REFERENCES livraria_financeiro.intencao_pagamento(inp_id) ON DELETE CASCADE,
    stripe_payment_intent_id    VARCHAR(255),
    stripe_customer_id          VARCHAR(255)
);

COMMENT ON TABLE livraria_financeiro.intencao_pagamento_stripe IS 'Referências Stripe; segredos efêmeros não persistidos em texto plano.';
