-- =============================================================================
-- Migration 001 — Adicionar campos de perfil na tabela usuario
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Adiciona campos opcionais de perfil diretamente na tabela ecm_usuario
-- para simplificar o modelo e reduzir JOINs desnecessários.
-- Campos adicionados: genero, data_nascimento, telefone
-- -----------------------------------------------------------------------------
ALTER TABLE ecm_usuario
ADD COLUMN IF NOT EXISTS dsc_genero VARCHAR(30),
ADD COLUMN IF NOT EXISTS dat_nascimento DATE,
ADD COLUMN IF NOT EXISTS dsc_telefone VARCHAR(20);

COMMENT ON COLUMN ecm_usuario.dsc_genero      IS 'Gênero autodeclarado pelo usuário (opcional).';
COMMENT ON COLUMN ecm_usuario.dat_nascimento  IS 'Data de nascimento do usuário (opcional).';
COMMENT ON COLUMN ecm_usuario.dsc_telefone    IS 'Telefone principal do usuário (opcional, formato livre).';

-- Índice para busca por data de nascimento (relatórios, aniversários)
CREATE INDEX IF NOT EXISTS idx_usuario_nascimento ON ecm_usuario (dat_nascimento);