-- =============================================================================
-- DDL 003 — Tabela de perfil de cliente
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_gestao
-- =============================================================================

-- -----------------------------------------------------------------------------
-- clientes
-- Extensão 1:1 de usuarios para clientes.
-- Armazena atributos exclusivos do papel "cliente" que não fazem parte
-- da identidade de autenticação e, portanto, não cabem em usuarios.
--
-- Decisões de modelagem:
--   • Relação 1:1 com usuarios via UNIQUE na FK usu_id.
--   • Só existirá uma linha aqui se o usuário tiver pap_id correspondente a 'cliente'.
--     A integridade é responsabilidade da camada de serviço (GestaoIdentidadeCliente).
--   • Campos opcionais (cli_genero, cli_data_nascimento) admitem NULL: o cadastro
--     mínimo do cliente não obriga esses campos (ICriarClienteMinimoDto).
--   • cli_uuid segue o mesmo contrato de id + uuid das demais tabelas.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_gestao.clientes (
    cli_id              BIGSERIAL   PRIMARY KEY,
    cli_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    usu_id              BIGINT      NOT NULL,
    cli_genero          VARCHAR(30),
    cli_data_nascimento DATE,
    cli_ranking         INTEGER     NOT NULL    DEFAULT 0,
    loj_id              BIGINT,                 -- Multi-tenancy (migration 030)
    cli_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    cli_atualizado_em   TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_clientes_uuid       UNIQUE (cli_uuid),
    CONSTRAINT uq_clientes_usuario    UNIQUE (usu_id),

    CONSTRAINT fk_clientes_usuario
        FOREIGN KEY (usu_id)
        REFERENCES livraria_gestao.usuarios(usu_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE  livraria_gestao.clientes                       IS 'Perfil 1:1 com usuarios, restrito a usuários com papel cliente. Armazena dados complementares não utilizados na autenticação.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_id                IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_uuid              IS 'Identificador público (UUID v4). Retornado nas rotas HTTP quando necessário.';
COMMENT ON COLUMN livraria_gestao.clientes.usu_id                IS 'FK única para usuarios — garante relação 1:1.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_genero            IS 'Gênero autodeclarado pelo cliente (opcional). Sem restrição de domínio para suportar diversidade. RN0026.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_data_nascimento   IS 'Data de nascimento do cliente (opcional). RN0026.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_ranking           IS 'Ranking numérico do cliente baseado no perfil de compra. RN0027. Valor padrão 0.';
COMMENT ON COLUMN livraria_gestao.clientes.loj_id                IS 'FK para lojas (multi-tenancy). Migration 030.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_criado_em         IS 'Timestamp de criação do perfil.';
COMMENT ON COLUMN livraria_gestao.clientes.cli_atualizado_em     IS 'Timestamp da última atualização (mantido via trigger).';

-- Índice para facilitar join por usuario
CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON livraria_gestao.clientes(usu_id);

-- Trigger reutiliza a função genérica criada em 002_criar_tabela_usuario.sql
-- E atualizamos a função para incluir clientes
CREATE OR REPLACE FUNCTION livraria_gestao.fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.cli_atualizado_em = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_clientes_atualizado_em ON livraria_gestao.clientes;
CREATE TRIGGER tg_clientes_atualizado_em
    BEFORE UPDATE ON livraria_gestao.clientes
    FOR EACH ROW
    EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();
