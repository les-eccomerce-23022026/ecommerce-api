-- Migration 068: Adicionar status de devolução (idempotente)
-- Objetivo: Corrigir erro 404 no endpoint /api/vendas/:uuid/devolucao
-- Os status de devolução não foram inseridos nas migrations anteriores

INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES
    ('EM DEVOLUÇÃO'),
    ('DEVOLUÇÃO AUTORIZADA'),
    ('DEVOLUÇÃO REJEITADA')
ON CONFLICT (stv_descricao) DO NOTHING;
