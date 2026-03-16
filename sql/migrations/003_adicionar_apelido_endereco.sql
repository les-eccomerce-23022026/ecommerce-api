-- =============================================================================
-- Migration 003 — Adicionar coluna de apelido à tabela de endereços
-- Objetivo: Permitir que o usuário identifique endereços (ex: "Casa", "Trabalho")
-- =============================================================================

ALTER TABLE ecm_endereco_usuario 
ADD COLUMN IF NOT EXISTS nom_apelido VARCHAR(50);

COMMENT ON COLUMN ecm_endereco_usuario.nom_apelido IS 'Apelido customizado do endereço (ex: Casa, Trabalho).';
