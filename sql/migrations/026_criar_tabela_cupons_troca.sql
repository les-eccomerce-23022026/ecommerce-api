-- Migration: 026_criar_tabela_cupons_troca.sql
-- Cria a tabela para gerenciar cupons de troca (gerados por devoluções).

CREATE TABLE IF NOT EXISTS cupons_troca (
  ctr_id BIGSERIAL PRIMARY KEY,
  ctr_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  usu_id BIGINT NOT NULL REFERENCES usuarios(usu_id),
  ctr_codigo VARCHAR(50) NOT NULL UNIQUE,
  ctr_valor_original NUMERIC(10, 2) NOT NULL,
  ctr_valor_atual NUMERIC(10, 2) NOT NULL,
  ctr_ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ctr_criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ctr_atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupons_troca_codigo ON cupons_troca(ctr_codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_troca_usuario ON cupons_troca(usu_id);

COMMENT ON TABLE cupons_troca IS 'Armazena cupons de troca vinculados aos usuários.';
COMMENT ON COLUMN cupons_troca.ctr_codigo IS 'Código único do cupom (ex.: TROCA-ABC-123).';
COMMENT ON COLUMN cupons_troca.ctr_valor_atual IS 'Saldo remanescente do cupom.';
