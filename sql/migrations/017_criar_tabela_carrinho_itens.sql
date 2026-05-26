-- Carrinho persistido por usuário (integração com frontend GET /carrinho)
CREATE TABLE IF NOT EXISTS livraria_comercial.carrinho_itens (
    cri_id BIGSERIAL PRIMARY KEY,
    usu_id BIGINT NOT NULL REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE,
    liv_id BIGINT NOT NULL REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE,
    cri_quantidade INTEGER NOT NULL CHECK (cri_quantidade > 0),
    cri_atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_carrinho_usuario_livro UNIQUE (usu_id, liv_id)
);

CREATE INDEX IF NOT EXISTS idx_carrinho_itens_usuario ON livraria_comercial.carrinho_itens(usu_id);

COMMENT ON TABLE livraria_comercial.carrinho_itens IS 'Itens do carrinho de compras por usuário autenticado.';
