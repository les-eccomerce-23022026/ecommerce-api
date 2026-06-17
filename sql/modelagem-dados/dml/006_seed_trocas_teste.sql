-- =============================================================================
-- DML 006 — Seed de Trocas/Devoluções para Testes
-- Sistema: LES – E-Commerce de Livros
-- Execute após 005_seed_vendas_teste.sql
--
-- Este script cria solicitações de troca para testar o fluxo de trocas/devoluções.
--
-- Cenários criados:
-- - Venda com status EM TROCA (solicitação enviada)
-- - Cupom de troca gerado para o cliente
-- - Item da venda marcado como em troca
-- =============================================================================

DO $$
DECLARE
    v_status_em_troca INTEGER;
    v_status_troca_concluida INTEGER;
    v_usu_fernanda INTEGER;
    v_ven_fernanda_entregue INTEGER;
    v_liv_sociedade_anel UUID;
BEGIN
    -- Obter IDs dos status de troca
    SELECT stv_id INTO v_status_em_troca FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM TROCA' LIMIT 1;
    SELECT stv_id INTO v_status_troca_concluida FROM livraria_comercial.status_venda WHERE stv_descricao = 'TROCA CONCLUÍDA' LIMIT 1;
    
    -- Obter ID da usuária Fernanda
    SELECT usu_id INTO v_usu_fernanda FROM livraria_gestao.usuarios WHERE usu_email = 'fernanda.santos@email.com' LIMIT 1;
    
    -- Obter ID da venda entregue da Fernanda
    SELECT ven_id INTO v_ven_fernanda_entregue 
    FROM livraria_comercial.vendas 
    WHERE usu_id = v_usu_fernanda 
      AND stv_id = (SELECT stv_id FROM livraria_comercial.status_venda WHERE stv_descricao = 'ENTREGUE' LIMIT 1)
    ORDER BY ven_criado_em DESC 
    LIMIT 1;
    
    -- Obter UUID do livro A Sociedade do Anel
    SELECT liv_uuid INTO v_liv_sociedade_anel FROM livraria_comercial.livros WHERE liv_isbn = '9788532510776' LIMIT 1;
    
    -- ========================================================================
    -- CENÁRIO 1: Solicitação de Troca - EM TROCA
    -- ========================================================================
    
    -- Atualizar status da venda para EM TROCA
    UPDATE livraria_comercial.vendas
    SET stv_id = v_status_em_troca,
        ven_atualizado_em = NOW(),
        ven_motivo_troca = 'Produto veio com folhas amassadas e capa rasgada.'
    WHERE ven_id = v_ven_fernanda_entregue;
    
    -- Marcar o item da venda como estando em troca
    UPDATE livraria_comercial.itens_venda
    SET itv_em_troca = TRUE,
        itv_atualizado_em = NOW()
    WHERE ven_id = v_ven_fernanda_entregue
      AND liv_uuid = v_liv_sociedade_anel;
    
    -- ========================================================================
    -- CENÁRIO 2: Cupom de Troca Gerado
    -- ========================================================================
    
    INSERT INTO livraria_comercial.cupons_troca (
        cpt_uuid, cpt_codigo, cpt_valor, cpt_cliente_id, cpt_venda_origem_id,
        cpt_status, cpt_valido_ate, cpt_criado_em
    )
    VALUES (
        gen_random_uuid(),
        'TROCA-' || substr(md5(random()::text), 1, 8),
        59.90,  -- valor do livro sendo trocado
        v_usu_fernanda,
        v_ven_fernanda_entregue,
        'DISPONIVEL',
        NOW() + INTERVAL '6 months',
        NOW()
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Seed de trocas criado com sucesso!';
    RAISE NOTICE 'Venda atualizada para status EM TROCA com motivo.';
    RAISE NOTICE 'Item marcado como em troca.';
    RAISE NOTICE 'Cupom de troca gerado para o cliente.';
END;
$$;
