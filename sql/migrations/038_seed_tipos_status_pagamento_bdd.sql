-- Migration 038: Tipos e status de pagamento para cenários BDD e checkout (idempotente)

INSERT INTO livraria_financeiro.status_pagamento (stp_descricao) VALUES
    ('PENDENTE'),
    ('APROVADO'),
    ('RECUSADO'),
    ('CANCELADO')
ON CONFLICT (stp_descricao) DO NOTHING;

INSERT INTO livraria_financeiro.tipo_pagamento (tpg_descricao) VALUES
    ('cartao_credito'),
    ('cupom_troca'),
    ('cupom_promocional'),
    ('pix')
ON CONFLICT (tpg_descricao) DO NOTHING;

-- Multi-tenancy: coluna loj_id em pagamento (search_path prioriza livraria_comercial)
ALTER TABLE livraria_financeiro.pagamento
    ADD COLUMN IF NOT EXISTS loj_id BIGINT;

UPDATE livraria_financeiro.pagamento
SET loj_id = 1
WHERE loj_id IS NULL;

-- Cupons de troca reais para clientetest (checkout e /cupom/disponiveis)
INSERT INTO livraria_comercial.cupons_troca (cpt_cliente_id, cpt_codigo, cpt_valor, cpt_valido_ate, cpt_status)
SELECT c.cli_id, 'TROCA50', 50.00, CURRENT_DATE + INTERVAL '365 days', 'DISPONIVEL'
FROM livraria_gestao.usuarios u
JOIN livraria_gestao.clientes c ON c.usu_id = u.usu_id
WHERE u.usu_email = 'clientetest@email.com'
ON CONFLICT (cpt_codigo) DO UPDATE
SET cpt_valor = GREATEST(livraria_comercial.cupons_troca.cpt_valor, EXCLUDED.cpt_valor),
    cpt_status = 'DISPONIVEL';

INSERT INTO livraria_comercial.cupons_troca (cpt_cliente_id, cpt_codigo, cpt_valor, cpt_valido_ate, cpt_status)
SELECT c.cli_id, 'TROCA30', 30.00, CURRENT_DATE + INTERVAL '365 days', 'DISPONIVEL'
FROM livraria_gestao.usuarios u
JOIN livraria_gestao.clientes c ON c.usu_id = u.usu_id
WHERE u.usu_email = 'clientetest@email.com'
ON CONFLICT (cpt_codigo) DO UPDATE
SET cpt_valor = GREATEST(livraria_comercial.cupons_troca.cpt_valor, EXCLUDED.cpt_valor),
    cpt_status = 'DISPONIVEL';
