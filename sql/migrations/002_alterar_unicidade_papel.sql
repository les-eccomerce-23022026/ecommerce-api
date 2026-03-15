-- =============================================================================
-- MIGRATION 002 — Alterar unicidade para permitir e-mail/CPF por papel
-- Objetivo: Permitir que o mesmo e-mail/CPF tenha acessos distintos como 
--           cliente e administrador, com senhas independentes.
-- =============================================================================

-- Remover as restrições de unicidade globais antigas
ALTER TABLE ecm_usuario DROP CONSTRAINT IF EXISTS uq_usuario_email;
ALTER TABLE ecm_usuario DROP CONSTRAINT IF EXISTS uq_usuario_cpf;

-- Adicionar as novas restrições compostas por e-mail+papel e cpf+papel
ALTER TABLE ecm_usuario ADD CONSTRAINT uq_usuario_email_papel UNIQUE (dsc_email, id_papel);
ALTER TABLE ecm_usuario ADD CONSTRAINT uq_usuario_cpf_papel UNIQUE (dsc_cpf, id_papel);

COMMENT ON CONSTRAINT uq_usuario_email_papel ON ecm_usuario IS 'Garante que um e-mail é único dentro do mesmo papel (cliente ou admin).';
COMMENT ON CONSTRAINT uq_usuario_cpf_papel ON ecm_usuario IS 'Garante que um CPF é único dentro do mesmo papel (cliente ou admin).';
