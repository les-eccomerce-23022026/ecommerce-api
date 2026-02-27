-- =============================================================================
-- DDL 007 — Tabelas de normalização extra para endereços
-- Sistema: ECM – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_pais
-- Normalização do campo nom_pais para eliminar redundância da string 'Brasil'
-- repetida em todos os endereços. Permite expansão futura para internacionalização.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_pais (
    id_pais     SERIAL      PRIMARY KEY,
    nom_pais    VARCHAR(80) UNIQUE NOT NULL,
    dat_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  ecm_pais         IS 'Países suportados pelo sistema. Inicialmente apenas Brasil.';
COMMENT ON COLUMN ecm_pais.id_pais IS 'Identificador interno do país.';
COMMENT ON COLUMN ecm_pais.nom_pais IS 'Nome completo do país (ex.: Brasil, Estados Unidos).';


-- -----------------------------------------------------------------------------
-- ecm_cep
-- Normalização dos CEPs brasileiros para centralizar dados postais.
-- Um CEP pode servir múltiplos endereços, mas centralizar evita inconsistências.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_cep (
    id_cep      SERIAL      PRIMARY KEY,
    num_cep     CHAR(8)     UNIQUE NOT NULL,
    id_cidade   INTEGER     REFERENCES ecm_cidade(id_cidade) ON UPDATE CASCADE ON DELETE SET NULL,
    id_bairro   INTEGER     REFERENCES ecm_bairro(id_bairro) ON UPDATE CASCADE ON DELETE SET NULL,
    dat_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- CEP deve conter exatamente 8 dígitos numéricos
    CONSTRAINT ck_cep_numerico CHECK (num_cep ~ '^[0-9]{8}$')
);

COMMENT ON TABLE  ecm_cep             IS 'CEPs brasileiros normalizados. Centraliza dados postais e evita duplicação.';
COMMENT ON COLUMN ecm_cep.id_cep      IS 'Identificador interno do CEP.';
COMMENT ON COLUMN ecm_cep.num_cep     IS 'CEP com 8 dígitos numéricos.';
COMMENT ON COLUMN ecm_cep.id_cidade   IS 'FK para ecm_cidade — cidade do CEP.';
COMMENT ON COLUMN ecm_cep.id_bairro   IS 'FK para ecm_bairro — bairro principal do CEP (opcional, pois CEPs abrangem áreas).';


-- -----------------------------------------------------------------------------
-- ecm_logradouro
-- Normalização completa do logradouro (tipo + nome + número) para reusar
-- endereços de rua idênticos entre usuários. Evita duplicação de dados.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_logradouro (
    id_logradouro           SERIAL      PRIMARY KEY,
    id_tipo_logradouro      INTEGER     REFERENCES ecm_tipo_logradouro(id_tipo_logradouro) ON UPDATE CASCADE ON DELETE SET NULL,
    dsc_logradouro          VARCHAR(200) NOT NULL,
    num_logradouro          VARCHAR(10)  NOT NULL,
    dat_criacao             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Garante unicidade do logradouro completo
    CONSTRAINT uq_logradouro_completo UNIQUE (id_tipo_logradouro, dsc_logradouro, num_logradouro)
);

COMMENT ON TABLE  ecm_logradouro                     IS 'Logradouros normalizados (tipo + nome + número). Permite reusar endereços de rua idênticos.';
COMMENT ON COLUMN ecm_logradouro.id_logradouro       IS 'Identificador interno do logradouro.';
COMMENT ON COLUMN ecm_logradouro.id_tipo_logradouro  IS 'FK para ecm_tipo_logradouro (Rua, Avenida…).';
COMMENT ON COLUMN ecm_logradouro.dsc_logradouro      IS 'Nome do logradouro sem o tipo.';
COMMENT ON COLUMN ecm_logradouro.num_logradouro      IS 'Número do imóvel.';