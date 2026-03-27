-- Migration: 013_renomear_tabelas_entrega_plural_sem_prefixo.sql
-- Descrição: Renomeia as tabelas de logística e status para plural e sem o prefixo ecm_
-- Data: 2026-03-25

-- Tabela de Status: ecm_status_venda -> status_vendas
ALTER TABLE IF EXISTS ecm_status_venda RENAME TO status_vendas;

-- Tabela de Tipos de Frete: ecm_tipo_frete ou tipo_frete -> tipos_frete
ALTER TABLE IF EXISTS ecm_tipo_frete RENAME TO tipos_frete;
ALTER TABLE IF EXISTS tipo_frete RENAME TO tipos_frete;

-- Tabela de Entregas: ecm_entrega ou entrega -> entregas
ALTER TABLE IF EXISTS ecm_entrega RENAME TO entregas;
ALTER TABLE IF EXISTS entrega RENAME TO entregas;
