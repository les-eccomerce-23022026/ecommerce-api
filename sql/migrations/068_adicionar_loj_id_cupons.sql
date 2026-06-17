-- Migration 068: Adicionar campo loj_id nas tabelas de cupons
-- Propósito: Permitir que administradores de loja criem cupons específicos para sua loja
-- Cupons com loj_id = NULL são globais (admin_sistema)
-- Cupons com loj_id preenchido são específicos da loja (admin_loja)

BEGIN;

-- Adicionar campo loj_id na tabela cupom (cupons promocionais)
ALTER TABLE livraria_comercial.cupom
ADD COLUMN IF NOT EXISTS loj_id BIGINT,
ADD CONSTRAINT fk_cupom_loja
    FOREIGN KEY (loj_id)
    REFERENCES livraria_gestao.lojas(loj_id)
    ON DELETE CASCADE;

-- Adicionar campo loj_id na tabela cupons_troca (cupons de troca)
ALTER TABLE livraria_comercial.cupons_troca
ADD COLUMN IF NOT EXISTS loj_id BIGINT,
ADD CONSTRAINT fk_cupons_troca_loja
    FOREIGN KEY (loj_id)
    REFERENCES livraria_gestao.lojas(loj_id)
    ON DELETE CASCADE;

-- Adicionar comentários
COMMENT ON COLUMN livraria_comercial.cupom.loj_id IS 'ID da loja que criou o cupom (NULL = cupom global do admin_sistema)';
COMMENT ON COLUMN livraria_comercial.cupons_troca.loj_id IS 'ID da loja que criou o cupom (NULL = cupom global do admin_sistema)';

-- Criar índice para otimizar consultas por loja
CREATE INDEX IF NOT EXISTS idx_cupom_loj_id ON livraria_comercial.cupom(loj_id);
CREATE INDEX IF NOT EXISTS idx_cupons_troca_loj_id ON livraria_comercial.cupons_troca(loj_id);

COMMIT;
