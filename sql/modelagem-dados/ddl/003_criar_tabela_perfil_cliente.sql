-- =============================================================================
-- DDL 003 — Tabela de perfil do cliente
-- Sistema: LES – E-Commerce de Livros
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
CREATE TABLE IF NOT EXISTS clientes (
    cli_id              BIGSERIAL   PRIMARY KEY,
    cli_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    usu_id              BIGINT      NOT NULL,
    cli_genero          VARCHAR(30),
    cli_data_nascimento DATE,
    cli_ranking         INTEGER     NOT NULL    DEFAULT 0,
    cli_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    cli_atualizado_em   TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_clientes_uuid       UNIQUE (cli_uuid),
    CONSTRAINT uq_clientes_usuario    UNIQUE (usu_id),

    CONSTRAINT fk_clientes_usuarios
        FOREIGN KEY (usu_id)
        REFERENCES usuarios (usu_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE  clientes                       IS 'Perfil 1:1 com usuarios, restrito a usuários com papel cliente. Armazena dados complementares não utilizados na autenticação.';
COMMENT ON COLUMN clientes.cli_id                IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN clientes.cli_uuid              IS 'Identificador público (UUID v4). Retornado nas rotas HTTP quando necessário.';
COMMENT ON COLUMN clientes.usu_id                IS 'FK única para usuarios — garante relação 1:1.';
COMMENT ON COLUMN clientes.cli_genero            IS 'Gênero autodeclarado pelo cliente (opcional). Sem restrição de domínio para suportar diversidade. RN0026.';
COMMENT ON COLUMN clientes.cli_data_nascimento   IS 'Data de nascimento do cliente (opcional). RN0026.';
COMMENT ON COLUMN clientes.cli_ranking           IS 'Ranking numérico do cliente baseado no perfil de compra. RN0027. Valor padrão 0.';
COMMENT ON COLUMN clientes.cli_criado_em         IS 'Timestamp de criação do perfil.';
COMMENT ON COLUMN clientes.cli_atualizado_em     IS 'Timestamp da última atualização (mantido via trigger).';


-- Índice para facilitar join por usuario


-- Trigger reutiliza a função genérica criada em 002_criar_tabela_usuario.sql
-- E atualizamos a função para incluir clientes
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_clientes_atualizado_em ON clientes;
CREATE TRIGGER tg_clientes_atualizado_em
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();
