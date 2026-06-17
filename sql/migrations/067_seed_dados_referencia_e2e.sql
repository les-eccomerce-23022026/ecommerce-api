-- Migration 067: Dados de referência mínimos para E2E (7ª entrega)
-- Idempotente: status de venda, tipos de pagamento e vínculo admintest ↔ loja.

BEGIN;

-- Status de venda (POST /vendas)
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

-- Tipos e status de pagamento — espelha 038
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

-- admintest ↔ loja (espelha 066)
DO $$
DECLARE
  v_usu_id BIGINT;
  v_loj_id BIGINT;
BEGIN
  SELECT usu_id INTO v_usu_id
  FROM livraria_gestao.usuarios
  WHERE usu_email = 'admintest@email.com'
  LIMIT 1;

  SELECT l.loj_id INTO v_loj_id
  FROM livraria_gestao.lojas l
  WHERE l.loj_slug IN ('loja-padrao', 'livraria-teste', 'livraria-padrao')
  ORDER BY CASE l.loj_slug
    WHEN 'loja-padrao' THEN 1
    WHEN 'livraria-teste' THEN 2
    WHEN 'livraria-padrao' THEN 3
    ELSE 99
  END,
  l.loj_id
  LIMIT 1;

  IF v_loj_id IS NULL THEN
    SELECT loj_id INTO v_loj_id
    FROM livraria_gestao.lojas
    WHERE loj_ativo = TRUE
    ORDER BY loj_id
    LIMIT 1;
  END IF;

  IF v_usu_id IS NOT NULL AND v_loj_id IS NOT NULL THEN
    UPDATE livraria_gestao.usuarios SET loj_id = v_loj_id WHERE usu_id = v_usu_id;

    INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
    VALUES (v_usu_id, v_loj_id, 'admin_principal', TRUE, 'LOJA')
    ON CONFLICT (usu_id, loj_id) DO UPDATE
      SET adl_ativo = TRUE,
          adl_papel = EXCLUDED.adl_papel,
          adl_escopo = EXCLUDED.adl_escopo;
  END IF;
END $$;

COMMIT;
