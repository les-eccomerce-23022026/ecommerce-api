-- =============================================================================
-- DDL 009 — Tabela de cartões do usuário
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_financeiro
-- =============================================================================

-- -----------------------------------------------------------------------------
-- crt_cartoes
-- Objeto de valor: um usuário pode ter N cartões de crédito cadastrados.
-- Por segurança, apenas o token do cartão é armazenado (nunca dados sensíveis).
--
-- Decisões de modelagem:
--   • Apenas um cartão por usuário pode ser crt_principal = TRUE.
--   • crt_token: token retornado pela operadora (nunca o número real).
--   • crt_final: últimos 4 dígitos para identificação (ex.: ****1234).
--   • crt_nome_impresso: nome como aparece no cartão.
--   • ban_id: normalizada via FK para ban_bandeiras.
--   • crt_validade: mês/ano de validade do cartão.
--   • CVV nunca é armazenado (RN0024).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livraria_financeiro.cartoes (
    crt_id              BIGSERIAL   PRIMARY KEY,
    crt_uuid            UUID        NOT NULL    DEFAULT gen_random_uuid(),
    usu_id              BIGINT      NOT NULL,
    ban_id              INTEGER     NOT NULL,
    crt_token           VARCHAR(255) NOT NULL,
    crt_final           CHAR(4)     NOT NULL,
    crt_nome_impresso   VARCHAR(50) NOT NULL,
    crt_validade        DATE        NOT NULL,
    crt_principal       BOOLEAN     NOT NULL    DEFAULT FALSE,
    crt_criado_em       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    crt_atualizado_em   TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_cartoes_uuid UNIQUE (crt_uuid),

    -- Garante que um usuário não registre o mesmo token duas vezes
    CONSTRAINT uq_cartoes_usuario_token UNIQUE (usu_id, crt_token),

    -- Apenas um cartão principal por usuário
    CONSTRAINT uq_cartoes_usuario_principal
        EXCLUDE USING btree (usu_id WITH =)
        WHERE (crt_principal = TRUE),

    -- Validação de formato: final do cartão são exatamente 4 dígitos
    CONSTRAINT ck_cartoes_final_numerico
        CHECK (crt_final ~ '^[0-9]{4}$'),

    CONSTRAINT fk_cartoes_usuarios
        FOREIGN KEY (usu_id)
        REFERENCES livraria_gestao.usuarios (usu_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_cartoes_bandeiras
        FOREIGN KEY (ban_id)
        REFERENCES livraria_financeiro.bandeiras_cartao (ban_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE  livraria_financeiro.cartoes                        IS 'Cartões de crédito cadastrados pelos usuários. Apenas token é armazenado por segurança.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_id                IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_uuid              IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';
COMMENT ON COLUMN livraria_financeiro.cartoes.usu_id                IS 'FK para usuarios.';
COMMENT ON COLUMN livraria_financeiro.cartoes.ban_id                IS 'FK para bandeiras_cartao — bandeira do cartão.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_token             IS 'Token do cartão retornado pela operadora. Nunca o número real.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_final             IS 'Últimos 4 dígitos do cartão para identificação (ex.: 1234).';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_nome_impresso     IS 'Nome como aparece impresso no cartão.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_validade          IS 'Data de validade do cartão (mês/ano).';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_principal         IS 'TRUE se este é o cartão principal do usuário.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_criado_em         IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN livraria_financeiro.cartoes.crt_atualizado_em     IS 'Timestamp da última atualização.';


-- -----------------------------------------------------------------------------
-- Índices de busca frequente
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cartoes_usuario     ON livraria_financeiro.cartoes (usu_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_bandeira    ON livraria_financeiro.cartoes (ban_id);


-- -----------------------------------------------------------------------------
-- Trigger: atualiza crt_atualizado_em automaticamente em cada UPDATE
-- -----------------------------------------------------------------------------
-- E atualizamos a função para incluir cartoes
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'enderecos' THEN NEW.end_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'cartoes'   THEN NEW.crt_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_cartoes_atualizado_em ON livraria_financeiro.cartoes;
CREATE TRIGGER tg_cartoes_atualizado_em
    BEFORE UPDATE ON livraria_financeiro.cartoes
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();
