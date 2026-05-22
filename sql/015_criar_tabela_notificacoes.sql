-- Tabela de Notificações
-- Armazena notificações para exibir badge no header do cliente
-- Substitui envio de e-mail por sistema testável via E2E

CREATE TABLE IF NOT EXISTS livraria_comercial.notificacoes (
    not_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    not_usuario_uuid UUID NOT NULL REFERENCES livraria_gestao.usuarios(usu_uuid) ON DELETE CASCADE,
    not_venda_uuid UUID REFERENCES livraria_comercial.vendas(ven_uuid) ON DELETE SET NULL,
    not_tipo VARCHAR(50) NOT NULL, -- 'RASTREIO', 'TROCA_AUTORIZADA', 'TROCA_FINALIZADA', 'TROCA_REJEITADA'
    not_titulo VARCHAR(255) NOT NULL,
    not_mensagem TEXT NOT NULL,
    not_codigo_rastreio VARCHAR(100),
    not_lida BOOLEAN DEFAULT FALSE,
    not_criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    not_atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_uuid ON livraria_comercial.notificacoes(not_usuario_uuid);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON livraria_comercial.notificacoes(not_lida) WHERE not_lida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON livraria_comercial.notificacoes(not_criado_em DESC);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION livraria_comercial.atualizar_notificacoes_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.not_atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_notificacoes_atualizado_em ON livraria_comercial.notificacoes;
CREATE TRIGGER trigger_atualizar_notificacoes_atualizado_em
    BEFORE UPDATE ON livraria_comercial.notificacoes
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.atualizar_notificacoes_atualizado_em();

-- Comentários
COMMENT ON TABLE livraria_comercial.notificacoes IS 'Armazena notificações para exibir badge no header do cliente';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_uuid IS 'Identificador único da notificação';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_usuario_uuid IS 'UUID do usuário destinatário';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_venda_uuid IS 'UUID da venda relacionada (opcional)';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_tipo IS 'Tipo da notificação: RASTREIO, TROCA_AUTORIZADA, TROCA_FINALIZADA, TROCA_REJEITADA';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_titulo IS 'Título curto da notificação';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_mensagem IS 'Mensagem detalhada da notificação';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_codigo_rastreio IS 'Código de rastreio (aplicável para tipo RASTREIO)';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_lida IS 'Indica se o usuário já visualizou a notificação';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_criado_em IS 'Data de criação da notificação';
COMMENT ON COLUMN livraria_comercial.notificacoes.not_atualizado_em IS 'Data da última atualização';
