-- Migration [20260412-220000] - Adicionar status FALHA NA ENTREGA
-- Objetivo: Sprint 3 (S3-C: Falha na entrega)

INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES
('FALHA NA ENTREGA')
ON CONFLICT (stv_descricao) DO NOTHING;
