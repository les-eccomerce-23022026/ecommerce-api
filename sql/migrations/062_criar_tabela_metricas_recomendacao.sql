-- Migration: Criar tabela de métricas de recomendação de IA
-- Descrição: Tabela para persistir métricas de avaliação do sistema de recomendação
-- Relacionado à: Entrega 8 - IA de Recomendação de Produtos

BEGIN;

-- Criar tabela de métricas de recomendação no schema comercial
CREATE TABLE IF NOT EXISTS livraria_comercial.metricas_recomendacao (
    id BIGSERIAL PRIMARY KEY,
    cliente_uuid UUID NOT NULL,
    query TEXT NOT NULL,
    produtos_recomendados JSONB NOT NULL,
    tempo_resposta_ms INTEGER NOT NULL,
    precisao NUMERIC(5, 4) NOT NULL,
    recall NUMERIC(5, 4) NOT NULL,
    f1_score NUMERIC(5, 4) NOT NULL,
    relevancia_semantica NUMERIC(5, 4) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    loj_id BIGINT NOT NULL,
    
    -- Índices para consultas frequentes
    CONSTRAINT fk_metricas_cliente FOREIGN KEY (cliente_uuid) 
        REFERENCES livraria_gestao.usuarios(usu_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_metricas_loja FOREIGN KEY (loj_id) 
        REFERENCES livraria_gestao.lojas(loj_id)
);

-- Criar índices para performance
CREATE INDEX idx_metricas_cliente_uuid ON livraria_comercial.metricas_recomendacao(cliente_uuid);
CREATE INDEX idx_metricas_data_criacao ON livraria_comercial.metricas_recomendacao(data_criacao DESC);
CREATE INDEX idx_metricas_loj_id ON livraria_comercial.metricas_recomendacao(loj_id);
CREATE INDEX idx_metricas_tempo_resposta ON livraria_comercial.metricas_recomendacao(tempo_resposta_ms);

-- Criar índice GIN para busca no JSONB de produtos recomendados
CREATE INDEX idx_metricas_produtos_recomendados ON livraria_comercial.metricas_recomendacao USING GIN (produtos_recomendados);

-- Adicionar comentários
COMMENT ON TABLE livraria_comercial.metricas_recomendacao IS 'Métricas de avaliação do sistema de recomendação de IA';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.cliente_uuid IS 'UUID do cliente que fez a consulta';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.query IS 'Query/texto da pergunta do usuário';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.produtos_recomendados IS 'Lista de UUIDs dos produtos recomendados';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.tempo_resposta_ms IS 'Tempo de resposta em milissegundos';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.precisao IS 'Precisão das recomendações (0-1)';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.recall IS 'Recall das recomendações (0-1)';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.f1_score IS 'F1-Score das recomendações (0-1)';
COMMENT ON COLUMN livraria_comercial.metricas_recomendacao.relevancia_semantica IS 'Relevância semântica da resposta (0-1)';

COMMIT;