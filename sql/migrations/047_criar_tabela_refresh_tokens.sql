-- Migration 047: Criar tabela de refresh tokens para segurança avançada
-- Implementa refresh token (long-lived) + access token (short-lived)
-- Proteção contra replay attack com IP e fingerprint

-- Tabela de refresh tokens
CREATE TABLE IF NOT EXISTS livraria_gestao.refresh_tokens (
    rft_id BIGSERIAL PRIMARY KEY,
    rft_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    usu_id BIGINT NOT NULL,
    rft_token_hash TEXT NOT NULL, -- Hash do refresh token (nunca armazenar plaintext)
    rft_ip_address TEXT, -- IP do usuário no momento da criação
    rft_user_agent TEXT, -- User agent para fingerprint básico
    rft_expira_em TIMESTAMPTZ NOT NULL, -- Data de expiração (long-lived: 7-30 dias)
    rft_revocado_em TIMESTAMPTZ, -- Data de revogação (se aplicável)
    rft_criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    loj_id INTEGER NOT NULL DEFAULT 1, -- Multi-tenancy
    CONSTRAINT fk_refresh_token_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE,
    CONSTRAINT uq_refresh_token_uuid UNIQUE (rft_uuid),
    CONSTRAINT uq_refresh_token_hash UNIQUE (rft_token_hash)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usu_id ON livraria_gestao.refresh_tokens(usu_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expira_em ON livraria_gestao.refresh_tokens(rft_expira_em);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revocado_em ON livraria_gestao.refresh_tokens(rft_revocado_em) WHERE rft_revocado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_loj_id ON livraria_gestao.refresh_tokens(loj_id);

-- Trigger para limpar refresh tokens expirados automaticamente
CREATE OR REPLACE FUNCTION livraria_gestao.limpar_refresh_tokens_expirados()
RETURNS void AS $$
BEGIN
    DELETE FROM livraria_gestao.refresh_tokens
    WHERE rft_expira_em < NOW()
    AND rft_revocado_em IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE livraria_gestao.refresh_tokens IS 'Tabela de refresh tokens para implementação de access token (short-lived) + refresh token (long-lived)';
COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_token_hash IS 'Hash do refresh token (SHA-256) - nunca armazenar plaintext';
COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_ip_address IS 'IP do usuário para proteção contra replay attack';
COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_user_agent IS 'User agent para fingerprint básico';
COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_expira_em IS 'Data de expiração do refresh token (recomendado: 7-30 dias)';
COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_revocado_em IS 'Data de revogação manual (logout, segurança)';
