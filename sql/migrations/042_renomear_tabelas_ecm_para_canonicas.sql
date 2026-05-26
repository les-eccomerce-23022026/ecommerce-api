-- Migration 042: Renomear tabelas ecm_* para nomes canônicos
-- Motivo: Código usa vendas/itens_venda/status_venda, mas banco tem ecm_venda/ecm_item_venda/ecm_status_venda
-- A migration 015 foi desativada, então as tabelas nunca foram renomeadas

BEGIN;

-- Renomear ecm_status_venda -> status_venda (idempotente)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'ecm_status_venda')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'status_venda') THEN
        ALTER TABLE livraria_comercial.ecm_status_venda RENAME TO status_venda;
        RAISE NOTICE 'Tabela ecm_status_venda renomeada para status_venda';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'ecm_status_venda')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'status_venda') THEN
        -- Ambas existem, remover a duplicada
        DROP TABLE livraria_comercial.ecm_status_venda CASCADE;
        RAISE NOTICE 'Tabela ecm_status_venda duplicada removida (status_venda já existe)';
    ELSE
        RAISE NOTICE 'Tabelas ecm_status_venda e status_venda já estão no estado correto';
    END IF;
END $$;

-- Renomear ecm_venda -> vendas (idempotente)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'ecm_venda')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'vendas') THEN
        ALTER TABLE livraria_comercial.ecm_venda RENAME TO vendas;
        RAISE NOTICE 'Tabela ecm_venda renomeada para vendas';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'ecm_venda')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'vendas') THEN
        -- Ambas existem, remover a duplicada
        DROP TABLE livraria_comercial.ecm_venda CASCADE;
        RAISE NOTICE 'Tabela ecm_venda duplicada removida (vendas já existe)';
    ELSE
        RAISE NOTICE 'Tabelas ecm_venda e vendas já estão no estado correto';
    END IF;
END $$;

-- Renomear ecm_item_venda -> itens_venda (idempotente)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'ecm_item_venda')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'itens_venda') THEN
        ALTER TABLE livraria_comercial.ecm_item_venda RENAME TO itens_venda;
        RAISE NOTICE 'Tabela ecm_item_venda renomeada para itens_venda';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'ecm_item_venda')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'livraria_comercial' AND table_name = 'itens_venda') THEN
        -- Ambas existem, remover a duplicada
        DROP TABLE livraria_comercial.ecm_item_venda CASCADE;
        RAISE NOTICE 'Tabela ecm_item_venda duplicada removida (itens_venda já existe)';
    ELSE
        RAISE NOTICE 'Tabelas ecm_item_venda e itens_venda já estão no estado correto';
    END IF;
END $$;

-- Atualizar FK em itens_venda (agora referencia vendas ao invés de ecm_venda)
-- A FK foi criada na migration 010 como: REFERENCES livraria_comercial.ecm_venda(ven_id)
-- Após o renomeio, o PostgreSQL atualiza automaticamente a FK para referencia a nova tabela

COMMIT;
