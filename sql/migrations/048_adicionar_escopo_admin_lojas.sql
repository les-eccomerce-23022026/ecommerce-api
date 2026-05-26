-- Migration 048: Adicionar campo escopo na tabela admin_lojas
-- Descrição: Adiciona suporte a dois níveis de administração:
--   - 'SISTEMA': Administrador do sistema (super admin, acesso global)
--   - 'LOJA': Administrador de loja (acesso apenas à loja atribuída)
-- Data: 2025-05-25

BEGIN;

-- Adicionar coluna adl_escopo com valor padrão 'LOJA'
ALTER TABLE livraria_gestao.admin_lojas
ADD COLUMN adl_escopo VARCHAR(20) NOT NULL DEFAULT 'LOJA';

-- Adicionar constraint CHECK para validar valores permitidos
ALTER TABLE livraria_gestao.admin_lojas
ADD CONSTRAINT ck_admin_lojas_escopo_valido 
CHECK (adl_escopo IN ('SISTEMA', 'LOJA'));

-- Criar índice para melhorar queries por escopo
CREATE INDEX idx_admin_lojas_escopo 
ON livraria_gestao.admin_lojas(adl_escopo);

COMMIT;
