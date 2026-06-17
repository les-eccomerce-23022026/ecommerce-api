-- =============================================================================
-- DML 005 — Seed de Vendas/Pedidos para Testes
-- Sistema: LES – E-Commerce de Livros
-- Execute após 003_seed_multi_tenant_completo.sql e 004_seed_cartoes_clientes.sql
--
-- Este script cria vendas de teste com diferentes status para testar
-- o fluxo completo de compras, trocas e devoluções.
--
-- Cenários criados:
-- - Venda aprovada e entregue (para testar solicitação de troca)
-- - Venda em processamento
-- - Venda cancelada
-- - Venda em trânsito
-- =============================================================================

DO $$
DECLARE
    v_status_aprovada INTEGER;
    v_status_entregue INTEGER;
    v_status_em_processamento INTEGER;
    v_status_cancelada INTEGER;
    v_status_em_transito INTEGER;
    v_status_em_troca INTEGER;
    v_loj_sp INTEGER;
    v_loj_rj INTEGER;
    v_loj_bh INTEGER;
    v_usu_fernanda INTEGER;
    v_usu_lucas INTEGER;
    v_usu_marcos INTEGER;
    v_liv_sociedade_anel UUID;
    v_liv_harry_potter UUID;
    v_liv_duna UUID;
    v_liv_dom_casmurro UUID;
BEGIN
    -- Obter IDs dos status de venda
    SELECT stv_id INTO v_status_aprovada FROM livraria_comercial.status_venda WHERE stv_descricao = 'APROVADA' LIMIT 1;
    SELECT stv_id INTO v_status_entregue FROM livraria_comercial.status_venda WHERE stv_descricao = 'ENTREGUE' LIMIT 1;
    SELECT stv_id INTO v_status_em_processamento FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM PROCESSAMENTO' LIMIT 1;
    SELECT stv_id INTO v_status_cancelada FROM livraria_comercial.status_venda WHERE stv_descricao = 'CANCELADA' LIMIT 1;
    SELECT stv_id INTO v_status_em_transito FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM TRÂNSITO' LIMIT 1;
    SELECT stv_id INTO v_status_em_troca FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM TROCA' LIMIT 1;
    
    -- Obter IDs das lojas
    SELECT loj_id INTO v_loj_sp FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1;
    SELECT loj_id INTO v_loj_rj FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1;
    SELECT loj_id INTO v_loj_bh FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1;
    
    -- Obter IDs dos usuários
    SELECT usu_id INTO v_usu_fernanda FROM livraria_gestao.usuarios WHERE usu_email = 'fernanda.santos@email.com' LIMIT 1;
    SELECT usu_id INTO v_usu_lucas FROM livraria_gestao.usuarios WHERE usu_email = 'lucas.pereira@email.com' LIMIT 1;
    SELECT usu_id INTO v_usu_marcos FROM livraria_gestao.usuarios WHERE usu_email = 'marcos.almeida@email.com' LIMIT 1;
    
    -- Obter UUIDs dos livros
    SELECT liv_uuid INTO v_liv_sociedade_anel FROM livraria_comercial.livros WHERE liv_isbn = '9788532510776' LIMIT 1;
    SELECT liv_uuid INTO v_liv_harry_potter FROM livraria_comercial.livros WHERE liv_isbn = '9788532529631' LIMIT 1;
    SELECT liv_uuid INTO v_liv_duna FROM livraria_comercial.livros WHERE liv_isbn = '9788577105377' LIMIT 1;
    SELECT liv_uuid INTO v_liv_dom_casmurro FROM livraria_comercial.livros WHERE liv_isbn = '9788535902775' LIMIT 1;
    
    -- ========================================================================
    -- VENDA 1: Fernanda - APROVADA e ENTREGUE (para testar troca)
    -- ========================================================================
    
    INSERT INTO livraria_comercial.vendas (
        ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
        ven_criado_em, ven_atualizado_em, loj_id, ven_data_hora_entrega
    )
    VALUES (
        gen_random_uuid(),
        v_usu_fernanda,
        v_status_entregue,
        109.80,  -- 2 livros: 59.90 + 49.90
        15.00,   -- frete
        124.80,  -- total
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '1 day',
        v_loj_sp,
        NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING
    RETURNING ven_id INTO NULL;
    
    -- Itens da venda 1
    INSERT INTO livraria_comercial.itens_venda (
        itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
    )
    SELECT
        gen_random_uuid(),
        (SELECT ven_id FROM livraria_comercial.vendas WHERE usu_id = v_usu_fernanda AND stv_id = v_status_entregue ORDER BY ven_criado_em DESC LIMIT 1),
        v_liv_sociedade_anel,
        1,
        59.90,
        v_loj_sp
    ON CONFLICT DO NOTHING;
    
    INSERT INTO livraria_comercial.itens_venda (
        itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
    )
    SELECT
        gen_random_uuid(),
        (SELECT ven_id FROM livraria_comercial.vendas WHERE usu_id = v_usu_fernanda AND stv_id = v_status_entregue ORDER BY ven_criado_em DESC LIMIT 1),
        v_liv_harry_potter,
        1,
        49.90,
        v_loj_sp
    ON CONFLICT DO NOTHING;
    
    -- ========================================================================
    -- VENDA 2: Lucas - EM PROCESSAMENTO
    -- ========================================================================
    
    INSERT INTO livraria_comercial.vendas (
        ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
        ven_criado_em, ven_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        v_usu_lucas,
        v_status_em_processamento,
        39.90,
        12.00,
        51.90,
        NOW() - INTERVAL '1 hour',
        NOW(),
        v_loj_sp
    )
    ON CONFLICT DO NOTHING;
    
    -- Itens da venda 2
    INSERT INTO livraria_comercial.itens_venda (
        itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
    )
    SELECT
        gen_random_uuid(),
        (SELECT ven_id FROM livraria_comercial.vendas WHERE usu_id = v_usu_lucas AND stv_id = v_status_em_processamento ORDER BY ven_criado_em DESC LIMIT 1),
        v_liv_harry_potter,
        1,
        39.90,
        v_loj_sp
    ON CONFLICT DO NOTHING;
    
    -- ========================================================================
    -- VENDA 3: Marcos - CANCELADA
    -- ========================================================================
    
    INSERT INTO livraria_comercial.vendas (
        ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
        ven_criado_em, ven_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        v_usu_marcos,
        v_status_cancelada,
        69.90,
        18.00,
        87.90,
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '2 days',
        v_loj_rj
    )
    ON CONFLICT DO NOTHING;
    
    -- Itens da venda 3
    INSERT INTO livraria_comercial.itens_venda (
        itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
    )
    SELECT
        gen_random_uuid(),
        (SELECT ven_id FROM livraria_comercial.vendas WHERE usu_id = v_usu_marcos AND stv_id = v_status_cancelada ORDER BY ven_criado_em DESC LIMIT 1),
        v_liv_duna,
        1,
        69.90,
        v_loj_rj
    ON CONFLICT DO NOTHING;
    
    -- ========================================================================
    -- VENDA 4: Fernanda - EM TRÂNSITO
    -- ========================================================================
    
    INSERT INTO livraria_comercial.vendas (
        ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
        ven_criado_em, ven_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        v_usu_fernanda,
        v_status_em_transito,
        29.90,
        10.00,
        39.90,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day',
        v_loj_bh
    )
    ON CONFLICT DO NOTHING;
    
    -- Itens da venda 4
    INSERT INTO livraria_comercial.itens_venda (
        itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
    )
    SELECT
        gen_random_uuid(),
        (SELECT ven_id FROM livraria_comercial.vendas WHERE usu_id = v_usu_fernanda AND stv_id = v_status_em_transito ORDER BY ven_criado_em DESC LIMIT 1),
        v_liv_dom_casmurro,
        1,
        29.90,
        v_loj_bh
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Seed de vendas criado com sucesso!';
    RAISE NOTICE '4 vendas criadas com diferentes status (ENTREGUE, EM PROCESSAMENTO, CANCELADA, EM TRÂNSITO)';
END;
$$;
