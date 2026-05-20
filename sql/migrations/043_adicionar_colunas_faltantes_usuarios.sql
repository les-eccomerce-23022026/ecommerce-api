-- =============================================================================
-- Migration 043 — Adicionar colunas faltantes na tabela usuarios
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_gestao
-- Motivo: O código em usuario.queries.ts tenta acessar colunas que não existem
--         no schema atual, causando falhas em 309 testes de integração
-- =============================================================================

-- Adicionar coluna CNPJ para pessoas jurídicas
ALTER TABLE livraria_gestao.usuarios
ADD COLUMN IF NOT EXISTS usu_cnpj CHAR(18);

-- Adicionar coluna tipo de pessoa (PF/PJ)
ALTER TABLE livraria_gestao.usuarios
ADD COLUMN IF NOT EXISTS usu_tipo_pessoa CHAR(2) DEFAULT 'PF';

-- Adicionar coluna telefone rápido
ALTER TABLE livraria_gestao.usuarios
ADD COLUMN IF NOT EXISTS usu_telefone_rapido VARCHAR(15);

-- Adicionar coluna gênero
ALTER TABLE livraria_gestao.usuarios
ADD COLUMN IF NOT EXISTS usu_genero VARCHAR(20);

-- Adicionar coluna data de nascimento
ALTER TABLE livraria_gestao.usuarios
ADD COLUMN IF NOT EXISTS usu_data_nascimento DATE;

-- Adicionar comentários
COMMENT ON COLUMN livraria_gestao.usuarios.usu_cnpj IS 'CNPJ no formato XX.XXX.XXX/XXXX-XX. Usado para pessoas jurídicas.';
COMMENT ON COLUMN livraria_gestao.usuarios.usu_tipo_pessoa IS 'Tipo de pessoa: PF (Pessoa Física) ou PJ (Pessoa Jurídica).';
COMMENT ON COLUMN livraria_gestao.usuarios.usu_telefone_rapido IS 'Telefone de contato rápido do usuário.';
COMMENT ON COLUMN livraria_gestao.usuarios.usu_genero IS 'Gênero do usuário (masculino, feminino, outro, não informado).';
COMMENT ON COLUMN livraria_gestao.usuarios.usu_data_nascimento IS 'Data de nascimento do usuário.';
