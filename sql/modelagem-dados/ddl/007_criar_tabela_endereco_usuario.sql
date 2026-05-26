-- =============================================================================
-- DDL 007 — Tabela de endereços do usuário
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_gestao
-- =============================================================================

CREATE TABLE IF NOT EXISTS livraria_gestao.enderecos (
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
    cep_id                  CHAR(8),
    pai_id                  INTEGER         NOT NULL    DEFAULT 1, -- 1 = Brasil
    loj_id                  BIGINT,                 -- Multi-tenancy (migration 030)
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
        REFERENCES livraria_gestao.usuarios (usu_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_enderecos_tipos_residencias
        FOREIGN KEY (tre_id)
        REFERENCES livraria_ref.tipos_residencias (tre_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_logradouros
        FOREIGN KEY (log_id)
        REFERENCES livraria_ref.logradouros (log_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_cidades
        FOREIGN KEY (cid_id)
        REFERENCES livraria_ref.cidades (cid_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_bairros
        FOREIGN KEY (bai_id)
        REFERENCES livraria_ref.bairros (bai_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_ceps
        FOREIGN KEY (cep_id)
        REFERENCES livraria_ref.ceps (cep_numero)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_enderecos_paises
        FOREIGN KEY (pai_id)
        REFERENCES livraria_ref.paises (pai_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

COMMENT ON TABLE  livraria_gestao.enderecos                        IS 'Endereços vinculados a um usuário. Um usuário pode ter N endereços, mas apenas um principal. Todos os componentes do endereço são normalizados em tabelas separadas.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_id                IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_uuid              IS 'Identificador público (UUID v4). Retornado pelas rotas HTTP.';
COMMENT ON COLUMN livraria_gestao.enderecos.usu_id                IS 'FK para usuarios — proprietário do endereço.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_tipo              IS 'Tipo do endereço: cobranca ou entrega. RN0021/RN0022. Padrão: entrega.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_apelido           IS 'Apelido customizado do endereço (ex: Casa, Trabalho).';
COMMENT ON COLUMN livraria_gestao.enderecos.tre_id                IS 'FK para tipos_residencias (Casa, Apartamento…). Opcional.';
COMMENT ON COLUMN livraria_gestao.enderecos.log_id                IS 'FK para logradouros — logradouro (tipo + nome).';
COMMENT ON COLUMN livraria_gestao.enderecos.end_numero            IS 'Número do imóvel no logradouro.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_complemento       IS 'Complemento opcional (ex.: apto 42, bloco B).';
COMMENT ON COLUMN livraria_gestao.enderecos.cid_id                IS 'FK para cidades — cidade do endereço.';
COMMENT ON COLUMN livraria_gestao.enderecos.bai_id                IS 'FK para bairros — bairro do endereço.';
COMMENT ON COLUMN livraria_gestao.enderecos.cep_id                IS 'FK para ceps — CEP do endereço (8 dígitos, sem formatação).';
COMMENT ON COLUMN livraria_gestao.enderecos.pai_id                IS 'FK para paises — país do endereço (padrão: Brasil).';
COMMENT ON COLUMN livraria_gestao.enderecos.loj_id                IS 'FK para lojas (multi-tenancy). Migration 030.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_principal         IS 'TRUE indica que este é o endereço de entrega padrão do usuário.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_criado_em         IS 'Timestamp de criação do registro.';
COMMENT ON COLUMN livraria_gestao.enderecos.end_atualizado_em     IS 'Timestamp da última atualização.';


-- Índices de acesso frequente
CREATE INDEX IF NOT EXISTS idx_enderecos_usuario   ON livraria_gestao.enderecos (usu_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_logradouro ON livraria_gestao.enderecos (log_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cidade    ON livraria_gestao.enderecos (cid_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_bairro    ON livraria_gestao.enderecos (bai_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cep       ON livraria_gestao.enderecos (cep_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_principal ON livraria_gestao.enderecos (usu_id) WHERE end_principal = TRUE;


-- Trigger de atualização automática de end_atualizado_em
DROP TRIGGER IF EXISTS tg_enderecos_atualizado_em ON livraria_gestao.enderecos;
CREATE TRIGGER tg_enderecos_atualizado_em
    BEFORE UPDATE ON livraria_gestao.enderecos
    FOR EACH ROW
    EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();
