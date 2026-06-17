-- =============================================================================
-- DML 004 — Seed de Cartões de Crédito para Clientes
-- Sistema: LES – E-Commerce de Livros
-- Execute após 003_seed_multi_tenant_completo.sql
--
-- Este script cria cartões de crédito de teste para os clientes
-- criados no 003_seed_multi_tenant_completo.sql.
--
-- Tokens são de teste e não são cartões reais.
-- =============================================================================

DO $$
DECLARE
    v_bandeira_visa INTEGER;
    v_bandeira_mastercard INTEGER;
    v_bandeira_elo INTEGER;
BEGIN
    -- Obter IDs das bandeiras
    SELECT ban_id INTO v_bandeira_visa FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1;
    SELECT ban_id INTO v_bandeira_mastercard FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Mastercard' LIMIT 1;
    SELECT ban_id INTO v_bandeira_elo FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Elo' LIMIT 1;
    
    -- Criar bandeiras se não existirem
    IF v_bandeira_visa IS NULL THEN
        INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao) VALUES ('Visa') ON CONFLICT (ban_descricao) DO NOTHING;
        SELECT ban_id INTO v_bandeira_visa FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1;
    END IF;
    
    IF v_bandeira_mastercard IS NULL THEN
        INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao) VALUES ('Mastercard') ON CONFLICT (ban_descricao) DO NOTHING;
        SELECT ban_id INTO v_bandeira_mastercard FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Mastercard' LIMIT 1;
    END IF;
    
    IF v_bandeira_elo IS NULL THEN
        INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao) VALUES ('Elo') ON CONFLICT (ban_descricao) DO NOTHING;
        SELECT ban_id INTO v_bandeira_elo FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Elo' LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- CARTÕES PARA CLIENTES DE SÃO PAULO
    -- ========================================================================
    
    -- Cartão para Fernanda Santos (Visa)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'fernanda.santos@email.com' LIMIT 1),
        v_bandeira_visa,
        'tok_visa_test_1234567890',
        '1234',
        'FERNANDA SANTOS',
        (CURRENT_DATE + INTERVAL '2 years')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- Cartão para Lucas Pereira (Mastercard)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'lucas.pereira@email.com' LIMIT 1),
        v_bandeira_mastercard,
        'tok_master_test_9876543210',
        '5678',
        'LUCAS PEREIRA',
        (CURRENT_DATE + INTERVAL '3 years')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- Cartão para Juliana Lima (Elo)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'juliana.lima@email.com' LIMIT 1),
        v_bandeira_elo,
        'tok_elo_test_1122334455',
        '9012',
        'JULIANA LIMA',
        (CURRENT_DATE + INTERVAL '1 year')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- ========================================================================
    -- CARTÕES PARA CLIENTES DO RIO DE JANEIRO
    -- ========================================================================
    
    -- Cartão para Marcos Almeida (Visa)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'marcos.almeida@email.com' LIMIT 1),
        v_bandeira_visa,
        'tok_visa_test_2233445566',
        '3456',
        'MARCOS ALMEIDA',
        (CURRENT_DATE + INTERVAL '2 years')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- Cartão para Carla Rodrigues (Mastercard)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'carla.rodrigues@email.com' LIMIT 1),
        v_bandeira_mastercard,
        'tok_master_test_7788990011',
        '7890',
        'CARLA RODRIGUES',
        (CURRENT_DATE + INTERVAL '3 years')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- Cartão para Rafael Gomes (Elo)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'rafael.gomes@email.com' LIMIT 1),
        v_bandeira_elo,
        'tok_elo_test_3344556677',
        '1122',
        'RAFAEL GOMES',
        (CURRENT_DATE + INTERVAL '1 year')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- ========================================================================
    -- CARTÕES PARA CLIENTES DE BELO HORIZONTE
    -- ========================================================================
    
    -- Cartão para Patricia Martins (Visa)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'patricia.martins@email.com' LIMIT 1),
        v_bandeira_visa,
        'tok_visa_test_4455667788',
        '5566',
        'PATRICIA MARTINS',
        (CURRENT_DATE + INTERVAL '2 years')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- Cartão para André Souza (Mastercard)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'andre.souza@email.com' LIMIT 1),
        v_bandeira_mastercard,
        'tok_master_test_9900112233',
        '3344',
        'ANDRE SOUZA',
        (CURRENT_DATE + INTERVAL '3 years')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    -- Cartão para Mariana Ferreira (Elo)
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_email = 'mariana.ferreira@email.com' LIMIT 1),
        v_bandeira_elo,
        'tok_elo_test_5566778899',
        '7788',
        'MARIANA FERREIRA',
        (CURRENT_DATE + INTERVAL '1 year')::date,
        TRUE
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Seed de cartões de crédito criado com sucesso!';
    RAISE NOTICE '9 cartões criados (1 por cliente) com bandeiras Visa, Mastercard e Elo.';
END;
$$;
