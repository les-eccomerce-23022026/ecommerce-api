-- =============================================================================
-- DDL 010 — Tabela de Configurações do Aplicativo
-- Armazena parâmetros globais, como hashes de senhas mestras para dev.
-- =============================================================================

CREATE TABLE IF NOT EXISTS configuracoes_app (
    cfg_id              SERIAL          PRIMARY KEY,
    cfg_chave           VARCHAR(50)     NOT NULL,
    cfg_valor           TEXT            NOT NULL,
    cfg_descricao       VARCHAR(255),
    cfg_atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_configuracoes_chave UNIQUE (cfg_chave)
);

COMMENT ON TABLE  configuracoes_app               IS 'Configurações globais do sistema.';
COMMENT ON COLUMN configuracoes_app.cfg_chave     IS 'Nome único da configuração (ex: SENHA_MESTRA_ADMIN_HASH).';
COMMENT ON COLUMN configuracoes_app.cfg_valor     IS 'Valor da configuração (pode ser um hash, uma string, etc).';
COMMENT ON COLUMN configuracoes_app.cfg_descricao IS 'Explicação sobre para que serve esta configuração.';
