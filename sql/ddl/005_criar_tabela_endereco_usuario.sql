-- =============================================================================
-- DDL 005 — Tabela de endereços do usuário
-- Sistema: ECM – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_endereco_usuario
-- Objeto de valor: um usuário pode ter N endereços cadastrados.
-- Todas as colunas textuais foram normalizadas em tabelas separadas para
-- eliminar redundância e garantir consistência de dados.
--
-- Decisões de modelagem:
--   • Campos textuais (cidade, bairro, país, CEP, logradouro) foram movidos
--     para tabelas normalizadas (ecm_cidade, ecm_bairro, ecm_pais, ecm_cep, ecm_logradouro)
--     para evitar duplicação e inconsistências.
--   • id_tipo_residencia permanece como FK opcional para compatibilidade.
--   • Apenas um endereço por usuário pode ser flg_principal = TRUE.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_endereco_usuario (
    id_endereco             BIGSERIAL       PRIMARY KEY,
    uuid_endereco           UUID            NOT NULL    DEFAULT gen_random_uuid(),
    id_usuario              BIGINT          NOT NULL,
    id_tipo_residencia      INTEGER,
    id_logradouro           INTEGER,
    dsc_complemento         VARCHAR(100),
    id_cidade               INTEGER,
    id_bairro               INTEGER,
    id_cep                  INTEGER,
    id_pais                 INTEGER         NOT NULL    DEFAULT 1, -- 1 = Brasil
    flg_principal           BOOLEAN         NOT NULL    DEFAULT FALSE,
    dat_criacao             TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    dat_atualizacao         TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_endereco_uuid UNIQUE (uuid_endereco),

    -- Apenas um endereço principal por usuário
    CONSTRAINT uq_endereco_usuario_principal
        EXCLUDE USING btree (id_usuario WITH =)
        WHERE (flg_principal = TRUE),

    CONSTRAINT fk_endereco_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES ecm_usuario (id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_endereco_tipo_residencia
        FOREIGN KEY (id_tipo_residencia)
        REFERENCES ecm_tipo_residencia (id_tipo_residencia)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_endereco_logradouro
        FOREIGN KEY (id_logradouro)
        REFERENCES ecm_logradouro (id_logradouro)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_endereco_cidade
        FOREIGN KEY (id_cidade)
        REFERENCES ecm_cidade (id_cidade)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_endereco_bairro
        FOREIGN KEY (id_bairro)
        REFERENCES ecm_bairro (id_bairro)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_endereco_cep
        FOREIGN KEY (id_cep)
        REFERENCES ecm_cep (id_cep)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_endereco_pais
        FOREIGN KEY (id_pais)
        REFERENCES ecm_pais (id_pais)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

COMMENT ON TABLE  ecm_endereco_usuario                        IS 'Endereços vinculados a um usuário. Um usuário pode ter N endereços, mas apenas um principal. Todos os componentes do endereço são normalizados em tabelas separadas.';
COMMENT ON COLUMN ecm_endereco_usuario.id_endereco            IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN ecm_endereco_usuario.uuid_endereco          IS 'Identificador público (UUID v4). Retornado pelas rotas HTTP.';
COMMENT ON COLUMN ecm_endereco_usuario.id_usuario             IS 'FK para ecm_usuario — proprietário do endereço.';
COMMENT ON COLUMN ecm_endereco_usuario.id_tipo_residencia     IS 'FK para ecm_tipo_residencia (Casa, Apartamento…). Opcional.';
COMMENT ON COLUMN ecm_endereco_usuario.id_logradouro          IS 'FK para ecm_logradouro — logradouro completo (tipo + nome + número).';
COMMENT ON COLUMN ecm_endereco_usuario.dsc_complemento        IS 'Complemento opcional (ex.: apto 42, bloco B).';
COMMENT ON COLUMN ecm_endereco_usuario.id_cidade              IS 'FK para ecm_cidade — cidade do endereço.';
COMMENT ON COLUMN ecm_endereco_usuario.id_bairro              IS 'FK para ecm_bairro — bairro do endereço.';
COMMENT ON COLUMN ecm_endereco_usuario.id_cep                 IS 'FK para ecm_cep — CEP do endereço.';
COMMENT ON COLUMN ecm_endereco_usuario.id_pais                IS 'FK para ecm_pais — país do endereço (padrão: Brasil).';
COMMENT ON COLUMN ecm_endereco_usuario.flg_principal          IS 'TRUE indica que este é o endereço de entrega padrão do usuário.';
COMMENT ON COLUMN ecm_endereco_usuario.dat_criacao            IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN ecm_endereco_usuario.dat_atualizacao        IS 'Timestamp da última atualização.';


-- Índices de acesso frequente
CREATE INDEX IF NOT EXISTS idx_endereco_usuario   ON ecm_endereco_usuario (id_usuario);
CREATE INDEX IF NOT EXISTS idx_endereco_uuid      ON ecm_endereco_usuario (uuid_endereco);
CREATE INDEX IF NOT EXISTS idx_endereco_logradouro ON ecm_endereco_usuario (id_logradouro);
CREATE INDEX IF NOT EXISTS idx_endereco_cidade    ON ecm_endereco_usuario (id_cidade);
CREATE INDEX IF NOT EXISTS idx_endereco_bairro    ON ecm_endereco_usuario (id_bairro);
CREATE INDEX IF NOT EXISTS idx_endereco_cep       ON ecm_endereco_usuario (id_cep);
CREATE INDEX IF NOT EXISTS idx_endereco_principal ON ecm_endereco_usuario (id_usuario) WHERE flg_principal = TRUE;


-- Trigger de atualização automática de dat_atualizacao
DROP TRIGGER IF EXISTS tg_endereco_usuario_dat_atualizacao ON ecm_endereco_usuario;
CREATE TRIGGER tg_endereco_usuario_dat_atualizacao
    BEFORE UPDATE ON ecm_endereco_usuario
    FOR EACH ROW
    EXECUTE FUNCTION ecm_fn_atualizar_dat_atualizacao();
