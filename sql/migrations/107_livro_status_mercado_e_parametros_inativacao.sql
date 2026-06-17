ALTER TABLE livraria_comercial.livros
  ADD COLUMN IF NOT EXISTS liv_status_mercado VARCHAR(30) NOT NULL DEFAULT 'ATIVO'
    CHECK (liv_status_mercado IN ('ATIVO', 'INATIVO_MANUAL', 'FORA_DE_MERCADO'));

CREATE TABLE IF NOT EXISTS livraria_comercial.parametros_inativacao_livro (
  pai_id          SERIAL        PRIMARY KEY,
  pai_uuid        UUID          NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  pai_valor_minimo_catalogo DECIMAL(10,2) NOT NULL DEFAULT 10.00
    CHECK (pai_valor_minimo_catalogo >= 0),
  pai_ativo       BOOLEAN       NOT NULL DEFAULT TRUE,
  pai_criado_em   TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
  pai_atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.parametros_inativacao_livro
  IS 'Parâmetros configuráveis para inativação automática de livros (RF0013/RN0016).';
COMMENT ON COLUMN livraria_comercial.parametros_inativacao_livro.pai_valor_minimo_catalogo
  IS 'Valor mínimo de preço de venda abaixo do qual livro sem estoque é marcado FORA_DE_MERCADO.';

INSERT INTO livraria_comercial.parametros_inativacao_livro (pai_valor_minimo_catalogo)
VALUES (10.00)
ON CONFLICT DO NOTHING;
