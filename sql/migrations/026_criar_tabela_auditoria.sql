-- Migration: 026_criar_tabela_auditoria.sql
-- Descrição: Cria tabela de auditoria para rastrear ações críticas (admin, trocas, pagamentos)
-- Objetivos: RNF0043 (Auditoria de ações críticas)
-- Referência: GDPR, PCI DSS compliance

-- =============================================================================
-- Tabela: auditoria
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_gestao.auditoria (
    aud_id              BIGSERIAL       PRIMARY KEY,
    aud_uuid            UUID            NOT NULL DEFAULT gen_random_uuid(),
    aud_tipo_acao       VARCHAR(50)     NOT NULL,
    aud_entidade        VARCHAR(50)     NOT NULL,
    aud_entidade_id     VARCHAR(255)    NOT NULL,
    aud_usuario_id      BIGINT,
    aud_usuario_uuid    VARCHAR(255),
    aud_dados_anteriores JSONB,
    aud_dados_novos     JSONB,
    aud_ip              VARCHAR(45),
    aud_user_agent      VARCHAR(500),
    aud_loj_id          BIGINT,
    aud_criado_em       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_auditoria_uuid UNIQUE (aud_uuid)
);

-- =============================================================================
-- Índices para performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo_acao ON livraria_gestao.auditoria(aud_tipo_acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON livraria_gestao.auditoria(aud_entidade);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade_id ON livraria_gestao.auditoria(aud_entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON livraria_gestao.auditoria(aud_usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_loja ON livraria_gestao.auditoria(aud_loj_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON livraria_gestao.auditoria(aud_criado_em);

-- =============================================================================
-- Comentários
-- =============================================================================
COMMENT ON TABLE  livraria_gestao.auditoria IS 'Tabela de auditoria para rastrear ações críticas no sistema';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_id IS 'Chave primária interna';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_uuid IS 'Identificador público UUID';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_tipo_acao IS 'Tipo de ação (ex: CRIAR, ATUALIZAR, DELETAR, APROVAR, REJEITAR)';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_entidade IS 'Entidade afetada (ex: venda, pagamento, troca, usuario)';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_entidade_id IS 'ID da entidade afetada';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_usuario_id IS 'ID interno do usuário que realizou a ação';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_usuario_uuid IS 'UUID do usuário que realizou a ação';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_dados_anteriores IS 'Dados antes da ação (JSON)';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_dados_novos IS 'Dados após a ação (JSON)';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_ip IS 'Endereço IP da requisição';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_user_agent IS 'User agent da requisição';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_loj_id IS 'ID da loja (multi-tenancy)';
COMMENT ON COLUMN livraria_gestao.auditoria.aud_criado_em IS 'Timestamp da ação';
