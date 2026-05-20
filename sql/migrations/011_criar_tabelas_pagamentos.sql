-- Migration: 011_criar_tabelas_pagamentos.sql
-- Descrição: Cria tabelas para módulo de pagamentos (Sprint 2)
-- Objetivos: RF0037 (Finalizar compra), RF0040 (Processar pagamento)
--
-- Padrão de nomenclatura adotado:
--   - Sem prefixo 'ecm_' nas tabelas (consistente com cartoes, bandeiras_cartao, etc.)
--   - Prefixos de colunas: stp_ (status), tpg_ (tipo), pag_ (pagamento), cpp_ (cartão pagamento)

-- =============================================================================
-- Tabela: status_pagamento
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_financeiro.status_pagamento (
    stp_id          SERIAL          PRIMARY KEY,
    stp_descricao   VARCHAR(50)     NOT NULL UNIQUE,
    stp_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  livraria_financeiro.status_pagamento              IS 'Status de pagamento das vendas (PENDENTE, APROVADO, RECUSADO, CANCELADO).';
COMMENT ON COLUMN livraria_financeiro.status_pagamento.stp_id       IS 'Identificador interno do status.';
COMMENT ON COLUMN livraria_financeiro.status_pagamento.stp_descricao IS 'Descrição do status (ex.: PENDENTE, APROVADO).';
COMMENT ON COLUMN livraria_financeiro.status_pagamento.stp_criado_em IS 'Timestamp de criação do registro.';

-- Inserir status padrão
INSERT INTO livraria_financeiro.status_pagamento (stp_descricao) VALUES
('PENDENTE'),
('APROVADO'),
('RECUSADO'),
('CANCELADO')
ON CONFLICT (stp_descricao) DO NOTHING;


-- =============================================================================
-- Tabela: tipo_pagamento
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_financeiro.tipo_pagamento (
    tpg_id          SERIAL          PRIMARY KEY,
    tpg_descricao   VARCHAR(50)     NOT NULL UNIQUE,
    tpg_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  livraria_financeiro.tipo_pagamento                IS 'Tipos de pagamento aceitos (cartao_credito, cupom_troca, cupom_promocional).';
COMMENT ON COLUMN livraria_financeiro.tipo_pagamento.tpg_id         IS 'Identificador interno do tipo de pagamento.';
COMMENT ON COLUMN livraria_financeiro.tipo_pagamento.tpg_descricao  IS 'Descrição do tipo (ex.: cartao_credito, cupom_promocional).';
COMMENT ON COLUMN livraria_financeiro.tipo_pagamento.tpg_criado_em  IS 'Timestamp de criação do registro.';

-- Inserir tipos padrão
INSERT INTO livraria_financeiro.tipo_pagamento (tpg_descricao) VALUES
('cartao_credito'),
('cupom_troca'),
('cupom_promocional')
ON CONFLICT (tpg_descricao) DO NOTHING;


-- =============================================================================
-- Tabela: pagamento
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_financeiro.pagamento (
    pag_id              BIGSERIAL       PRIMARY KEY,
    pag_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    ven_id              BIGINT          NOT NULL REFERENCES livraria_comercial.ecm_venda(ven_id) ON DELETE CASCADE,
    tpg_id              INTEGER         NOT NULL REFERENCES livraria_financeiro.tipo_pagamento(tpg_id),
    stp_id              INTEGER         NOT NULL REFERENCES livraria_financeiro.status_pagamento(stp_id),
    pag_valor           DECIMAL(10,2)   NOT NULL CHECK (pag_valor > 0),
    pag_detalhes_cupom  VARCHAR(100),
    pag_processado_em   TIMESTAMPTZ,
    pag_criado_em       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    pag_atualizado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  livraria_financeiro.pagamento                   IS 'Registros de pagamentos realizados para vendas.';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_id            IS 'Chave primária interna.';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_uuid          IS 'Identificador público UUID.';
COMMENT ON COLUMN livraria_financeiro.pagamento.ven_id            IS 'FK para ecm_venda — venda associada ao pagamento.';
COMMENT ON COLUMN livraria_financeiro.pagamento.tpg_id            IS 'FK para tipo_pagamento — tipo de pagamento utilizado.';
COMMENT ON COLUMN livraria_financeiro.pagamento.stp_id            IS 'FK para status_pagamento — status atual do pagamento.';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_valor         IS 'Valor total do pagamento.';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_detalhes_cupom IS 'Código ou detalhes do cupom (quando aplicável).';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_processado_em IS 'Timestamp de processamento do pagamento.';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_criado_em     IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN livraria_financeiro.pagamento.pag_atualizado_em IS 'Timestamp da última atualização.';


-- =============================================================================
-- Tabela: cartao_pagamento
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_financeiro.cartao_pagamento (
    cpp_id              BIGSERIAL       PRIMARY KEY,
    cpp_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    pag_id              BIGINT          NOT NULL REFERENCES livraria_financeiro.pagamento(pag_id) ON DELETE CASCADE,
    cpp_numero_tokenizado VARCHAR(255)  NOT NULL,
    cpp_nome_titular    VARCHAR(100)    NOT NULL,
    cpp_validade        VARCHAR(7)      NOT NULL,
    cpp_bandeira        VARCHAR(50)     NOT NULL,
    cpp_criado_em       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  livraria_financeiro.cartao_pagamento                  IS 'Dados de cartões utilizados em pagamentos (apenas tokens por segurança).';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_id           IS 'Chave primária interna.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_uuid         IS 'Identificador público UUID.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.pag_id           IS 'FK para pagamento — pagamento associado ao cartão.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_numero_tokenizado IS 'Token ou hash SHA-256 do número do cartão.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_nome_titular IS 'Nome do titular impresso no cartão.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_validade     IS 'Validade do cartão no formato MM/YYYY.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_bandeira     IS 'Bandeira do cartão (Visa, Mastercard, etc.).';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_criado_em    IS 'Timestamp de criação do registro.';


-- =============================================================================
-- Índices para performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_pagamento_uuid           ON livraria_financeiro.pagamento(pag_uuid);
CREATE INDEX IF NOT EXISTS idx_pagamento_venda          ON livraria_financeiro.pagamento(ven_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_status         ON livraria_financeiro.pagamento(stp_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_tipo           ON livraria_financeiro.pagamento(tpg_id);
CREATE INDEX IF NOT EXISTS idx_cartao_pagamento_pagamento ON livraria_financeiro.cartao_pagamento(pag_id);


-- =============================================================================
-- Trigger: atualiza pag_atualizado_em automaticamente em cada UPDATE
-- =============================================================================
CREATE OR REPLACE FUNCTION livraria_financeiro.fn_atualizar_timestamp_pagamento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.pag_atualizado_em := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_pagamento_atualizado_em ON livraria_financeiro.pagamento;
CREATE TRIGGER tg_pagamento_atualizado_em
    BEFORE UPDATE ON livraria_financeiro.pagamento
    FOR EACH ROW
    EXECUTE FUNCTION livraria_financeiro.fn_atualizar_timestamp_pagamento();
