-- =============================================================================
-- DDL 005 — Tabela de endereços do usuário
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- end_enderecos
-- Objeto de valor: um usuário pode ter N endereços cadastrados.
-- Todas as colunas textuais foram normalizadas em tabelas separadas para
-- eliminar redundância e garantir consistência de dados.
--
-- Decisões de modelagem:
--   • Campos textuais (cidade, bairro, país, CEP, logradouro) foram movidos
--     para tabelas normalizadas (cid_cidades, bai_bairros, pai_paises, cep_ceps, log_logradouros)
--     para evitar duplicação e inconsistências.
--   • tre_id permanece como FK opcional para compatibilidade.
--   • Apenas um endereço por usuário pode ser end_principal = TRUE.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enderecos (
    end_id                  BIGSERIAL       PRIMARY KEY,
    end_uuid                UUID            NOT NULL    DEFAULT gen_random_uuid(),
    usu_id                  BIGINT          NOT NULL,
    end_tipo                VARCHAR(20)     NOT NULL    DEFAULT 'entrega',
    end_apelido             VARCHAR(50),
    tre_id                  INTEGER,
    log_id                  INTEGER,
    end_numero              VARCHAR(10)     NOT NULL,
    end_complemento         VARCHAR(100),
    cid_id                  INTEGER,
    bai_id                  INTEGER,
    cep_id                  INTEGER,
    pai_id                  INTEGER         NOT NULL    DEFAULT 1, -- 1 = Brasil
    end_principal           BOOLEAN         NOT NULL    DEFAULT FALSE,
    end_criado_em           TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    end_atualizado_em       TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    -- RN0021/RN0022: cobrança ou entrega
    CONSTRAINT ck_enderecos_tipo CHECK (end_tipo IN ('cobranca', 'entrega')),

    CONSTRAINT uq_enderecos_uuid UNIQUE (end_uuid),

    -- Apenas um endereço principal por usuário
    CONSTRAINT uq_enderecos_usuario_principal
        EXCLUDE USING btree (usu_id WITH =)
        WHERE (end_principal = TRUE),

    CONSTRAINT fk_enderecos_usuarios
        FOREIGN KEY (usu_id)
        REFERENCES usuarios (usu_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_enderecos_tipos_residencias
        FOREIGN KEY (tre_id)
        REFERENCES tipos_residencias (tre_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_logradouros
        FOREIGN KEY (log_id)
        REFERENCES logradouros (log_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_cidades
        FOREIGN KEY (cid_id)
        REFERENCES cidades (cid_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_bairros
        FOREIGN KEY (bai_id)
        REFERENCES bairros (bai_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_ceps
        FOREIGN KEY (cep_id)
        REFERENCES ceps (cep_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_paises
        FOREIGN KEY (pai_id)
        REFERENCES paises (pai_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

COMMENT ON TABLE  enderecos                        IS 'Endereços vinculados a um usuário. Um usuário pode ter N endereços, mas apenas um principal. Todos os componentes do endereço são normalizados em tabelas separadas.';
COMMENT ON COLUMN enderecos.end_id                IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN enderecos.end_uuid              IS 'Identificador público (UUID v4). Retornado pelas rotas HTTP.';
COMMENT ON COLUMN enderecos.usu_id                IS 'FK para usuarios — proprietário do endereço.';
COMMENT ON COLUMN enderecos.end_tipo              IS 'Tipo do endereço: cobranca ou entrega. RN0021/RN0022. Padrão: entrega.';
COMMENT ON COLUMN enderecos.end_apelido           IS 'Apelido customizado do endereço (ex: Casa, Trabalho).';
COMMENT ON COLUMN enderecos.tre_id                IS 'FK para tipos_residencias (Casa, Apartamento…). Opcional.';
COMMENT ON COLUMN enderecos.log_id                IS 'FK para logradouros — logradouro (tipo + nome).';
COMMENT ON COLUMN enderecos.end_numero            IS 'Número do imóvel no logradouro.';
COMMENT ON COLUMN enderecos.end_complemento       IS 'Complemento opcional (ex.: apto 42, bloco B).';
COMMENT ON COLUMN enderecos.cid_id                IS 'FK para cidades — cidade do endereço.';
COMMENT ON COLUMN enderecos.bai_id                IS 'FK para bairros — bairro do endereço.';
COMMENT ON COLUMN enderecos.cep_id                IS 'FK para ceps — CEP do endereço.';
COMMENT ON COLUMN enderecos.pai_id                IS 'FK para paises — país do endereço (padrão: Brasil).';
COMMENT ON COLUMN enderecos.end_principal         IS 'TRUE indica que este é o endereço de entrega padrão do usuário.';
COMMENT ON COLUMN enderecos.end_criado_em         IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN enderecos.end_atualizado_em     IS 'Timestamp da última atualização.';


-- Índices de acesso frequente
CREATE INDEX IF NOT EXISTS idx_enderecos_usuario   ON enderecos (usu_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_logradouro ON enderecos (log_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cidade    ON enderecos (cid_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_bairro    ON enderecos (bai_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cep       ON enderecos (cep_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_principal ON enderecos (usu_id) WHERE end_principal = TRUE;


-- Trigger de atualização automática de end_atualizado_em
-- E atualizamos a função para incluir enderecos
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'enderecos' THEN NEW.end_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enderecos_atualizado_em ON enderecos;
CREATE TRIGGER tg_enderecos_atualizado_em
    BEFORE UPDATE ON enderecos
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();
