-- =============================================================================
-- DDL 007 — Tabelas de normalização extra para endereços
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- pai_paises
-- Normalização do campo pai_nome para eliminar redundância da string 'Brasil'
-- repetida em todos os endereços. Permite expansão futura para internacionalização.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paises (
    pai_id        SERIAL      PRIMARY KEY,
    pai_nome      VARCHAR(80) UNIQUE NOT NULL,
    pai_criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  paises         IS 'Países suportados pelo sistema. Inicialmente apenas Brasil.';
COMMENT ON COLUMN paises.pai_id  IS 'Identificador interno do país.';
COMMENT ON COLUMN paises.pai_nome IS 'Nome completo do país (ex.: Brasil, Estados Unidos).';


-- -----------------------------------------------------------------------------
-- ceps
-- Normalização dos CEPs brasileiros para centralizar dados postais.
-- Um CEP pode servir múltiplos endereços, mas centralizar evita inconsistências.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ceps (
    cep_id        SERIAL      PRIMARY KEY,
    cep_numero    CHAR(8)     UNIQUE NOT NULL,
    cid_id        INTEGER     REFERENCES cidades(cid_id) ON UPDATE CASCADE ON DELETE SET NULL,
    bai_id        INTEGER     REFERENCES bairros(bai_id) ON UPDATE CASCADE ON DELETE SET NULL,
    cep_criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- CEP deve conter exatamente 8 dígitos numéricos
    CONSTRAINT ck_ceps_numero_numerico CHECK (cep_numero ~ '^[0-9]{8}$')
);

COMMENT ON TABLE  ceps             IS 'CEPs brasileiros normalizados. Centraliza dados postais e evita duplicação.';
COMMENT ON COLUMN ceps.cep_id      IS 'Identificador interno do CEP.';
COMMENT ON COLUMN ceps.cep_numero  IS 'CEP com 8 dígitos numéricos.';
COMMENT ON COLUMN ceps.cid_id      IS 'FK para cidades — cidade do CEP.';
COMMENT ON COLUMN ceps.bai_id      IS 'FK para bairros — bairro principal do CEP (opcional, pois CEPs abrangem áreas).';


-- -----------------------------------------------------------------------------
-- logradouros
-- Normalização completa do logradouro (tipo + nome) para reusar
-- endereços de rua idênticos entre usuários. Evita duplicação de dados.
-- Nota: O número foi movido para a tabela de endereços na migração 006 final.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logradouros (
    log_id              SERIAL      PRIMARY KEY,
    tlo_id              INTEGER     REFERENCES tipos_logradouros(tlo_id) ON UPDATE CASCADE ON DELETE SET NULL,
    log_nome            VARCHAR(200) NOT NULL,
    log_criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Garante unicidade do logradouro completo
    CONSTRAINT uq_logradouros_completo UNIQUE (tlo_id, log_nome)
);

COMMENT ON TABLE  logradouros                    IS 'Logradouros normalizados (tipo + nome). Permite reusar endereços de rua idênticos.';
COMMENT ON COLUMN logradouros.log_id             IS 'Identificador interno do logradouro.';
COMMENT ON COLUMN logradouros.tlo_id             IS 'FK para tipos_logradouros (Rua, Avenida…).';
COMMENT ON COLUMN logradouros.log_nome           IS 'Nome do logradouro sem o tipo.';
