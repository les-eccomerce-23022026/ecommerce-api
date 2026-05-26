-- Migration: 019_pagamento_inp_id_e_indice_intencao_ven.sql
-- Liga pagamento à intenção (rastreio) e indexa intenções por venda.

ALTER TABLE pagamento
  ADD COLUMN IF NOT EXISTS inp_id BIGINT NULL
    REFERENCES intencao_pagamento(inp_id) ON DELETE SET NULL;

COMMENT ON COLUMN pagamento.inp_id IS 'FK opcional para intencao_pagamento (checkout com intenção prévia).';

CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamento_inp_id_unico
  ON pagamento(inp_id)
  WHERE inp_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intencao_pagamento_ven_id
  ON intencao_pagamento(ven_id)
  WHERE ven_id IS NOT NULL;
