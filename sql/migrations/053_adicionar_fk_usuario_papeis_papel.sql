-- Migration 053: Adicionar FK faltante fk_usuario_papeis_papel
-- Descrição: A FK fk_usuario_papeis_papel não existia no banco de produção,
--          mas era necessária para garantir integridade referencial
-- Data: 2026-05-26

BEGIN;

-- Adicionar FK faltante
ALTER TABLE livraria_gestao.usuario_papeis
ADD CONSTRAINT fk_usuario_papeis_papel
FOREIGN KEY (pap_id)
REFERENCES livraria_gestao.papeis(pap_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

COMMIT;
