-- Migration: 015_padronizar_nomenclatura_vendas.sql
-- Descrição: Padroniza nomenclatura das tabelas de vendas (remover prefixo ecm_)
--            e corrige FK para livros com relacionamento direto via liv_id
-- Data: 2026-03-26
--
-- Justificativa:
--   - Manter consistência com padrão do projeto (tabelas sem prefixo)
--   - Permitir FK direta de itens_venda.liv_id para livros.liv_id
--   - Habilitar integridade referencial completa

-- =============================================================================
-- Passo 1: Renomear tabelas de vendas (remover prefixo ecm_)
-- =============================================================================

-- Renomear ecm_venda -> vendas
ALTER TABLE IF EXISTS ecm_venda RENAME TO vendas;

-- Renomear ecm_item_venda -> itens_venda
ALTER TABLE IF EXISTS ecm_item_venda RENAME TO itens_venda;

-- Renomear índices para manter consistência
ALTER INDEX IF EXISTS idx_venda_usuario RENAME TO idx_vendas_usuario;
ALTER INDEX IF EXISTS idx_venda_status RENAME TO idx_vendas_status;
ALTER INDEX IF EXISTS idx_item_venda_uuid RENAME TO idx_itens_venda_uuid;
ALTER INDEX IF EXISTS idx_item_venda_venda RENAME TO idx_itens_venda_venda;

-- Renomear sequências para manter consistência
ALTER SEQUENCE IF EXISTS ecm_venda_ven_id_seq RENAME TO vendas_ven_id_seq;
ALTER SEQUENCE IF EXISTS ecm_item_venda_itv_id_seq RENAME TO itens_venda_itv_id_seq;

-- Renomear ecm_status_venda -> status_venda
ALTER TABLE IF EXISTS ecm_status_venda RENAME TO status_venda;
ALTER SEQUENCE IF EXISTS ecm_status_venda_stv_id_seq RENAME TO status_venda_stv_id_seq;


-- =============================================================================
-- Passo 2: Adicionar coluna liv_id em itens_venda (FK para livros)
-- =============================================================================

-- Adicionar coluna liv_id (temporariamente nullable)
ALTER TABLE itens_venda 
ADD COLUMN IF NOT EXISTS liv_id BIGINT REFERENCES livros(liv_id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_itens_venda_livro ON itens_venda(liv_id);


-- =============================================================================
-- Passo 3: Migrar dados de liv_uuid para liv_id (se houver dados)
-- =============================================================================
-- Nota: Esta migração assume que a migration 014 já foi executada
-- e a tabela livros já existe com seus dados.

-- Atualizar liv_id baseado no liv_uuid existente
-- (Assume que livros.liv_uuid foi populado com os UUIDs do mock)
UPDATE itens_venda iv
SET liv_id = l.liv_id
FROM livros l
WHERE l.liv_uuid = iv.liv_uuid
AND iv.liv_id IS NULL;

-- Tornar liv_id NOT NULL após migração (se houver dados)
-- ALTER TABLE itens_venda ALTER COLUMN liv_id SET NOT NULL;

-- Opcional: Remover coluna liv_uuid após validação
-- ALTER TABLE itens_venda DROP COLUMN IF EXISTS liv_uuid;


-- =============================================================================
-- Passo 4: Atualizar FKs em tabelas dependentes
-- =============================================================================

-- Atualizar FK em pagamento (ecm_venda -> vendas)
-- Nota: A migration 011 criou FK para ecm_venda(ven_id)
-- Precisamos recriar a FK apontando para vendas(ven_id)

-- Drop da FK antiga (se existir) e recriar apontando para vendas(ven_id)
ALTER TABLE pagamento DROP CONSTRAINT IF EXISTS pagamento_ven_id_fkey;
ALTER TABLE pagamento DROP CONSTRAINT IF EXISTS fk_pagamento_vendas;

ALTER TABLE pagamento
ADD CONSTRAINT fk_pagamento_vendas
FOREIGN KEY (ven_id) REFERENCES vendas(ven_id) ON DELETE CASCADE;


-- Atualizar FK em entregas (ecm_venda -> vendas)
-- Nota: Após migration 025 e 029, a tabela entregas está em livraria_logistica
-- Verifica se a tabela existe (independente do schema via search_path)

DO $$
BEGIN
  IF to_regclass('entregas') IS NOT NULL THEN
    ALTER TABLE entregas DROP CONSTRAINT IF EXISTS entrega_ven_id_fkey;
    ALTER TABLE entregas DROP CONSTRAINT IF EXISTS fk_entrega_vendas;
    ALTER TABLE entregas
      ADD CONSTRAINT fk_entrega_vendas
      FOREIGN KEY (ven_id) REFERENCES vendas(ven_id) ON DELETE CASCADE;
  END IF;
END $$;


-- =============================================================================
-- Passo 5: Atualizar comentários das tabelas
-- =============================================================================

COMMENT ON TABLE vendas IS 'Vendas realizadas pelos usuários (antiga ecm_venda).';
COMMENT ON TABLE itens_venda IS 'Itens de cada venda (antiga ecm_item_venda).';

COMMENT ON COLUMN itens_venda.liv_id IS 'FK para livro vendido (relacionamento direto com tabela livros).';


-- =============================================================================
-- Passo 6: Atualizar sequence (se necessário)
-- =============================================================================
-- Garantir que as sequences estejam sincronizadas

SELECT setval('vendas_ven_id_seq', COALESCE((SELECT MAX(ven_id) FROM vendas), 1), true);
SELECT setval('itens_venda_itv_id_seq', COALESCE((SELECT MAX(itv_id) FROM itens_venda), 1), true);
