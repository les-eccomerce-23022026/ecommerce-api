-- =============================================================================
-- DDL 002 — Tabela principal de usuários
-- Sistema: LES – E-Commerce de Livros
-- Convenção de colunas:
--   id_    → chave primária interna (BIGSERIAL) — nunca exposta nas rotas HTTP
--   uuid_  → identificador público (UUID)       — único valor exposto nas rotas
--   nom_   → nome próprio de pessoa
--   dsc_   → valor textual descritivo (e-mail, CPF, hash de senha)
--   id_    → chave estrangeira quando referência a outra tabela
--   flg_   → booleano / flag
--   dat_   → data ou timestamp com fuso horário
-- =============================================================================

--
-- Decisões de modelagem:
--   • id_usuario é BIGSERIAL — chave interna usada em JOINs. Nunca retornado
--     pelas rotas HTTP para evitar enumeração.
--   • uuid_usuario é gerado pelo banco (gen_random_uuid()) e é o único campo
--     de identidade exposto externamente.
--   • dsc_cpf armazena o CPF formatado (XXX.XXX.XXX-XX), pois a aplicação
--     já recebe/exibe nesse formato; a comparação é sempre por string exata.
--   • dsc_senha_hash nunca retorna para a camada HTTP: o serviço de auth deve
--     ler apenas via repositório interno.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_usuario (
    id_usuario          BIGSERIAL       PRIMARY KEY,
    uuid_usuario        UUID            NOT NULL    DEFAULT gen_random_uuid(),
    nom_usuario         VARCHAR(150)    NOT NULL,
    dsc_email           VARCHAR(255)    NOT NULL,
    dsc_cpf             CHAR(14)        NOT NULL,
    dsc_senha_hash      VARCHAR(255)    NOT NULL,
    id_papel            INTEGER         NOT NULL,
    flg_ativo           BOOLEAN         NOT NULL    DEFAULT TRUE,
    dat_criacao         TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    dat_atualizacao     TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_usuario_uuid          UNIQUE (uuid_usuario),
    CONSTRAINT uq_usuario_email         UNIQUE (dsc_email),
    CONSTRAINT uq_usuario_cpf           UNIQUE (dsc_cpf),

    CONSTRAINT fk_usuario_papel
        FOREIGN KEY (id_papel)
        REFERENCES ecm_papel_usuario (id_papel)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE  ecm_usuario                  IS 'Entidade central de identidade: todo ator autenticado (cliente ou admin) possui exatamente um registro aqui.';
COMMENT ON COLUMN ecm_usuario.id_usuario       IS 'Chave primária interna (BIGSERIAL). Usada apenas em JOINs internos; nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN ecm_usuario.uuid_usuario     IS 'Identificador público (UUID v4). Único campo de identidade retornado pelas rotas HTTP.';
COMMENT ON COLUMN ecm_usuario.nom_usuario      IS 'Nome completo do usuário.';
COMMENT ON COLUMN ecm_usuario.dsc_email        IS 'Endereço de e-mail único utilizado como login.';
COMMENT ON COLUMN ecm_usuario.dsc_cpf          IS 'CPF no formato XXX.XXX.XXX-XX. Único por usuário.';
COMMENT ON COLUMN ecm_usuario.dsc_senha_hash   IS 'Hash bcrypt da senha. Nunca retornado pela API.';
COMMENT ON COLUMN ecm_usuario.id_papel         IS 'FK para ecm_papel_usuario — define se o usuário é cliente ou admin.';
COMMENT ON COLUMN ecm_usuario.flg_ativo        IS 'FALSE indica inativação (soft delete). RF0023.';
COMMENT ON COLUMN ecm_usuario.dat_criacao      IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN ecm_usuario.dat_atualizacao  IS 'Timestamp da última atualização (atualizado via trigger ou aplicação).';


-- -----------------------------------------------------------------------------
-- Índices de busca frequente
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuario_email  ON ecm_usuario (dsc_email);
CREATE INDEX IF NOT EXISTS idx_usuario_cpf    ON ecm_usuario (dsc_cpf);
CREATE INDEX IF NOT EXISTS idx_usuario_uuid   ON ecm_usuario (uuid_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_papel  ON ecm_usuario (id_papel);


-- -----------------------------------------------------------------------------
-- Trigger: atualiza dat_atualizacao automaticamente em cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ecm_fn_atualizar_dat_atualizacao()
RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
BEGIN
    NEW.dat_atualizacao := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_usuario_dat_atualizacao ON ecm_usuario;
CREATE TRIGGER tg_usuario_dat_atualizacao
    BEFORE UPDATE ON ecm_usuario
    FOR EACH ROW
    EXECUTE FUNCTION ecm_fn_atualizar_dat_atualizacao();
