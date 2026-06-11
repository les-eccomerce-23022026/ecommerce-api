-- Migration: Criar tabela de padrões de validação de IA
-- Descrição: Persiste os padrões determinísticos de bloqueio (blacklist e impossíveis)
--            e registra padrões aprendidos automaticamente pelo classificador LLM,
--            eliminando a necessidade de redeploy para adicionar novos padrões.
-- Relacionado à: Entrega 9 - IA de Recomendação com Aprendizado Automático

BEGIN;

CREATE TABLE IF NOT EXISTS livraria_comercial.padroes_validacao_ia (
    pai_id          BIGSERIAL PRIMARY KEY,
    pai_uuid        UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    pai_padrao      VARCHAR(500) NOT NULL,
    pai_tipo        VARCHAR(50)  NOT NULL,
    pai_origem      VARCHAR(50)  NOT NULL DEFAULT 'estatico',
    pai_ocorrencias INTEGER      NOT NULL DEFAULT 1,
    pai_ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    pai_criado_em   TIMESTAMPTZ           DEFAULT CURRENT_TIMESTAMP,
    pai_atualizado_em TIMESTAMPTZ         DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_padroes_validacao_ia_padrao UNIQUE (pai_padrao),
    CONSTRAINT ck_padroes_validacao_ia_tipo
        CHECK (pai_tipo IN ('blacklist', 'impossivel')),
    CONSTRAINT ck_padroes_validacao_ia_origem
        CHECK (pai_origem IN ('estatico', 'llm_aprendizado', 'manual'))
);

CREATE INDEX idx_padroes_validacao_ia_tipo
    ON livraria_comercial.padroes_validacao_ia(pai_tipo);
CREATE INDEX idx_padroes_validacao_ia_ativo
    ON livraria_comercial.padroes_validacao_ia(pai_ativo);
CREATE INDEX idx_padroes_validacao_ia_origem
    ON livraria_comercial.padroes_validacao_ia(pai_origem);

COMMENT ON TABLE livraria_comercial.padroes_validacao_ia
    IS 'Padrões determinísticos de bloqueio da validação de segurança da IA. '
       'Inclui seed estático e padrões aprendidos automaticamente pelo classificador LLM.';
COMMENT ON COLUMN livraria_comercial.padroes_validacao_ia.pai_padrao
    IS 'Texto do padrão em minúsculas, comparado por substring na query do usuário.';
COMMENT ON COLUMN livraria_comercial.padroes_validacao_ia.pai_tipo
    IS 'blacklist = injeção de prompt / bypass; impossivel = contexto absurdo/fora do domínio.';
COMMENT ON COLUMN livraria_comercial.padroes_validacao_ia.pai_origem
    IS 'estatico = seed inicial do código; llm_aprendizado = detectado pelo Gemini; manual = inserido por admin.';
COMMENT ON COLUMN livraria_comercial.padroes_validacao_ia.pai_ocorrencias
    IS 'Contador de vezes que este padrão foi detectado em queries reais.';

COMMIT;
