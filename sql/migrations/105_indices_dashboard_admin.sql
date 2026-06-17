-- Índices para otimizar queries do dashboard admin
-- Migration: 105_indices_dashboard_admin.sql

-- Índice para vendas por data (usado em múltiplas queries do dashboard)
CREATE INDEX IF NOT EXISTS idx_vendas_criado_em 
ON livraria_comercial.vendas (ven_criado_em DESC);

-- Índice composto para vendas por status e data
CREATE INDEX IF NOT EXISTS idx_vendas_status_criado_em 
ON livraria_comercial.vendas (stv_id, ven_criado_em DESC);

-- Índice para usuários por papel e data de criação
CREATE INDEX IF NOT EXISTS idx_usuarios_papel_criado_em 
ON livraria_gestao.usuarios (pap_id, usu_criado_em DESC);

-- Índice para usuários ativos por papel
CREATE INDEX IF NOT EXISTS idx_usuarios_papel_ativo 
ON livraria_gestao.usuarios (pap_id, usu_ativo) 
WHERE usu_ativo = TRUE;

-- Índice para estoques com quantidade baixa
CREATE INDEX IF NOT EXISTS idx_estoques_quantidade_disponivel 
ON livraria_comercial.estoques (etq_quantidade_disponivel) 
WHERE etq_ativo = TRUE AND etq_quantidade_disponivel <= 5;

-- Índice para itens de venda por livro (usado em análise de vendas por categoria)
CREATE INDEX IF NOT EXISTS idx_itens_venda_livro 
ON livraria_comercial.itens_venda (liv_uuid);

-- Índice para livros por categoria (usado em análise de vendas por categoria)
CREATE INDEX IF NOT EXISTS idx_livro_categorias_livro 
ON livraria_comercial.livro_categorias (liv_id);

-- Índice para status de venda (usado em contagem por status)
CREATE INDEX IF NOT EXISTS idx_status_venda_descricao 
ON livraria_comercial.status_venda (stv_descricao);
