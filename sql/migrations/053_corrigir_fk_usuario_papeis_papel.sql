-- Migration 053: Corrigir FK fk_usuario_papeis_papel para referenciar schema correto
-- Descrição: A FK fk_usuario_papeis_papel estava referenciando papeis sem schema,
--          o que causava conflito com livraria_comercial.papeis. Corrigido para
--          referenciar explicitamente livraria_gestao.papeis
-- Data: 2026-05-26

BEGIN;

-- Remover FK antiga primeiro
ALTER TABLE livraria_gestao.usuario_papeis
DROP CONSTRAINT fk_usuario_papeis_papel;

-- Atualizar pap_id dos usuario_papeis para usar IDs de livraria_gestao.papeis
UPDATE livraria_gestao.usuario_papeis up
SET pap_id = g.pap_id
FROM livraria_gestao.papeis g, livraria_comercial.papeis c
WHERE up.pap_id = c.pap_id
AND c.pap_descricao = g.pap_descricao;

-- Recriar FK com schema explícito
ALTER TABLE livraria_gestao.usuario_papeis
ADD CONSTRAINT fk_usuario_papeis_papel
FOREIGN KEY (pap_id)
REFERENCES livraria_gestao.papeis(pap_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

COMMIT;
