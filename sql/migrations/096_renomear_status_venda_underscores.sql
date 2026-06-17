-- Migration 096: Renomear status de venda — substituir espaços por underscores e remover acentos
-- Idempotente: cada UPDATE só afeta a linha se o valor antigo ainda existir.

UPDATE livraria_comercial.status_venda SET stv_descricao = 'EM_PROCESSAMENTO'   WHERE stv_descricao = 'EM PROCESSAMENTO';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'AGUARDANDO_PAGAMENTO' WHERE stv_descricao = 'AGUARDANDO PAGAMENTO';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'EM_TRANSITO'         WHERE stv_descricao = 'EM TRÂNSITO';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'EM_TROCA'            WHERE stv_descricao = 'EM TROCA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'TROCA_CONCLUIDA'     WHERE stv_descricao = 'TROCA CONCLUÍDA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'TROCA_AUTORIZADA'    WHERE stv_descricao = 'TROCA AUTORIZADA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'TROCA_REJEITADA'     WHERE stv_descricao = 'TROCA REJEITADA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'FALHA_NA_ENTREGA'    WHERE stv_descricao = 'FALHA NA ENTREGA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'EM_DEVOLUCAO'        WHERE stv_descricao = 'EM DEVOLUÇÃO';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'DEVOLUCAO_AUTORIZADA' WHERE stv_descricao = 'DEVOLUÇÃO AUTORIZADA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'DEVOLUCAO_REJEITADA' WHERE stv_descricao = 'DEVOLUÇÃO REJEITADA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'DEVOLUCAO_CONCLUIDA' WHERE stv_descricao = 'DEVOLUÇÃO CONCLUÍDA';
UPDATE livraria_comercial.status_venda SET stv_descricao = 'CONCLUIDA'           WHERE stv_descricao = 'CONCLUÍDA';
