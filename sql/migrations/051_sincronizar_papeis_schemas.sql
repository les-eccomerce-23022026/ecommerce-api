-- Migration 051: Sincronizar papeis entre schemas
-- Descrição: Copia papeis de livraria_comercial.papeis para livraria_gestao.papeis
-- Motivo: A tabela usuario_papeis referencia livraria_gestao.papeis, mas os papéis base
--          (admin, cliente) estão em livraria_comercial.papeis
-- Data: 2026-05-26

BEGIN;

-- Inserir papeis base de livraria_comercial para livraria_gestao
INSERT INTO livraria_gestao.papeis (pap_descricao, pap_criado_em)
SELECT pap_descricao, pap_criado_em
FROM livraria_comercial.papeis
ON CONFLICT (pap_descricao) DO NOTHING;

COMMIT;
