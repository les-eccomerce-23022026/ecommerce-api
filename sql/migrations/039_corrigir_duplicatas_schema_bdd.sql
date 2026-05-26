-- Migration 039: Corrige duplicatas em livraria_comercial que sombreiam livraria_ref/livraria_financeiro
-- e quebram E2E BDD (intenção de pagamento sem loj_id; estados com est_id incompatível com cidades).

-- Multi-tenancy em intencao_pagamento (search_path prioriza livraria_financeiro)
ALTER TABLE livraria_financeiro.intencao_pagamento
    ADD COLUMN IF NOT EXISTS loj_id BIGINT;

UPDATE livraria_financeiro.intencao_pagamento
SET loj_id = 1
WHERE loj_id IS NULL;

-- Tabelas de referência duplicadas: sombreiam livraria_ref e causam FK em cidades
DROP TABLE IF EXISTS livraria_comercial.estados CASCADE;
DROP TABLE IF EXISTS livraria_comercial.tipos_logradouros CASCADE;
DROP TABLE IF EXISTS livraria_comercial.tipos_residencias CASCADE;
