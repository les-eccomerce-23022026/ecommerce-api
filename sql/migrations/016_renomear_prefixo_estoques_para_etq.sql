-- Migration: 016_renomear_prefixo_estoques_para_etq.sql
-- Descrição: Renomeia colunas da tabela estoques de est_ para etq_, eliminando
--            colisão de prefixo com a tabela estados (também est_).
-- Data: 2026-04-01
-- Correção: Adicionado schema livraria_comercial em todas as referências à tabela estoques

DO $$
BEGIN
    -- 1. Renomear colunas se elas ainda usarem o prefixo est_
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_id') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_id TO etq_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_uuid') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_uuid TO etq_uuid;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_quantidade_disponivel') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_quantidade_disponivel TO etq_quantidade_disponivel;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_quantidade_reservada') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_quantidade_reservada TO etq_quantidade_reservada;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_preco_venda') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_preco_venda TO etq_preco_venda;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_valor_custo_atual') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_valor_custo_atual TO etq_valor_custo_atual;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_ultimo_custo_calculado') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_ultimo_custo_calculado TO etq_ultimo_custo_calculado;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_ativo') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_ativo TO etq_ativo;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_criado_em') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_criado_em TO etq_criado_em;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'livraria_comercial' AND table_name = 'estoques' AND column_name = 'est_atualizado_em') THEN
        ALTER TABLE livraria_comercial.estoques RENAME COLUMN est_atualizado_em TO etq_atualizado_em;
    END IF;

    -- 2. Sequência do BIGSERIAL
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'livraria_comercial' AND sequencename = 'estoques_est_id_seq') THEN
        ALTER SEQUENCE livraria_comercial.estoques_est_id_seq RENAME TO estoques_etq_id_seq;
    END IF;
END $$;

-- 3. Trigger de timestamp: atualizar referência à coluna renomeada (sempre executado para garantir versão final)
CREATE OR REPLACE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'autores' THEN NEW.aut_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'editoras' THEN NEW.edi_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'livros' THEN NEW.liv_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'estoques' THEN NEW.etq_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'fornecedores' THEN NEW.for_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'avaliacoes_livro' THEN NEW.avl_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;
