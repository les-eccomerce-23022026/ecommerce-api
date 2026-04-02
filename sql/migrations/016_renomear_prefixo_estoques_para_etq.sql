-- Migration: 016_renomear_prefixo_estoques_para_etq.sql
-- Descrição: Renomeia colunas da tabela estoques de est_ para etq_, eliminando
--            colisão de prefixo com a tabela estados (também est_).
-- Data: 2026-04-01
--
-- Contexto: estados usa est_id, est_sigla, est_nome; estoques passa a usar etq_*.
--
-- IMPORTANTE: Aplicar somente em bancos já migrados com o schema antigo (014 com est_*).
-- Instalações novas a partir do 014 atualizado já criam estoques com etq_* — não rodar 016.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Renomear colunas (ordem independente)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_id TO etq_id;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_uuid TO etq_uuid;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_quantidade_disponivel TO etq_quantidade_disponivel;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_quantidade_reservada TO etq_quantidade_reservada;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_preco_venda TO etq_preco_venda;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_valor_custo_atual TO etq_valor_custo_atual;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_ultimo_custo_calculado TO etq_ultimo_custo_calculado;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_ativo TO etq_ativo;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_criado_em TO etq_criado_em;
ALTER TABLE IF EXISTS estoques RENAME COLUMN est_atualizado_em TO etq_atualizado_em;

-- -----------------------------------------------------------------------------
-- 2. Sequência do BIGSERIAL (nome legado estoques_est_id_seq)
-- -----------------------------------------------------------------------------
ALTER SEQUENCE IF EXISTS estoques_est_id_seq RENAME TO estoques_etq_id_seq;

-- -----------------------------------------------------------------------------
-- 3. Trigger de timestamp: atualizar referência à coluna renomeada
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp_livros_estoque()
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

COMMIT;
