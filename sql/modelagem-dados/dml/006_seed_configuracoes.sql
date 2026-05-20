-- =============================================================================
-- DML 006 — Seed de Configurações do Aplicativo
-- Senha Master Sugerida: "@asdfJKLÇ123"
-- =============================================================================

INSERT INTO livraria_gestao.configuracoes_app (cfg_chave, cfg_valor, cfg_descricao)
VALUES (
    'SENHA_MESTRA_ADMIN_HASH',
    '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W',
    'Hash da senha mestra de administrador para desenvolvimento.'
)
ON CONFLICT (cfg_chave) DO UPDATE SET cfg_valor = EXCLUDED.cfg_valor;

INSERT INTO livraria_gestao.configuracoes_app (cfg_chave, cfg_valor, cfg_descricao)
VALUES (
    'SENHA_MESTRA_CLIENTE_HASH',
    '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W',
    'Hash da senha mestra de cliente para desenvolvimento.'
)
ON CONFLICT (cfg_chave) DO UPDATE SET cfg_valor = EXCLUDED.cfg_valor;
