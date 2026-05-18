-- Migration 030: Criar tabelas de rastreamento e eventos de rastreamento
-- Contexto: Logística - Persistência de códigos de rastreamento e eventos

-- Tabela de rastreamentos (vincula código de rastreamento à entrega)
CREATE TABLE IF NOT EXISTS rastreamentos (
    ras_id SERIAL PRIMARY KEY,
    ras_uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    ent_uuid UUID NOT NULL,
    ras_codigo VARCHAR(20) NOT NULL,
    ras_transportadora VARCHAR(50) NOT NULL, -- 'Correios' ou 'Loggi'
    ras_data_criacao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ras_data_entrega_prevista TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_rastreamento_entrega FOREIGN KEY (ent_uuid) REFERENCES entregas(ent_uuid) ON DELETE CASCADE,
    CONSTRAINT chk_transportadora CHECK (ras_transportadora IN ('Correios', 'Loggi'))
);

-- Índices para rastreamentos
CREATE INDEX idx_rastreamento_entrega ON rastreamentos(ent_uuid);
CREATE INDEX idx_rastreamento_codigo ON rastreamentos(ras_codigo);
CREATE INDEX idx_rastreamento_transportadora ON rastreamentos(ras_transportadora);

-- Comentários
COMMENT ON TABLE rastreamentos IS 'Códigos de rastreamento vinculados a entregas (mock de APIs de logística)';
COMMENT ON COLUMN rastreamentos.ras_codigo IS 'Código de rastreamento da transportadora (ex: BR123456789BR para Correios, LG123456789 para Loggi)';
COMMENT ON COLUMN rastreamentos.ras_transportadora IS 'Transportadora responsável pelo rastreamento (Correios ou Loggi)';
COMMENT ON COLUMN rastreamentos.ras_data_entrega_prevista IS 'Data prevista de entrega calculada pela API de logística';

-- Tabela de eventos de rastreamento (histórico de eventos de cada código)
CREATE TABLE IF NOT EXISTS eventos_rastreamento (
    ere_id SERIAL PRIMARY KEY,
    ere_uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    ras_uuid UUID NOT NULL,
    ere_codigo VARCHAR(10) NOT NULL, -- Ex: PO, RO, OEC, BDE (Correios) ou created, picked_up, in_transit, etc. (Loggi)
    ere_descricao VARCHAR(255) NOT NULL,
    ere_detalhe TEXT,
    ere_data TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ere_local VARCHAR(255),
    ere_destino VARCHAR(255),
    CONSTRAINT fk_evento_rastreamento FOREIGN KEY (ras_uuid) REFERENCES rastreamentos(ras_uuid) ON DELETE CASCADE
);

-- Índices para eventos de rastreamento
CREATE INDEX idx_evento_rastreamento ON eventos_rastreamento(ras_uuid);
CREATE INDEX idx_evento_data ON eventos_rastreamento(ere_data);

-- Comentários
COMMENT ON TABLE eventos_rastreamento IS 'Histórico de eventos de rastreamento (mock de APIs de logística)';
COMMENT ON COLUMN eventos_rastreamento.ere_codigo IS 'Código do evento de rastreamento (ex: PO=Postado, RO=Em trânsito, OEC=Saiu para entrega, BDE=Entregue)';
COMMENT ON COLUMN eventos_rastreamento.ere_descricao IS 'Descrição do evento de rastreamento';
COMMENT ON COLUMN eventos_rastreamento.ere_local IS 'Local onde ocorreu o evento';
COMMENT ON COLUMN eventos_rastreamento.ere_destino IS 'Destino do objeto (quando aplicável)';
