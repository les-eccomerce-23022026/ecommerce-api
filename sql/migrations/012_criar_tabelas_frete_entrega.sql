-- Migration: 012_criar_tabelas_frete_entrega.sql
-- Descrição: Cria tabelas para entrega e frete (Sprint 3)
-- Data de execução: 2026-03-25

-- Tabela: tipo_frete
-- Armazena os tipos de frete disponíveis (PAC, SEDEX, Retira em Loja)
CREATE TABLE IF NOT EXISTS livraria_comercial.tipo_frete (
  tfr_id SERIAL PRIMARY KEY,
  tfr_descricao VARCHAR(100) NOT NULL UNIQUE,
  tfr_criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeds: Tipos de frete
INSERT INTO livraria_comercial.tipo_frete (tfr_descricao) VALUES
('PAC'),
('SEDEX'),
('RETIRA_EM_LOJA')
ON CONFLICT (tfr_descricao) DO NOTHING;

-- Tabela: entrega
-- Armazena informações de entrega das vendas realizadas
-- NOTA: FK para ecm_venda até migração 010 ser corrigida
CREATE TABLE IF NOT EXISTS livraria_comercial.entrega (
  ent_id SERIAL PRIMARY KEY,
  ent_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  ven_id INTEGER NOT NULL REFERENCES livraria_comercial.ecm_venda(ven_id) ON DELETE CASCADE,
  tfr_id INTEGER NOT NULL REFERENCES livraria_comercial.tipo_frete(tfr_id),
  ent_endereco_json JSONB NOT NULL,
  ent_custo DECIMAL(10,2) NOT NULL CHECK (ent_custo >= 0),
  ent_entregador VARCHAR(100),
  ent_criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_entrega_uuid ON livraria_comercial.entrega(ent_uuid);
CREATE INDEX IF NOT EXISTS idx_entrega_venda ON livraria_comercial.entrega(ven_id);
CREATE INDEX IF NOT EXISTS idx_entrega_tipo_frete ON livraria_comercial.entrega(tfr_id);

