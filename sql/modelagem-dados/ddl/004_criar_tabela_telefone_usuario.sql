-- =============================================================================
-- DDL 004 — Tabela de telefones do usuário
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_gestao
-- =============================================================================

-- -----------------------------------------------------------------------------
-- tel_telefones
-- Objeto de valor: um usuário pode ter N telefones.
-- O DDD é armazenado separadamente para facilitar validações e formatações.
--
-- Regras de negócio modeladas:
--   • Um usuário pode ter múltiplos telefones, mas somente um tel_principal = TRUE.
--     A constraint uq_telefones_usuario_principal garante isso no banco.
--   • O tipo de telefone é normalizado via FK para ttp_tipos_telefones,
--     eliminando strings como 'celular'/'residencial' diretamente na tabela.
--   • tel_ddd: exatamente 2 dígitos. tel_numero: 8 ou 9 dígitos (somente números).
--     Formatação (ex.: (11) 91234-5678) é responsabilidade da camada de apresentação.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_gestao.telefones (
    tel_id              BIGSERIAL   PRIMARY KEY,
    tel_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    usu_id              BIGINT      NOT NULL,
    ttp_id              INTEGER     NOT NULL,
    tel_ddd             CHAR(2)     NOT NULL,
    tel_numero          VARCHAR(9)  NOT NULL,
    tel_principal       BOOLEAN     NOT NULL    DEFAULT FALSE,
    tel_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    tel_atualizado_em   TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_telefones_uuid             UNIQUE (tel_uuid),

    -- Garante que um usuário não registre o mesmo número duas vezes
    CONSTRAINT uq_telefones_usuario_numero   UNIQUE (usu_id, tel_ddd, tel_numero),

    -- Garante que somente um telefone por usuário seja marcado como principal
    CONSTRAINT uq_telefones_usuario_principal
        EXCLUDE USING btree (usu_id WITH =)
        WHERE (tel_principal = TRUE),

    -- Validação de formato: apenas dígitos em DDD e número
    CONSTRAINT ck_telefones_ddd_numerico
        CHECK (tel_ddd ~ '^[0-9]{2}$'),

    CONSTRAINT ck_telefones_numero_numerico
        CHECK (tel_numero ~ '^[0-9]{8,9}$'),

    CONSTRAINT fk_telefones_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE,
    CONSTRAINT fk_telefones_tipo FOREIGN KEY (ttp_id) REFERENCES livraria_ref.tipos_telefones(ttp_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  livraria_gestao.telefones                   IS 'Objetos de valor de telefone vinculados a um usuário. Um usuário pode ter N telefones, mas apenas um principal.';
COMMENT ON COLUMN livraria_gestao.telefones.tel_id            IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN livraria_gestao.telefones.tel_uuid          IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';
COMMENT ON COLUMN livraria_gestao.telefones.usu_id            IS 'FK para usuarios — dono do telefone.';
COMMENT ON COLUMN livraria_gestao.telefones.ttp_id            IS 'FK para tipos_telefones (celular, residencial, comercial…).';
COMMENT ON COLUMN livraria_gestao.telefones.tel_ddd           IS 'Código DDD de 2 dígitos (somente números).';
COMMENT ON COLUMN livraria_gestao.telefones.tel_numero        IS 'Número local com 8 ou 9 dígitos (somente números, sem formatação).';
COMMENT ON COLUMN livraria_gestao.telefones.tel_principal     IS 'TRUE indica que este é o telefone de contato principal do usuário.';
COMMENT ON COLUMN livraria_gestao.telefones.tel_criado_em      IS 'Timestamp de criação do telefone.';
COMMENT ON COLUMN livraria_gestao.telefones.tel_atualizado_em  IS 'Timestamp da última atualização (mantido via trigger).';


-- -----------------------------------------------------------------------------
-- Índices de busca frequente
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_telefones_usuario ON livraria_gestao.telefones(usu_id);
CREATE INDEX IF NOT EXISTS idx_telefones_tipo ON livraria_gestao.telefones(ttp_id);


-- -----------------------------------------------------------------------------
-- Trigger: atualiza tel_atualizado_em automaticamente em cada UPDATE
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tg_telefones_atualizado_em ON livraria_gestao.telefones;
CREATE TRIGGER tg_telefones_atualizado_em
    BEFORE UPDATE ON livraria_gestao.telefones
    FOR EACH ROW
    EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();

CREATE OR REPLACE FUNCTION livraria_gestao.fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_telefones_atualizado_em ON livraria_gestao.telefones;
CREATE TRIGGER tg_telefones_atualizado_em
    BEFORE UPDATE ON livraria_gestao.telefones
    FOR EACH ROW
    EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();
