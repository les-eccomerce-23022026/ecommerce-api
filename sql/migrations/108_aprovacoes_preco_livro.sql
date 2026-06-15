CREATE TABLE IF NOT EXISTS livraria_comercial.aprovacoes_preco_livro (
  apr_id          BIGSERIAL     PRIMARY KEY,
  apr_uuid        UUID          NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  liv_id          BIGINT        NOT NULL REFERENCES livraria_comercial.livros(liv_id),
  loj_id          INTEGER       NOT NULL REFERENCES livraria_gestao.lojas(loj_id),
  usu_id_solicitante BIGINT     NOT NULL REFERENCES livraria_gestao.usuarios(usu_id),
  usu_id_aprovador   BIGINT     REFERENCES livraria_gestao.usuarios(usu_id),
  apr_preco_atual DECIMAL(10,2) NOT NULL,
  apr_preco_solicitado DECIMAL(10,2) NOT NULL,
  apr_margem_grupo DECIMAL(5,2) NOT NULL,
  apr_margem_calculada DECIMAL(5,2) NOT NULL,
  apr_status      VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE'
    CHECK (apr_status IN ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO')),
  apr_justificativa TEXT,
  apr_observacao_aprovador TEXT,
  apr_criado_em   TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
  apr_atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.aprovacoes_preco_livro
  IS 'Fila de aprovação para alterações de preço abaixo da margem mínima do grupo (RN0014).';

CREATE INDEX IF NOT EXISTS idx_aprovacoes_livro ON livraria_comercial.aprovacoes_preco_livro(liv_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_status ON livraria_comercial.aprovacoes_preco_livro(apr_status);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_solicitante ON livraria_comercial.aprovacoes_preco_livro(usu_id_solicitante);
