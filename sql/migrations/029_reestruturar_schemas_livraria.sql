-- Migration: Reestruturação de Schemas - les -> livraria com subdivisão por contexto limitado
-- Version: 029
-- Autor: DBA Sênior
-- Descrição: Renomeia schema les para livraria e cria subdivisões por contexto limitado (DDD)

BEGIN;

-- ============================================
-- PASSO 1: Renomear schema les para livraria
-- ============================================
ALTER SCHEMA les RENAME TO livraria;

-- ============================================
-- PASSO 2: Criar schemas subdivididos por contexto limitado
-- ============================================
CREATE SCHEMA IF NOT EXISTS livraria_comercial;
CREATE SCHEMA IF NOT EXISTS livraria_logistica;
CREATE SCHEMA IF NOT EXISTS livraria_financeiro;
CREATE SCHEMA IF NOT EXISTS livraria_catalogo;
CREATE SCHEMA IF NOT EXISTS livraria_gestao;
CREATE SCHEMA IF NOT EXISTS livraria_ref;
CREATE SCHEMA IF NOT EXISTS livraria_audit;

-- ============================================
-- PASSO 3: Mover tabelas para schemas por contexto limitado
-- ============================================

-- Contexto: Comercial (Vendas)
ALTER TABLE livraria.vendas SET SCHEMA livraria_comercial;
ALTER TABLE livraria.itens_venda SET SCHEMA livraria_comercial;
ALTER TABLE livraria.carrinho_itens SET SCHEMA livraria_comercial;
ALTER TABLE livraria.status_vendas SET SCHEMA livraria_comercial;

-- Contexto: Logística (Entregas)
ALTER TABLE livraria.entregas SET SCHEMA livraria_logistica;
ALTER TABLE livraria.tipos_frete SET SCHEMA livraria_logistica;
ALTER TABLE livraria.cotacao_frete SET SCHEMA livraria_logistica;
ALTER TABLE livraria.cotacao_frete_simulada SET SCHEMA livraria_logistica;

-- Contexto: Financeiro (Pagamentos)
ALTER TABLE livraria.pagamento SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.cartao_pagamento SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.cartoes SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.bandeiras_cartao SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.tipo_pagamento SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.status_pagamento SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.intencao_pagamento SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.intencao_pagamento_simulado SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.intencao_pagamento_stripe SET SCHEMA livraria_financeiro;
ALTER TABLE livraria.pagamento_pix_simulado SET SCHEMA livraria_financeiro;
-- Tabelas que ainda estão no public (não foram movidas na migration 025)
ALTER TABLE public.cupom SET SCHEMA livraria_financeiro;
ALTER TABLE public.cupons_troca SET SCHEMA livraria_financeiro;

-- Contexto: Catálogo (Livros)
ALTER TABLE livraria.livros SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.autores SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.editoras SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.categorias SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.livro_categorias SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.fornecedores SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.grupos_precificacao SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.estoques SET SCHEMA livraria_catalogo;
ALTER TABLE livraria.avaliacoes_livro SET SCHEMA livraria_catalogo;

-- Contexto: Gestão (Clientes/Usuários)
ALTER TABLE livraria.usuarios SET SCHEMA livraria_gestao;
ALTER TABLE livraria.clientes SET SCHEMA livraria_gestao;
ALTER TABLE livraria.papeis SET SCHEMA livraria_gestao;
ALTER TABLE livraria.telefones SET SCHEMA livraria_gestao;
ALTER TABLE livraria.enderecos SET SCHEMA livraria_gestao;
ALTER TABLE livraria.configuracoes_app SET SCHEMA livraria_gestao;

-- Contexto: Ref (Dados de referência/master data)
ALTER TABLE livraria.tipos_telefones SET SCHEMA livraria_ref;
ALTER TABLE livraria.tipos_logradouros SET SCHEMA livraria_ref;
ALTER TABLE livraria.tipos_residencias SET SCHEMA livraria_ref;
ALTER TABLE livraria.paises SET SCHEMA livraria_ref;
ALTER TABLE livraria.estados SET SCHEMA livraria_ref;
ALTER TABLE livraria.cidades SET SCHEMA livraria_ref;
ALTER TABLE livraria.bairros SET SCHEMA livraria_ref;
ALTER TABLE livraria.ceps SET SCHEMA livraria_ref;
ALTER TABLE livraria.logradouros SET SCHEMA livraria_ref;

-- Contexto: Audit (Auditoria e logs)
ALTER TABLE livraria.historico_entradas_estoque SET SCHEMA livraria_audit;

-- ============================================
-- PASSO 4: Mover funções para schema principal livraria
-- ============================================
-- As funções estão no schema les (agora livraria após renomeação)
-- Não é necessário mover, pois já estão no schema principal após o renomeação
-- Se necessário, podemos reorganizar depois

-- ============================================
-- PASSO 5: Remover tabelas duplicadas do schema public
-- ============================================
-- Tabelas que existem em ambos os schemas (remover do public)
DROP TABLE IF EXISTS public.autores CASCADE;
DROP TABLE IF EXISTS public.avaliacoes_livro CASCADE;
DROP TABLE IF EXISTS public.bairros CASCADE;
DROP TABLE IF EXISTS public.bandeiras_cartao CASCADE;
DROP TABLE IF EXISTS public.carrinho_itens CASCADE;
DROP TABLE IF EXISTS public.cartao_pagamento CASCADE;
DROP TABLE IF EXISTS public.cartoes CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.ceps CASCADE;
DROP TABLE IF EXISTS public.cidades CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.configuracoes_app CASCADE;
DROP TABLE IF EXISTS public.cotacao_frete CASCADE;
DROP TABLE IF EXISTS public.cotacao_frete_simulada CASCADE;
DROP TABLE IF EXISTS public.editoras CASCADE;
DROP TABLE IF EXISTS public.enderecos CASCADE;
DROP TABLE IF EXISTS public.entregas CASCADE;
DROP TABLE IF EXISTS public.estados CASCADE;
DROP TABLE IF EXISTS public.estoques CASCADE;
DROP TABLE IF EXISTS public.fornecedores CASCADE;
DROP TABLE IF EXISTS public.grupos_precificacao CASCADE;
DROP TABLE IF EXISTS public.historico_entradas_estoque CASCADE;
DROP TABLE IF EXISTS public.intencao_pagamento CASCADE;
DROP TABLE IF EXISTS public.intencao_pagamento_simulado CASCADE;
DROP TABLE IF EXISTS public.intencao_pagamento_stripe CASCADE;
DROP TABLE IF EXISTS public.itens_venda CASCADE;
DROP TABLE IF EXISTS public.livro_categorias CASCADE;
DROP TABLE IF EXISTS public.livros CASCADE;
DROP TABLE IF EXISTS public.logradouros CASCADE;
DROP TABLE IF EXISTS public.pagamento CASCADE;
DROP TABLE IF EXISTS public.pagamento_pix_simulado CASCADE;
DROP TABLE IF EXISTS public.paises CASCADE;
DROP TABLE IF EXISTS public.papeis CASCADE;
DROP TABLE IF EXISTS public.status_pagamento CASCADE;
DROP TABLE IF EXISTS public.status_vendas CASCADE;
DROP TABLE IF EXISTS public.telefones CASCADE;
DROP TABLE IF EXISTS public.tipo_pagamento CASCADE;
DROP TABLE IF EXISTS public.tipos_frete CASCADE;
DROP TABLE IF EXISTS public.tipos_logradouros CASCADE;
DROP TABLE IF EXISTS public.tipos_residencias CASCADE;
DROP TABLE IF EXISTS public.tipos_telefones CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.vendas CASCADE;

-- ============================================
-- PASSO 6: Configurar permissões nos novos schemas
-- ============================================
DO $$
DECLARE
    curr_user text;
BEGIN
    SELECT current_user INTO curr_user;
    
    -- Permissões para schema principal livraria
    EXECUTE 'GRANT USAGE ON SCHEMA livraria TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA livraria TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria GRANT ALL ON SEQUENCES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria GRANT ALL ON FUNCTIONS TO ' || curr_user;
    
    -- Permissões para schemas subdivididos
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_comercial TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_comercial TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_comercial TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_comercial GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_comercial GRANT ALL ON SEQUENCES TO ' || curr_user;
    
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_logistica TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_logistica TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_logistica TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_logistica GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_logistica GRANT ALL ON SEQUENCES TO ' || curr_user;
    
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_financeiro TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_financeiro TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_financeiro TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_financeiro GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_financeiro GRANT ALL ON SEQUENCES TO ' || curr_user;
    
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_catalogo TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_catalogo TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_catalogo TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_catalogo GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_catalogo GRANT ALL ON SEQUENCES TO ' || curr_user;
    
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_gestao TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_gestao TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_gestao TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_gestao GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_gestao GRANT ALL ON SEQUENCES TO ' || curr_user;
    
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_ref TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_ref TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_ref TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_ref GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_ref GRANT ALL ON SEQUENCES TO ' || curr_user;
    
    EXECUTE 'GRANT USAGE ON SCHEMA livraria_audit TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA livraria_audit TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA livraria_audit TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_audit GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA livraria_audit GRANT ALL ON SEQUENCES TO ' || curr_user;
END $$;

-- ============================================
-- PASSO 7: Atualizar search_path para incluir novos schemas
-- ============================================
-- Nota: O search_path será configurado na conexão do backend
-- Ordem recomendada: contextos específicos primeiro, depois principal, depois public
-- Exemplo: livraria_comercial, livraria_logistica, livraria_financeiro, livraria_catalogo, livraria_gestao, livraria_ref, livraria_audit, livraria, public

COMMIT;

-- ============================================
-- PÓS-MIGRAÇÃO: Instruções para o Backend
-- ============================================
-- 1. Atualizar ConexaoPostgres.ts para usar search_path correto
-- 2. Atualizar queries que fazem referência explícita ao schema 'les' para 'livraria'
-- 3. Verificar se há views ou procedures que precisam ser atualizadas
-- 4. Executar testes de integração para validar a migração
