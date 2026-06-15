-- Migration: Criar tabela de reservas temporárias de estoque
-- Descrição: Implementa sistema de reserva temporária de estoque para itens no carrinho
-- Data: 2025-01-15

-- Criar tabela de reservas de estoque
CREATE TABLE IF NOT EXISTS livraria_comercial.reservas_estoque (
    rse_id BIGSERIAL PRIMARY KEY,
    rse_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    usu_id BIGINT NOT NULL REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE,
    liv_id BIGINT NOT NULL REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE,
    rse_quantidade INTEGER NOT NULL CHECK (rse_quantidade > 0),
    rse_criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rse_expira_em TIMESTAMPTZ NOT NULL,
    rse_status VARCHAR(20) NOT NULL DEFAULT 'ATIVA' CHECK (rse_status IN ('ATIVA', 'EXPIRADA', 'CONSUMIDA', 'CANCELADA')),
    loj_id BIGINT NOT NULL,
    CONSTRAINT uq_reserva_usuario_livro_ativa UNIQUE (usu_id, liv_id, rse_status)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_reservas_estoque_usu_id ON livraria_comercial.reservas_estoque(usu_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estoque_liv_id ON livraria_comercial.reservas_estoque(liv_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estoque_status ON livraria_comercial.reservas_estoque(rse_status);
CREATE INDEX IF NOT EXISTS idx_reservas_estoque_expira_em ON livraria_comercial.reservas_estoque(rse_expira_em);
CREATE INDEX IF NOT EXISTS idx_reservas_estoque_loj_id ON livraria_comercial.reservas_estoque(loj_id);

-- Criar índice composto para busca de reservas expiradas
CREATE INDEX IF NOT EXISTS idx_reservas_estoque_expiradas ON livraria_comercial.reservas_estoque(rse_status, rse_expira_em)
WHERE rse_status = 'ATIVA';

-- Comentários de documentação
COMMENT ON TABLE livraria_comercial.reservas_estoque IS 'Tabela de reservas temporárias de estoque para itens no carrinho de compras';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.rse_uuid IS 'UUID público da reserva';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.usu_id IS 'ID do usuário que fez a reserva';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.liv_id IS 'ID do livro reservado';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.rse_quantidade IS 'Quantidade de itens reservados';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.rse_criado_em IS 'Data e hora de criação da reserva';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.rse_expira_em IS 'Data e hora de expiração da reserva';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.rse_status IS 'Status da reserva: ATIVA, EXPIRADA, CONSUMIDA, CANCELADA';
COMMENT ON COLUMN livraria_comercial.reservas_estoque.loj_id IS 'ID da loja (multi-tenancy)';
