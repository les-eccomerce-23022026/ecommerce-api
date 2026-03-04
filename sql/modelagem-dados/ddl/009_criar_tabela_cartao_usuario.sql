-- =============================================================================
-- DDL 008 — Tabela de cartões de crédito do usuário
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_cartao_usuario
-- Objeto de valor: um usuário pode ter N cartões de crédito cadastrados.
-- Por segurança, apenas o token do cartão é armazenado (nunca dados sensíveis).
--
-- Decisões de modelagem:
--   • Apenas um cartão por usuário pode ser flg_principal = TRUE.
--   • dsc_token_cartao: token retornado pela operadora (nunca o número real).
--   • dsc_final_cartao: últimos 4 dígitos para identificação (ex.: ****1234).
--   • dsc_nome_impresso: nome como aparece no cartão.
--   • dsc_bandeira: normalizada via FK para ecm_bandeira_cartao.
--   • dat_validade: mês/ano de validade do cartão.
--   • CVV nunca é armazenado (RN0024).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_cartao_usuario (
    id_cartao           BIGSERIAL   PRIMARY KEY,
    uuid_cartao         UUID        NOT NULL    DEFAULT gen_random_uuid(),
    id_usuario          BIGINT      NOT NULL,
    id_bandeira_cartao  INTEGER     NOT NULL,
    dsc_token_cartao    VARCHAR(255) NOT NULL,
    dsc_final_cartao    CHAR(4)     NOT NULL,
    dsc_nome_impresso   VARCHAR(50) NOT NULL,
    dat_validade        DATE        NOT NULL,
    flg_principal       BOOLEAN     NOT NULL    DEFAULT FALSE,
    dat_criacao         TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    dat_atualizacao     TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_cartao_uuid UNIQUE (uuid_cartao),

    -- Garante que um usuário não registre o mesmo token duas vezes
    CONSTRAINT uq_cartao_usuario_token UNIQUE (id_usuario, dsc_token_cartao),

    -- Apenas um cartão principal por usuário
    CONSTRAINT uq_cartao_usuario_principal
        EXCLUDE USING btree (id_usuario WITH =)
        WHERE (flg_principal = TRUE),

    -- Validação de formato: final do cartão são exatamente 4 dígitos
    CONSTRAINT ck_cartao_final_numerico
        CHECK (dsc_final_cartao ~ '^[0-9]{4}$'),

    CONSTRAINT fk_cartao_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES ecm_usuario (id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_cartao_bandeira
        FOREIGN KEY (id_bandeira_cartao)
        REFERENCES ecm_bandeira_cartao (id_bandeira_cartao)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE  ecm_cartao_usuario                    IS 'Cartões de crédito cadastrados pelos usuários. Apenas token é armazenado por segurança.';
COMMENT ON COLUMN ecm_cartao_usuario.id_cartao         IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN ecm_cartao_usuario.uuid_cartao       IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';
COMMENT ON COLUMN ecm_cartao_usuario.id_usuario        IS 'FK para ecm_usuario.';
COMMENT ON COLUMN ecm_cartao_usuario.id_bandeira_cartao IS 'FK para ecm_bandeira_cartao — bandeira do cartão.';
COMMENT ON COLUMN ecm_cartao_usuario.dsc_token_cartao  IS 'Token do cartão retornado pela operadora. Nunca o número real.';
COMMENT ON COLUMN ecm_cartao_usuario.dsc_final_cartao  IS 'Últimos 4 dígitos do cartão para identificação (ex.: 1234).';
COMMENT ON COLUMN ecm_cartao_usuario.dsc_nome_impresso IS 'Nome como aparece impresso no cartão.';
COMMENT ON COLUMN ecm_cartao_usuario.dat_validade      IS 'Data de validade do cartão (mês/ano).';
COMMENT ON COLUMN ecm_cartao_usuario.flg_principal     IS 'TRUE se este é o cartão principal do usuário.';
COMMENT ON COLUMN ecm_cartao_usuario.dat_criacao       IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN ecm_cartao_usuario.dat_atualizacao   IS 'Timestamp da última atualização.';


-- -----------------------------------------------------------------------------
-- Índices de busca frequente
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cartao_usuario     ON ecm_cartao_usuario (id_usuario);
CREATE INDEX IF NOT EXISTS idx_cartao_bandeira    ON ecm_cartao_usuario (id_bandeira_cartao);


-- -----------------------------------------------------------------------------
-- Trigger: atualiza dat_atualizacao automaticamente em cada UPDATE
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tg_cartao_dat_atualizacao ON ecm_cartao_usuario;
CREATE TRIGGER tg_cartao_dat_atualizacao
    BEFORE UPDATE ON ecm_cartao_usuario
    FOR EACH ROW
    EXECUTE FUNCTION ecm_fn_atualizar_dat_atualizacao();