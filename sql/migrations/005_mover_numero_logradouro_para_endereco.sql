-- =============================================================================
-- Migration 005 — Mover número do logradouro de ecm_logradouro para ecm_endereco_usuario
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

DO $$
BEGIN
    -- 1. Adicionar a coluna num_logradouro à tabela ecm_endereco_usuario
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ecm_endereco_usuario' 
        AND column_name = 'num_logradouro'
    ) THEN
        ALTER TABLE ecm_endereco_usuario ADD COLUMN num_logradouro VARCHAR(10);
        COMMENT ON COLUMN ecm_endereco_usuario.num_logradouro IS 'Número do imóvel no endereço do usuário.';
    END IF;

    -- 2. Migrar dados existentes (se houver)
    UPDATE ecm_endereco_usuario e
    SET num_logradouro = l.num_logradouro
    FROM ecm_logradouro l
    WHERE e.id_logradouro = l.id_logradouro;

    -- 3. Remover a unicidade antiga de ecm_logradouro que incluía o número
    ALTER TABLE ecm_logradouro DROP CONSTRAINT IF EXISTS uq_logradouro_completo;

    -- 4. Criar nova unicidade para ecm_logradouro apenas com tipo e nome
    -- Isso permite que a tabela funcione como um catálogo de "ruas únicas"
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'uq_logradouro_rua_unica'
    ) THEN
        ALTER TABLE ecm_logradouro ADD CONSTRAINT uq_logradouro_rua_unica UNIQUE (id_tipo_logradouro, dsc_logradouro);
    END IF;

    -- 5. Remover a coluna num_logradouro de ecm_logradouro
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ecm_logradouro' 
        AND column_name = 'num_logradouro'
    ) THEN
        ALTER TABLE ecm_logradouro DROP COLUMN num_logradouro;
    END IF;

    -- 6. Atualizar comentários das tabelas para refletir a nova regra
    COMMENT ON TABLE ecm_logradouro IS 'Catálogo de ruas/avenidas normalizadas (sem número).';
    COMMENT ON TABLE ecm_endereco_usuario IS 'Endereços vinculados a um usuário, agora contendo o número do imóvel.';

END $$;
