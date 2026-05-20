-- Migration: 026_criar_tabela_cupons_troca.sql
-- Cria a tabela para gerenciar cupons de troca (gerados por devoluções).

CREATE TABLE IF NOT EXISTS livraria_comercial.cupons_troca (
    cpt_id BIGSERIAL PRIMARY KEY,
    cpt_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    cpt_codigo VARCHAR(50) NOT NULL UNIQUE,
    cpt_valor DECIMAL(10,2) NOT NULL CHECK (cpt_valor > 0),
    cpt_cliente_id BIGINT NOT NULL REFERENCES livraria_gestao.clientes(cli_id) ON DELETE CASCADE,
    cpt_venda_origem_id BIGINT REFERENCES livraria_comercial.ecm_venda(ven_id),
    cpt_status VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL' CHECK (cpt_status IN ('DISPONIVEL', 'UTILIZADO', 'EXPIRADO')),
    cpt_valido_ate DATE NOT NULL,
    cpt_criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cupons_troca_codigo ON livraria_comercial.cupons_troca(cpt_codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_troca_usuario ON livraria_comercial.cupons_troca(cpt_cliente_id);

COMMENT ON TABLE livraria_comercial.cupons_troca IS 'Armazena cupons de troca vinculados aos clientes.';
COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_codigo IS 'Código único do cupom (ex.: TROCA-ABC-123).';
COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_valor IS 'Saldo remanescente do cupom.';
COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_cliente_id IS 'ID do cliente vinculado ao cupom.';
COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_status IS 'Status do cupom (DISPONIVEL, UTILIZADO, EXPIRADO).';
