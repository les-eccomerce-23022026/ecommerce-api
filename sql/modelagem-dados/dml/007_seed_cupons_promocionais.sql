-- =============================================================================
-- DML 007 — Seed de Cupons Promocionais para Testes
-- Sistema: LES – E-Commerce de Livros
-- Execute após 003_seed_multi_tenant_completo.sql e migration 068
--
-- Este script cria cupons promocionais de teste para testar
-- o fluxo de aplicação de descontos em compras.
--
-- ✅ SUPORTE MULTI-TENANCY:
-- A partir da migration 068, as tabelas de cupons têm campo loj_id.
-- - Cupons com loj_id = NULL são GLOBAIS (admin_sistema)
-- - Cupons com loj_id preenchido são ESPECÍFICOS DA LOJA (admin_loja)
--
-- Cenários criados:
-- - 2 cupons globais (admin_sistema)
-- - 2 cupons específicos por loja (admin_loja)
-- - 1 cupom expirado para teste
-- =============================================================================

DO $$
DECLARE
    v_loj_sp BIGINT;
    v_loj_rj BIGINT;
    v_loj_bh BIGINT;
BEGIN
    -- ========================================================================
    -- Obter IDs das lojas
    -- ========================================================================
    
    SELECT loj_id INTO v_loj_sp FROM livraria_gestao.lojas WHERE loj_slug = 'loja-a-multi-tenancy';
    SELECT loj_id INTO v_loj_rj FROM livraria_gestao.lojas WHERE loj_slug = 'loja-b-multi-tenancy';
    SELECT loj_id INTO v_loj_bh FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-teste';
    
    -- ========================================================================
    -- CUPONS GLOBAIS (admin_sistema - loj_id = NULL)
    -- ========================================================================
    
    -- CUPOM 1: PRIMEIRA10 - 10% de desconto (GLOBAL)
    INSERT INTO livraria_comercial.cupom (
        cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
        cup_uso_maximo, cup_uso_atual, cup_valido_de, cup_valido_ate,
        cup_ativo, cup_criado_em, cup_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'PRIMEIRA10',
        'promocional',
        10.00,
        0,
        100,
        0,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '3 months',
        TRUE,
        NOW(),
        NOW(),
        NULL
    )
    ON CONFLICT (cup_codigo) DO UPDATE SET
        cup_ativo = TRUE,
        cup_valido_ate = EXCLUDED.cup_valido_ate,
        loj_id = EXCLUDED.loj_id;
    
    -- CUPOM 2: FIXO20 - R$ 20,00 de desconto (GLOBAL)
    INSERT INTO livraria_comercial.cupom (
        cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
        cup_uso_maximo, cup_uso_atual, cup_valido_de, cup_valido_ate,
        cup_ativo, cup_criado_em, cup_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'FIXO20',
        'promocional',
        20.00,
        50,
        50,
        0,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '2 months',
        TRUE,
        NOW(),
        NOW(),
        NULL
    )
    ON CONFLICT (cup_codigo) DO UPDATE SET
        cup_ativo = TRUE,
        cup_valido_ate = EXCLUDED.cup_valido_ate,
        loj_id = EXCLUDED.loj_id;
    
    -- ========================================================================
    -- CUPONS ESPECÍFICOS POR LOJA (admin_loja - loj_id preenchido)
    -- ========================================================================
    
    -- CUPOM 3: SP-PROMO15 - 15% de desconto (Livraria São Paulo)
    INSERT INTO livraria_comercial.cupom (
        cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
        cup_uso_maximo, cup_uso_atual, cup_valido_de, cup_valido_ate,
        cup_ativo, cup_criado_em, cup_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'SP-PROMO15',
        'promocional',
        15.00,
        0,
        200,
        0,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 months',
        TRUE,
        NOW(),
        NOW(),
        v_loj_sp
    )
    ON CONFLICT (cup_codigo) DO UPDATE SET
        cup_ativo = TRUE,
        cup_valido_ate = EXCLUDED.cup_valido_ate,
        loj_id = EXCLUDED.loj_id;
    
    -- CUPOM 4: RJ-PROMO12 - 12% de desconto (Livraria Rio de Janeiro)
    INSERT INTO livraria_comercial.cupom (
        cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
        cup_uso_maximo, cup_uso_atual, cup_valido_de, cup_valido_ate,
        cup_ativo, cup_criado_em, cup_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'RJ-PROMO12',
        'promocional',
        12.00,
        0,
        150,
        0,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '4 months',
        TRUE,
        NOW(),
        NOW(),
        v_loj_rj
    )
    ON CONFLICT (cup_codigo) DO UPDATE SET
        cup_ativo = TRUE,
        cup_valido_ate = EXCLUDED.cup_valido_ate,
        loj_id = EXCLUDED.loj_id;
    
    -- ========================================================================
    -- CUPOM EXPIRADO PARA TESTE (GLOBAL)
    -- ========================================================================
    
    INSERT INTO livraria_comercial.cupom (
        cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
        cup_uso_maximo, cup_uso_atual, cup_valido_de, cup_valido_ate,
        cup_ativo, cup_criado_em, cup_atualizado_em, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'EXPIRADO10',
        'promocional',
        10.00,
        0,
        100,
        0,
        CURRENT_DATE - INTERVAL '2 months',
        CURRENT_DATE - INTERVAL '1 month',
        FALSE,
        NOW() - INTERVAL '2 months',
        NOW(),
        NULL
    )
    ON CONFLICT (cup_codigo) DO UPDATE SET
        cup_ativo = FALSE,
        cup_valido_ate = EXCLUDED.cup_valido_ate,
        loj_id = EXCLUDED.loj_id;
    
    RAISE NOTICE 'Seed de cupons promocionais criado com sucesso: 5 cupons criados (4 ativos, 1 expirado) - GLOBAIS: PRIMEIRA10, FIXO20 | POR LOJA: SP-PROMO15, RJ-PROMO12 | EXPIRADO: EXPIRADO10';
END;
$$;
