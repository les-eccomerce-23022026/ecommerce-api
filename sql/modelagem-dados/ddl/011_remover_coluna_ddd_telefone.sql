-- Migration: Remover coluna tel_ddd e consolidar DDD no número
-- Motivo: Simplificar estrutura de telefone, consolidando DDD e número em um único campo
-- Data: 2026-03-09

BEGIN;

-- 1. Aumentar tamanho da coluna tel_numero para acomodar DDD + número (11 dígitos)
ALTER TABLE livraria_gestao.telefones 
  ALTER COLUMN tel_numero TYPE VARCHAR(11);

-- 2. Migrar dados existentes: concatenar DDD com número
-- Primeiro, criar coluna temporária para o novo formato
ALTER TABLE livraria_gestao.telefones 
  ADD COLUMN tel_numero_novo VARCHAR(11);

-- Atualizar com DDD + número concatenados
UPDATE livraria_gestao.telefones 
  SET tel_numero_novo = tel_ddd || tel_numero;

-- 3. Remover constraint de check do tel_ddd (se existir)
ALTER TABLE livraria_gestao.telefones 
  DROP CONSTRAINT IF EXISTS chk_telefone_ddd_formato;

-- 4. Remover constraint de check do tel_numero antigo (se existir)
ALTER TABLE livraria_gestao.telefones 
  DROP CONSTRAINT IF EXISTS chk_telefone_numero_formato;

-- 5. Substituir coluna antiga pela nova
ALTER TABLE livraria_gestao.telefones 
  DROP COLUMN tel_numero;

ALTER TABLE livraria_gestao.telefones 
  RENAME COLUMN tel_numero_novo TO tel_numero;

-- 6. Remover coluna tel_ddd
ALTER TABLE livraria_gestao.telefones 
  DROP COLUMN IF EXISTS tel_ddd;

-- 7. Adicionar novo constraint de check para telefone completo (10 ou 11 dígitos)
ALTER TABLE livraria_gestao.telefones 
  ADD CONSTRAINT chk_telefone_numero_formato 
  CHECK (tel_numero ~ '^[0-9]{10,11}$');

-- 8. Adicionar comentário atualizado
COMMENT ON COLUMN livraria_gestao.telefones.tel_numero IS 'Número completo do telefone (DDD + número), 10 ou 11 dígitos numéricos';

COMMIT;

-- Rollback (em caso de necessidade):
-- BEGIN;
-- ALTER TABLE livraria_gestao.telefones DROP CONSTRAINT IF EXISTS chk_telefone_numero_formato;
-- ALTER TABLE livraria_gestao.telefones ADD COLUMN tel_ddd CHAR(2);
-- ALTER TABLE livraria_gestao.telefones ADD COLUMN tel_numero_antigo VARCHAR(9);
-- UPDATE livraria_gestao.telefones SET tel_ddd = SUBSTRING(tel_numero, 1, 2), tel_numero_antigo = SUBSTRING(tel_numero, 3);
-- ALTER TABLE livraria_gestao.telefones DROP COLUMN tel_numero;
-- ALTER TABLE livraria_gestao.telefones RENAME COLUMN tel_numero_antigo TO tel_numero;
-- ALTER TABLE livraria_gestao.telefones ALTER COLUMN tel_numero TYPE VARCHAR(9);
-- ALTER TABLE livraria_gestao.telefones ADD CONSTRAINT chk_telefone_ddd_formato CHECK (tel_ddd ~ '^[0-9]{2}$');
-- ALTER TABLE livraria_gestao.telefones ADD CONSTRAINT chk_telefone_numero_formato CHECK (tel_numero ~ '^[0-9]{8,9}$');
-- COMMENT ON COLUMN livraria_gestao.telefones.tel_ddd IS 'DDD do telefone (2 dígitos)';
-- COMMENT ON COLUMN livraria_gestao.telefones.tel_numero IS 'Número do telefone (8 ou 9 dígitos)';
-- COMMIT;
