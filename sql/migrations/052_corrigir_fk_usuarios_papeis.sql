-- Migration 052: Corrigir FK fk_usuarios_papeis para referenciar schema correto
-- Descrição: A FK fk_usuarios_papeis estava referenciando papeis sem schema,
--          o que causava conflito com livraria_comercial.papeis. Corrigido para
--          referenciar explicitamente livraria_gestao.papeis
-- Data: 2026-05-26

BEGIN;

-- Remover FK antiga primeiro
ALTER TABLE livraria_gestao.usuarios
DROP CONSTRAINT fk_usuarios_papeis;

-- Atualizar pap_id dos usuários para usar IDs de livraria_gestao.papeis
UPDATE livraria_gestao.usuarios u
SET pap_id = g.pap_id
FROM livraria_gestao.papeis g, livraria_comercial.papeis c
WHERE u.pap_id = c.pap_id
AND c.pap_descricao = g.pap_descricao;

-- Recriar FK com schema explícito
ALTER TABLE livraria_gestao.usuarios
ADD CONSTRAINT fk_usuarios_papeis
FOREIGN KEY (pap_id)
REFERENCES livraria_gestao.papeis(pap_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

COMMIT;
