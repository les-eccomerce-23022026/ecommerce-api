-- Adiciona tipo de pagamento PIX (split checkout + liquidação simulada).
INSERT INTO livraria_financeiro.tipo_pagamento (tpg_descricao) VALUES ('pix')
ON CONFLICT (tpg_descricao) DO NOTHING;

COMMENT ON TABLE livraria_financeiro.tipo_pagamento IS 'Tipos de pagamento aceitos (cartao_credito, cupom_troca, cupom_promocional, pix).';
