-- Migration 037: Status de venda para fluxos BDD e integração (idempotente)

INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES
    ('EM PROCESSAMENTO'),
    ('APROVADA'),
    ('CANCELADA'),
    ('ENTREGUE'),
    ('EM TROCA'),
    ('TROCA CONCLUÍDA'),
    ('EM TRÂNSITO'),
    ('FALHA NA ENTREGA'),
    ('TROCA AUTORIZADA'),
    ('TROCA REJEITADA'),
    ('CONCLUÍDA'),
    ('REPROVADA'),
    ('AGUARDANDO PAGAMENTO')
ON CONFLICT (stv_descricao) DO NOTHING;
