-- Migration: 027_criar_tabela_cupom.sql
-- Descrição: Cria tabela de cupons de desconto para testes E2E
-- Objetivos: Permitir testes de cupom no Cypress

-- =============================================================================
-- Tabela: cupom
-- =============================================================================
CREATE TABLE IF NOT EXISTS cupom (
    cup_id              BIGSERIAL       PRIMARY KEY,
    cup_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    cup_codigo          VARCHAR(50)     NOT NULL UNIQUE,
    cup_tipo            VARCHAR(20)     NOT NULL CHECK (cup_tipo IN ('promocional', 'troca')),
    cup_valor_desconto  DECIMAL(10,2)   NOT NULL CHECK (cup_valor_desconto > 0),
    cup_valor_minimo    DECIMAL(10,2)   DEFAULT 0 CHECK (cup_valor_minimo >= 0),
    cup_uso_maximo      INTEGER         DEFAULT NULL,
    cup_uso_atual       INTEGER         DEFAULT 0,
    cup_valido_de       DATE            DEFAULT CURRENT_DATE,
    cup_valido_ate      DATE            DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    cup_ativo           BOOLEAN         DEFAULT true,
    cup_criado_em       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    cup_atualizado_em    TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  cupom                    IS 'Cupons de desconto para testes E2E';
COMMENT ON COLUMN cupom.cup_id            IS 'Chave primária interna';
COMMENT ON COLUMN cupom.cup_uuid          IS 'Identificador público UUID';
COMMENT ON COLUMN cupom.cup_codigo        IS 'Código do cupom para digitação no checkout';
COMMENT ON COLUMN cupom.cup_tipo          IS 'Tipo: promocional (máximo 1 por compra) ou troca (múltiplos permitidos)';
COMMENT ON COLUMN cupom.cup_valor_desconto IS 'Valor do desconto em reais';
COMMENT ON COLUMN cupom.cup_valor_minimo  IS 'Valor mínimo da compra para aplicar o cupom';
COMMENT ON COLUMN cupom.cup_uso_maximo    IS 'Número máximo de usos (NULL = ilimitado)';
COMMENT ON COLUMN cupom.cup_uso_atual     IS 'Contador de usos atual';
COMMENT ON COLUMN cupom.cup_valido_de     IS 'Data de início de validade';
COMMENT ON COLUMN cupom.cup_valido_ate    IS 'Data de fim de validade';
COMMENT ON COLUMN cupom.cup_ativo          IS 'Se o cupom está ativo';
COMMENT ON COLUMN cupom.cup_criado_em     IS 'Timestamp de criação';
COMMENT ON COLUMN cupom.cup_atualizado_em  IS 'Timestamp da última atualização';

-- =============================================================================
-- Índices para performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_cupom_codigo           ON cupom(cup_codigo);
CREATE INDEX IF NOT EXISTS idx_cupom_tipo             ON cupom(cup_tipo);
CREATE INDEX IF NOT EXISTS idx_cupom_ativo            ON cupom(cup_ativo);
CREATE INDEX IF NOT EXISTS idx_cupom_validade         ON cupom(cup_valido_de, cup_valido_ate);

-- =============================================================================
-- Trigger: atualiza cup_atualizado_em automaticamente em cada UPDATE
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp_cupom()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.cup_atualizado_em := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_cupom_atualizado_em ON cupom;
CREATE TRIGGER tg_cupom_atualizado_em
    BEFORE UPDATE ON cupom
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp_cupom();
