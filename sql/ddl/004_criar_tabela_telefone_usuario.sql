-- =============================================================================
-- DDL 004 — Tabela de telefones do usuário
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_telefone_usuario
-- Objeto de valor: um usuário pode ter N telefones.
-- O DDD é armazenado separadamente para facilitar validações e formatações.
--
-- Regras de negócio modeladas:
--   • Um usuário pode ter múltiplos telefones, mas somente um flg_principal = TRUE.
--     A constraint uq_telefone_usuario_principal garante isso no banco.
--   • O tipo de telefone é normalizado via FK para ecm_tipo_telefone,
--     eliminando strings como 'celular'/'residencial' diretamente na tabela.
--   • num_ddd: exatamente 2 dígitos. num_telefone: 8 ou 9 dígitos (somente números).
--     Formatação (ex.: (11) 91234-5678) é responsabilidade da camada de apresentação.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_telefone_usuario (
    id_telefone         BIGSERIAL   PRIMARY KEY,
    uuid_telefone       UUID        NOT NULL    DEFAULT gen_random_uuid(),
    id_usuario          BIGINT      NOT NULL,
    id_tipo_telefone    INTEGER     NOT NULL,
    num_ddd             CHAR(2)     NOT NULL,
    num_telefone        VARCHAR(9)  NOT NULL,
    flg_principal       BOOLEAN     NOT NULL    DEFAULT FALSE,
    dat_criacao         TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    dat_atualizacao     TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_telefone_uuid             UNIQUE (uuid_telefone),

    -- Garante que um usuário não registre o mesmo número duas vezes
    CONSTRAINT uq_telefone_usuario_numero   UNIQUE (id_usuario, num_ddd, num_telefone),

    -- Garante que somente um telefone por usuário seja marcado como principal
    CONSTRAINT uq_telefone_usuario_principal
        EXCLUDE USING btree (id_usuario WITH =)
        WHERE (flg_principal = TRUE),

    -- Validação de formato: apenas dígitos em DDD e número
    CONSTRAINT ck_telefone_ddd_numerico
        CHECK (num_ddd ~ '^[0-9]{2}$'),

    CONSTRAINT ck_telefone_numero_numerico
        CHECK (num_telefone ~ '^[0-9]{8,9}$'),

    CONSTRAINT fk_telefone_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES ecm_usuario (id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_telefone_tipo
        FOREIGN KEY (id_tipo_telefone)
        REFERENCES ecm_tipo_telefone (id_tipo_telefone)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE  ecm_telefone_usuario                   IS 'Objetos de valor de telefone vinculados a um usuário. Um usuário pode ter N telefones, mas apenas um principal.';
COMMENT ON COLUMN ecm_telefone_usuario.id_telefone       IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN ecm_telefone_usuario.uuid_telefone     IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';
COMMENT ON COLUMN ecm_telefone_usuario.id_usuario        IS 'FK para ecm_usuario — dono do telefone.';
COMMENT ON COLUMN ecm_telefone_usuario.id_tipo_telefone  IS 'FK para ecm_tipo_telefone (celular, residencial, comercial…).';
COMMENT ON COLUMN ecm_telefone_usuario.num_ddd           IS 'Código DDD de 2 dígitos (somente números).';
COMMENT ON COLUMN ecm_telefone_usuario.num_telefone      IS 'Número local com 8 ou 9 dígitos (somente números, sem formatação).';
COMMENT ON COLUMN ecm_telefone_usuario.flg_principal     IS 'TRUE indica que este é o telefone de contato principal do usuário.';
COMMENT ON COLUMN ecm_telefone_usuario.dat_criacao       IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN ecm_telefone_usuario.dat_atualizacao   IS 'Timestamp da última atualização.';


-- Índices de acesso frequente
CREATE INDEX IF NOT EXISTS idx_telefone_usuario   ON ecm_telefone_usuario (id_usuario);
CREATE INDEX IF NOT EXISTS idx_telefone_uuid      ON ecm_telefone_usuario (uuid_telefone);
CREATE INDEX IF NOT EXISTS idx_telefone_principal ON ecm_telefone_usuario (id_usuario) WHERE flg_principal = TRUE;


-- Trigger de atualização automática de dat_atualizacao
DROP TRIGGER IF EXISTS tg_telefone_usuario_dat_atualizacao ON ecm_telefone_usuario;
CREATE TRIGGER tg_telefone_usuario_dat_atualizacao
    BEFORE UPDATE ON ecm_telefone_usuario
    FOR EACH ROW
    EXECUTE FUNCTION ecm_fn_atualizar_dat_atualizacao();
