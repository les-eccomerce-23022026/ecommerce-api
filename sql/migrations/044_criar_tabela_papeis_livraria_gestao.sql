-- =============================================================================
-- Migration 044 — Criar tabela papeis no schema livraria_gestao
-- Sistema: LES – E-Commerce de Livros
-- Schema: livraria_gestao
-- Motivo: O setup dos testes tenta inserir dados em livraria_gestao.papeis,
--         mas essa tabela não existe no banco de teste, causando falha e
--         abortando a transação
-- =============================================================================

CREATE TABLE IF NOT EXISTS livraria_gestao.papeis (
    pap_id          SERIAL          PRIMARY KEY,
    pap_descricao   VARCHAR(30)     NOT NULL,
    pap_criado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao)
);

COMMENT ON TABLE  livraria_gestao.papeis                 IS 'Papéis de acesso dos usuários do sistema (schema livraria_gestao).';
COMMENT ON COLUMN livraria_gestao.papeis.pap_id          IS 'Identificador interno do papel (nunca exposto nas rotas).';
COMMENT ON COLUMN livraria_gestao.papeis.pap_descricao   IS 'Nome canônico do papel (ex.: cliente, admin).';
