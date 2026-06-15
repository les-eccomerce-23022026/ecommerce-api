-- Migration: Corrigir constraint de unicidade de reservas de estoque
-- Descrição: A constraint UNIQUE (usu_id, liv_id, rse_status) incluía rse_status
--            como coluna, permitindo apenas UMA linha de cada status por
--            (usuario, livro). Isso causava violação de chave única ao cancelar
--            uma segunda reserva do mesmo livro (já existia uma linha CANCELADA),
--            resultando em erro 500 em liberarReserva().
--            A regra de negócio correta é: no máximo UMA reserva ATIVA por
--            (usuario, livro). Substituímos por um índice único PARCIAL.
-- Data: 2026-06-14

-- Remover a constraint incorreta (inclui rse_status na unicidade)
ALTER TABLE livraria_comercial.reservas_estoque
    DROP CONSTRAINT IF EXISTS uq_reserva_usuario_livro_ativa;

-- Criar índice único parcial: garante no máximo uma reserva ATIVA por (usu_id, liv_id)
-- Linhas EXPIRADA / CONSUMIDA / CANCELADA não participam da unicidade.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reserva_usuario_livro_ativa
    ON livraria_comercial.reservas_estoque (usu_id, liv_id)
    WHERE rse_status = 'ATIVA';
