-- Migration: 040_criar_tabela_usuario_papeis.sql
-- Descrição: Criar tabela de relacionamento N:M entre usuarios e papeis
-- Contexto: Gestão de Identidade - Suporta múltiplos papéis por usuário (ex: admin pode ter papéis de diferentes lojas)
-- Schema: livraria_gestao

-- Criar tabela usuario_papeis (relacionamento N:M entre usuarios e papeis)
CREATE TABLE IF NOT EXISTS livraria_gestao.usuario_papeis (
    usp_id          SERIAL          PRIMARY KEY,
    usu_id          BIGINT          NOT NULL,
    pap_id          INTEGER         NOT NULL,
    usp_ativo       BOOLEAN         NOT NULL    DEFAULT TRUE,
    usp_criado_em   TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    usp_atualizado_em TIMESTAMPTZ  NOT NULL    DEFAULT NOW(),
    
    CONSTRAINT uq_usuario_papel UNIQUE (usu_id, pap_id),
    CONSTRAINT fk_usuario_papeis_usuario FOREIGN KEY (usu_id)
        REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_papeis_papel FOREIGN KEY (pap_id)
        REFERENCES livraria_comercial.papeis(pap_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuario_papeis_usuario ON livraria_gestao.usuario_papeis(usu_id);
CREATE INDEX IF NOT EXISTS idx_usuario_papeis_papel ON livraria_gestao.usuario_papeis(pap_id);
CREATE INDEX IF NOT EXISTS idx_usuario_papeis_ativo ON livraria_gestao.usuario_papeis(usp_ativo);

-- Comentários
COMMENT ON TABLE livraria_gestao.usuario_papeis IS 'Relacionamento N:M entre usuarios e papeis. Permite que um usuário tenha múltiplos papéis (ex: admin pode ter papéis de diferentes lojas).';
COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_id IS 'Chave primária interna.';
COMMENT ON COLUMN livraria_gestao.usuario_papeis.usu_id IS 'FK para usuarios.';
COMMENT ON COLUMN livraria_gestao.usuario_papeis.pap_id IS 'FK para papeis.';
COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_ativo IS 'Indica se o papel está ativo para este usuário.';
COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_criado_em IS 'Timestamp de criação do relacionamento.';
COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_atualizado_em IS 'Timestamp da última atualização.';

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION livraria_gestao.fn_atualizar_timestamp_usuario_papeis()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.usp_atualizado_em = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_usuario_papeis_atualizado_em ON livraria_gestao.usuario_papeis;
CREATE TRIGGER tg_usuario_papeis_atualizado_em
    BEFORE UPDATE ON livraria_gestao.usuario_papeis
    FOR EACH ROW
    EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp_usuario_papeis();
