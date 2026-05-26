-- =============================================================================
-- DDL 010 — Tabela de configurações da aplicação
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_gestao
-- =============================================================================

CREATE TABLE IF NOT EXISTS livraria_gestao.configuracoes_app (
    cfg_id              SERIAL          PRIMARY KEY,
    cfg_chave           VARCHAR(50)     NOT NULL,
    cfg_valor           TEXT            NOT NULL,
    cfg_descricao       VARCHAR(255),
    cfg_atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_configuracoes_chave UNIQUE (cfg_chave)
);

COMMENT ON TABLE  livraria_gestao.configuracoes_app               IS 'Configurações globais do sistema.';
COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_id              IS 'Identificador interno da configuração.';
COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_chave           IS 'Chave única da configuração.';
COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_valor           IS 'Valor da configuração (JSON ou texto).';
COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_descricao       IS 'Descrição do propósito da configuração.';
COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_atualizado_em   IS 'Timestamp da última atualização.';
