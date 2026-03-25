-- Migration [20260325-100000] - Criar tabelas de vendas e itens de venda
-- Objetivos: RF0033 (Realizar compra), RF0037 (Finalizar compra)

-- Tabela de Status de Venda para normalização
CREATE TABLE IF NOT EXISTS ecm_status_venda (
    stv_id SERIAL PRIMARY KEY,
    stv_descricao VARCHAR(50) NOT NULL UNIQUE,
    stv_criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de status básicos
INSERT INTO ecm_status_venda (stv_descricao) VALUES 
('EM PROCESSAMENTO'), ('APROVADA'), ('REPROVADA'), ('EM TRÂNSITO'), ('ENTREGUE'), ('EM TROCA'), ('TROCA AUTORIZADA'), ('CONCLUÍDA')
ON CONFLICT (stv_descricao) DO NOTHING;

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS ecm_venda (
    ven_id BIGSERIAL PRIMARY KEY,
    ven_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    usu_id BIGINT NOT NULL,
    stv_id INTEGER NOT NULL REFERENCES ecm_status_venda(stv_id),
    ven_total_itens DECIMAL(10,2) NOT NULL,
    ven_frete DECIMAL(10,2) NOT NULL,
    ven_total_venda DECIMAL(10,2) NOT NULL,
    ven_criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ven_atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venda_usuario FOREIGN KEY (usu_id) REFERENCES usuarios(usu_id)
);

-- Tabela de Itens de Venda
CREATE TABLE IF NOT EXISTS ecm_item_venda (
    itv_id BIGSERIAL PRIMARY KEY,
    itv_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    ven_id BIGINT NOT NULL REFERENCES ecm_venda(ven_id) ON DELETE CASCADE,
    liv_uuid UUID NOT NULL, -- Referência UUID do livro (livro modularizado em breve)
    itv_quantidade INTEGER NOT NULL,
    itv_preco_unitario DECIMAL(10,2) NOT NULL,
    itv_criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    itv_atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_venda_usuario ON ecm_venda(usu_id);
CREATE INDEX IF NOT EXISTS idx_venda_status ON ecm_venda(stv_id);
CREATE INDEX IF NOT EXISTS idx_item_venda_uuid ON ecm_item_venda(itv_uuid);
CREATE INDEX IF NOT EXISTS idx_item_venda_venda ON ecm_item_venda(ven_id);
