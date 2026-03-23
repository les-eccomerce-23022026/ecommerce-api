-- =============================================================================
-- DDL 002 — Tabela principal de usuários
-- Sistema: LES – E-Commerce de Livros
-- Convenção de colunas:
--   usu_id             → chave primária interna (BIGSERIAL) — nunca exposta nas rotas HTTP
--   usu_uuid           → identificador público (UUID)       — único valor exposto nas rotas
--   usu_nome           → nome próprio de pessoa
--   usu_email          → valor textual descritivo (e-mail)
--   usu_cpf            → valor textual descritivo (CPF)
--   usu_senha_hash     → valor textual descritivo (hash de senha)
--   pap_id             → chave estrangeira quando referência a outra tabela (papeis)
--   usu_ativo          → booleano / flag
--   usu_criado_em      → data ou timestamp com fuso horário
--   usu_atualizado_em  → data ou timestamp com fuso horário
-- =============================================================================

--
-- Decisões de modelagem:
--   • usu_id é BIGSERIAL — chave interna usada em JOINs. Nunca retornado
--     pelas rotas HTTP para evitar enumeração.
--   • usu_uuid é gerado pelo banco (gen_random_uuid()) e é o único campo
--     de identidade exposto externamente.
--   • usu_cpf armazena o CPF formatado (XXX.XXX.XXX-XX), pois a aplicação
--     já recebe/exibe nesse formato; a comparação é sempre por string exata.
--   • usu_senha_hash nunca retorna para a camada HTTP: o serviço de auth deve
--     ler apenas via repositório interno.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    usu_id              BIGSERIAL       PRIMARY KEY,
    usu_uuid            UUID            NOT NULL    DEFAULT gen_random_uuid(),
    usu_nome            VARCHAR(80)     NOT NULL,
    usu_email           VARCHAR(255)    NOT NULL,
    usu_cpf             CHAR(14)        NOT NULL,
    usu_senha_hash      VARCHAR(100)    NOT NULL,
    pap_id              INTEGER         NOT NULL,
    usu_telefone_rapido VARCHAR(15),
    usu_genero          VARCHAR(20),
    usu_data_nascimento DATE,
    usu_ativo           BOOLEAN         NOT NULL    DEFAULT TRUE,
    usu_criado_em       TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    usu_atualizado_em   TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_usuarios_uuid          UNIQUE (usu_uuid),
    CONSTRAINT uq_usuarios_email         UNIQUE (usu_email),
    CONSTRAINT uq_usuarios_cpf           UNIQUE (usu_cpf),

    CONSTRAINT fk_usuarios_papeis
        FOREIGN KEY (pap_id)
        REFERENCES papeis (pap_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE  usuarios                  IS 'Entidade central de identidade: todo ator autenticado (cliente ou admin) possui exatamente um registro aqui.';
COMMENT ON COLUMN usuarios.usu_id           IS 'Chave primária interna (BIGSERIAL). Usada apenas em JOINs internos; nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN usuarios.usu_uuid         IS 'Identificador público (UUID v4). Único campo de identidade retornado pelas rotas HTTP.';
COMMENT ON COLUMN usuarios.usu_nome         IS 'Nome completo do usuário.';
COMMENT ON COLUMN usuarios.usu_email        IS 'Endereço de e-mail único utilizado como login.';
COMMENT ON COLUMN usuarios.usu_cpf          IS 'CPF no formato XXX.XXX.XXX-XX. Único por usuário.';
COMMENT ON COLUMN usuarios.usu_senha_hash   IS 'Hash bcrypt da senha. Nunca retornado pela API.';
COMMENT ON COLUMN usuarios.pap_id           IS 'FK para papeis — define se o usuário é cliente ou admin.';
COMMENT ON COLUMN usuarios.usu_ativo        IS 'FALSE indica inativação (soft delete). RF0023.';
COMMENT ON COLUMN usuarios.usu_criado_em    IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN usuarios.usu_atualizado_em IS 'Timestamp da última atualização (atualizado via trigger ou aplicação).';


-- -----------------------------------------------------------------------------
-- Índices de busca frequente
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- Trigger: atualiza usu_atualizado_em automaticamente em cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    -- Outras tabelas serão adicionadas conforme criadas
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_usuarios_atualizado_em ON usuarios;
CREATE TRIGGER tg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();
