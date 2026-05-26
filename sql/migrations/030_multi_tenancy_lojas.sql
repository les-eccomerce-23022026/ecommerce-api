-- Migration: 030_multi_tenancy_lojas.sql
-- Descrição: Implementa multi-tenancy com loja_id em tabelas operacionais
-- Ambiente: Dev, Test, Prod
-- Autor: Senior DBA
-- Data: 2026-05-18

BEGIN;

-- ============================================
-- PASSO 1: Criar tabela lojas (livraria_gestao)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'livraria_gestao' 
                   AND table_name = 'lojas') THEN
        CREATE TABLE livraria_gestao.lojas (
            loj_id BIGSERIAL PRIMARY KEY,
            loj_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
            loj_nome VARCHAR(100) NOT NULL,
            loj_slug VARCHAR(50) NOT NULL UNIQUE,
            loj_cnpj CHAR(18),
            loj_ativo BOOLEAN DEFAULT TRUE,
            loj_criado_em TIMESTAMPTZ DEFAULT NOW(),
            loj_atualizado_em TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela livraria_gestao.lojas criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela livraria_gestao.lojas já existe';
    END IF;
END $$;

-- ============================================
-- PASSO 2: Criar tabela admin_lojas (livraria_gestao)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'livraria_gestao' 
                   AND table_name = 'admin_lojas') THEN
        CREATE TABLE livraria_gestao.admin_lojas (
            adl_id BIGSERIAL PRIMARY KEY,
            usu_id BIGINT NOT NULL,
            loj_id BIGINT NOT NULL,
            adl_papel VARCHAR(20) NOT NULL,
            adl_ativo BOOLEAN DEFAULT TRUE,
            adl_criado_em TIMESTAMPTZ DEFAULT NOW(),
            
            CONSTRAINT fk_admin_lojas_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id),
            CONSTRAINT fk_admin_lojas_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id),
            CONSTRAINT uq_admin_loja UNIQUE (usu_id, loj_id)
        );
        
        RAISE NOTICE 'Tabela livraria_gestao.admin_lojas criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela livraria_gestao.admin_lojas já existe';
    END IF;
END $$;

-- ============================================
-- PASSO 3: Criar loja padrão (se não existir)
-- ============================================
INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_ativo)
VALUES (gen_random_uuid(), 'Loja Padrão', 'loja-padrao', TRUE)
ON CONFLICT (loj_slug) DO NOTHING;

-- ============================================
-- PASSO 4: Adicionar coluna loj_id em tabelas operacionais (NULLABLE)
-- ============================================

-- Tabela: clientes (livraria_gestao)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_gestao' 
                   AND table_name = 'clientes' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_gestao.clientes ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_gestao.clientes';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_gestao.clientes';
    END IF;
END $$;

-- Tabela: usuarios (livraria_gestao)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_gestao' 
                   AND table_name = 'usuarios' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_gestao.usuarios ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_gestao.usuarios';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_gestao.usuarios';
    END IF;
END $$;

-- Tabela: enderecos (livraria_gestao)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_gestao' 
                   AND table_name = 'enderecos' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_gestao.enderecos ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_gestao.enderecos';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_gestao.enderecos';
    END IF;
END $$;

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

-- Tabela: cotacao_frete (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'livraria_comercial' 
                   AND table_name = 'cotacao_frete' 
                   AND column_name = 'loj_id') THEN
        ALTER TABLE livraria_comercial.cotacao_frete ADD COLUMN loj_id BIGINT;
        RAISE NOTICE 'Coluna loj_id adicionada em livraria_comercial.cotacao_frete';
    ELSE
        RAISE NOTICE 'Coluna loj_id já existe em livraria_comercial.cotacao_frete';
    END IF;
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

-- ============================================
-- PASSO 5: Popular loj_id com loja padrão (se NULL)
-- ============================================
UPDATE livraria_gestao.clientes SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_gestao.usuarios SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_gestao.enderecos SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.estoques SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.vendas SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.itens_venda SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.carrinho_itens SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.entrega SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.cotacao_frete SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_financeiro.pagamento SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_financeiro.cartao_pagamento SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_financeiro.intencao_pagamento SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.avaliacoes_livro SET loj_id = 1 WHERE loj_id IS NULL;
UPDATE livraria_comercial.fornecedores SET loj_id = 1 WHERE loj_id IS NULL;

DO $$
BEGIN
    RAISE NOTICE 'loj_id populado com loja padrão (1) em todas as tabelas operacionais';
END $$;

-- ============================================
-- PASSO 6: Adicionar FK e constraint NOT NULL (após popular dados)
-- ============================================

-- Tabela: clientes (livraria_gestao)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_gestao' 
                   AND table_name = 'clientes' 
                   AND constraint_name = 'fk_clientes_loja') THEN
        ALTER TABLE livraria_gestao.clientes 
            ADD CONSTRAINT fk_clientes_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_clientes_loja adicionada em livraria_gestao.clientes';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_gestao' 
               AND table_name = 'clientes' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_gestao.clientes ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_gestao.clientes';
    END IF;
END $$;

-- Tabela: usuarios (livraria_gestao)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_gestao' 
                   AND table_name = 'usuarios' 
                   AND constraint_name = 'fk_usuarios_loja') THEN
        ALTER TABLE livraria_gestao.usuarios 
            ADD CONSTRAINT fk_usuarios_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_usuarios_loja adicionada em livraria_gestao.usuarios';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_gestao' 
               AND table_name = 'usuarios' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_gestao.usuarios ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_gestao.usuarios';
    END IF;
END $$;

-- Tabela: enderecos (livraria_gestao)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_gestao' 
                   AND table_name = 'enderecos' 
                   AND constraint_name = 'fk_enderecos_loja') THEN
        ALTER TABLE livraria_gestao.enderecos 
            ADD CONSTRAINT fk_enderecos_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_enderecos_loja adicionada em livraria_gestao.enderecos';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_gestao' 
               AND table_name = 'enderecos' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_gestao.enderecos ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_gestao.enderecos';
    END IF;
END $$;

-- Tabela: estoques (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'estoques' 
                   AND constraint_name = 'fk_estoques_loja') THEN
        ALTER TABLE livraria_comercial.estoques 
            ADD CONSTRAINT fk_estoques_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_estoques_loja adicionada em livraria_comercial.estoques';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'estoques' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.estoques ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.estoques';
    END IF;
END $$;

-- Tabela: vendas (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'vendas' 
                   AND constraint_name = 'fk_vendas_loja') THEN
        ALTER TABLE livraria_comercial.vendas 
            ADD CONSTRAINT fk_vendas_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_vendas_loja adicionada em livraria_comercial.vendas';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'vendas' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.vendas ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.vendas';
    END IF;
END $$;

-- Tabela: itens_venda (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'itens_venda' 
                   AND constraint_name = 'fk_itens_venda_loja') THEN
        ALTER TABLE livraria_comercial.itens_venda 
            ADD CONSTRAINT fk_itens_venda_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_itens_venda_loja adicionada em livraria_comercial.itens_venda';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'itens_venda' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.itens_venda ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.itens_venda';
    END IF;
END $$;

-- Tabela: carrinho_itens (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'carrinho_itens' 
                   AND constraint_name = 'fk_carrinho_itens_loja') THEN
        ALTER TABLE livraria_comercial.carrinho_itens 
            ADD CONSTRAINT fk_carrinho_itens_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_carrinho_itens_loja adicionada em livraria_comercial.carrinho_itens';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'carrinho_itens' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.carrinho_itens ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.carrinho_itens';
    END IF;
END $$;

-- Tabela: entrega (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'entrega' 
                   AND constraint_name = 'fk_entrega_loja') THEN
        ALTER TABLE livraria_comercial.entrega 
            ADD CONSTRAINT fk_entrega_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_entrega_loja adicionada em livraria_comercial.entrega';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'entrega' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.entrega ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.entrega';
    END IF;
END $$;

-- Tabela: cotacao_frete (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'cotacao_frete' 
                   AND constraint_name = 'fk_cotacao_frete_loja') THEN
        ALTER TABLE livraria_comercial.cotacao_frete 
            ADD CONSTRAINT fk_cotacao_frete_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_cotacao_frete_loja adicionada em livraria_comercial.cotacao_frete';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'cotacao_frete' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.cotacao_frete ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.cotacao_frete';
    END IF;
END $$;

-- Tabela: pagamento (livraria_financeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_financeiro' 
                   AND table_name = 'pagamento' 
                   AND constraint_name = 'fk_pagamento_loja') THEN
        ALTER TABLE livraria_financeiro.pagamento 
            ADD CONSTRAINT fk_pagamento_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_pagamento_loja adicionada em livraria_financeiro.pagamento';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_financeiro' 
               AND table_name = 'pagamento' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_financeiro.pagamento ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_financeiro.pagamento';
    END IF;
END $$;

-- Tabela: cartao_pagamento (livraria_financeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_financeiro' 
                   AND table_name = 'cartao_pagamento' 
                   AND constraint_name = 'fk_cartao_pagamento_loja') THEN
        ALTER TABLE livraria_financeiro.cartao_pagamento 
            ADD CONSTRAINT fk_cartao_pagamento_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_cartao_pagamento_loja adicionada em livraria_financeiro.cartao_pagamento';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_financeiro' 
               AND table_name = 'cartao_pagamento' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_financeiro.cartao_pagamento ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_financeiro.cartao_pagamento';
    END IF;
END $$;

-- Tabela: intencao_pagamento (livraria_financeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_financeiro' 
                   AND table_name = 'intencao_pagamento' 
                   AND constraint_name = 'fk_intencao_pagamento_loja') THEN
        ALTER TABLE livraria_financeiro.intencao_pagamento 
            ADD CONSTRAINT fk_intencao_pagamento_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_intencao_pagamento_loja adicionada em livraria_financeiro.intencao_pagamento';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_financeiro' 
               AND table_name = 'intencao_pagamento' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_financeiro.intencao_pagamento ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_financeiro.intencao_pagamento';
    END IF;
END $$;

-- Tabela: avaliacoes_livro (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'avaliacoes_livro' 
                   AND constraint_name = 'fk_avaliacoes_livro_loja') THEN
        ALTER TABLE livraria_comercial.avaliacoes_livro 
            ADD CONSTRAINT fk_avaliacoes_livro_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_avaliacoes_livro_loja adicionada em livraria_comercial.avaliacoes_livro';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'avaliacoes_livro' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.avaliacoes_livro ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.avaliacoes_livro';
    END IF;
END $$;

-- Tabela: fornecedores (livraria_comercial)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_schema = 'livraria_comercial' 
                   AND table_name = 'fornecedores' 
                   AND constraint_name = 'fk_fornecedores_loja') THEN
        ALTER TABLE livraria_comercial.fornecedores 
            ADD CONSTRAINT fk_fornecedores_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);
        RAISE NOTICE 'FK fk_fornecedores_loja adicionada em livraria_comercial.fornecedores';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'livraria_comercial' 
               AND table_name = 'fornecedores' 
               AND column_name = 'loj_id' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE livraria_comercial.fornecedores ALTER COLUMN loj_id SET NOT NULL;
        RAISE NOTICE 'Coluna loj_id marcada como NOT NULL em livraria_comercial.fornecedores';
    END IF;
END $$;

-- ============================================
-- PASSO 7: Criar índices em loj_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clientes_loj_id ON livraria_gestao.clientes(loj_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_loj_id ON livraria_gestao.usuarios(loj_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_loj_id ON livraria_gestao.enderecos(loj_id);
CREATE INDEX IF NOT EXISTS idx_estoques_loj_id ON livraria_comercial.estoques(loj_id);
CREATE INDEX IF NOT EXISTS idx_vendas_loj_id ON livraria_comercial.vendas(loj_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_loj_id ON livraria_comercial.itens_venda(loj_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_itens_loj_id ON livraria_comercial.carrinho_itens(loj_id);
CREATE INDEX IF NOT EXISTS idx_entrega_loj_id ON livraria_comercial.entrega(loj_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_frete_loj_id ON livraria_comercial.cotacao_frete(loj_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_loj_id ON livraria_financeiro.pagamento(loj_id);
CREATE INDEX IF NOT EXISTS idx_cartao_pagamento_loj_id ON livraria_financeiro.cartao_pagamento(loj_id);
CREATE INDEX IF NOT EXISTS idx_intencao_pagamento_loj_id ON livraria_financeiro.intencao_pagamento(loj_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_livro_loj_id ON livraria_comercial.avaliacoes_livro(loj_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_loj_id ON livraria_comercial.fornecedores(loj_id);

DO $$
BEGIN
    RAISE NOTICE 'Índices em loj_id criados em todas as tabelas operacionais';
END $$;

COMMIT;

-- ============================================
-- RESUMO DA MIGRATION
-- ============================================
-- ✅ Tabelas lojas e admin_lojas criadas em livraria_gestao
-- ✅ Loja padrão (loj_id = 1) criada
-- ✅ Coluna loj_id adicionada em todas as tabelas operacionais
-- ✅ loj_id populado com loja padrão em dados existentes
-- ✅ FKs para lojas adicionadas em todas as tabelas operacionais
-- ✅ Constraints NOT NULL aplicadas em loj_id
-- ✅ Índices B-tree em loj_id criados para performance
-- ✅ NÃO foi usado particionamento (recomendação: índices B-tree)
-- ✅ PKs simples mantidas (não PKs compostas)
