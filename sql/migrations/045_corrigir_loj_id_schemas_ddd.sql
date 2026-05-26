-- Migration: 045_corrigir_loj_id_schemas_ddd.sql
-- Corrige a adição de loj_id para tabelas em schemas DDD (livraria_comercial, livraria_financeiro, etc.)
-- A migration 030 tentou adicionar em public.*, mas as tabelas estão em schemas DDD

-- Tabela: estoques (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'estoques' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.estoques ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.estoques';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.estoques';
    END IF;
END $$;

-- Tabela: vendas (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'vendas' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.vendas ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.vendas';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.vendas';
    END IF;
END $$;

-- Tabela: itens_venda (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'itens_venda' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.itens_venda ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.itens_venda';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.itens_venda';
    END IF;
END $$;

-- Tabela: carrinho_itens (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'carrinho_itens' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.carrinho_itens ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.carrinho_itens';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.carrinho_itens';
    END IF;
END $$;

-- Tabela: entrega (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'entrega' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.entrega ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.entrega';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.entrega';
    END IF;
END $$;

-- Tabela: cotacao_frete (livraria_comercial ou livraria_logistica, conforme ambiente)
DO $$
DECLARE
    esquema TEXT;
BEGIN
    FOREACH esquema IN ARRAY ARRAY['livraria_comercial', 'livraria_logistica'] LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = esquema AND table_name = 'cotacao_frete'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = esquema AND table_name = 'cotacao_frete' AND column_name = 'loj_id'
        ) THEN
            EXECUTE format('ALTER TABLE %I.cotacao_frete ADD COLUMN loj_id BIGINT', esquema);
            RAISE NOTICE 'Coluna loj_id adicionada em %.cotacao_frete', esquema;
        END IF;
    END LOOP;
END $$;

-- Tabela: pagamento (livraria_financeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_financeiro' 
                   AND table_name = 'pagamento' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_financeiro.pagamento ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_financeiro.pagamento';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_financeiro.pagamento';
    END IF;
END $$;

-- Tabela: cartao_pagamento (livraria_financeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_financeiro' 
                   AND table_name = 'cartao_pagamento' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_financeiro.cartao_pagamento ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_financeiro.cartao_pagamento';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_financeiro.cartao_pagamento';
    END IF;
END $$;

-- Tabela: intencao_pagamento (livraria_financeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_financeiro' 
                   AND table_name = 'intencao_pagamento' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_financeiro.intencao_pagamento ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_financeiro.intencao_pagamento';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_financeiro.intencao_pagamento';
    END IF;
END $$;

-- Tabela: avaliacoes_livro (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'avaliacoes_livro' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.avaliacoes_livro ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.avaliacoes_livro';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.avaliacoes_livro';
    END IF;
END $$;

-- Tabela: fornecedores (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'fornecedores' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.fornecedores ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.fornecedores';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.fornecedores';
    END IF;
END $$;

-- Popular loj_id com loja padrão (se NULL)
UPDATE livraria_comercial.estoques SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.vendas SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.itens_venda SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.carrinho_itens SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.entrega SET loj_id = 1 WHERE loj_id IS NULL;
DO $$
DECLARE
    esquema TEXT;
BEGIN
    FOREACH esquema IN ARRAY ARRAY['livraria_comercial', 'livraria_logistica'] LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = esquema AND table_name = 'cotacao_frete'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = esquema AND table_name = 'cotacao_frete' AND column_name = 'loj_id'
        ) THEN
            EXECUTE format('UPDATE %I.cotacao_frete SET loj_id = 1 WHERE loj_id IS NULL', esquema);
        END IF;
    END LOOP;
END $$;
UPDATE livraria_financeiro.pagamento SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_financeiro.cartao_pagamento SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_financeiro.intencao_pagamento SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.avaliacoes_livro SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.fornecedores SET loj_id = 1 WHERE loj_id IS NULL;

-- Adicionar comentários
COMMENT ON COLUMN livraria_comercial.estoques.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_comercial.vendas.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_comercial.itens_venda.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_comercial.carrinho_itens.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_comercial.entrega.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
DO $$
DECLARE
    esquema TEXT;
BEGIN
    FOREACH esquema IN ARRAY ARRAY['livraria_comercial', 'livraria_logistica'] LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = esquema AND table_name = 'cotacao_frete' AND column_name = 'loj_id'
        ) THEN
            EXECUTE format(
                'COMMENT ON COLUMN %I.cotacao_frete.loj_id IS %L',
                esquema,
                'FK para lojas (multi-tenancy). Migration 045.'
            );
        END IF;
    END LOOP;
END $$;
COMMENT ON COLUMN livraria_financeiro.pagamento.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_financeiro.intencao_pagamento.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
COMMENT ON COLUMN livraria_comercial.fornecedores.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';
