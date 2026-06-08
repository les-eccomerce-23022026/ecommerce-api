-- Migration 090: Seed completo para cliente de teste (BDD 7ª Entrega)
-- Cria endereço, cartão e cupom de troca para o cliente clientetest@email.com

BEGIN;

DO $$
DECLARE
    v_usu_id BIGINT;
    v_loj_id BIGINT;
    v_bandeira_visa INTEGER;
    v_end_id BIGINT;
    v_car_id BIGINT;
    v_cup_id BIGINT;
BEGIN
    -- Buscar usuário cliente de teste
    SELECT usu_id, loj_id INTO v_usu_id, v_loj_id
    FROM livraria_gestao.usuarios
    WHERE usu_email = 'clientetest@email.com'
    LIMIT 1;

    IF v_usu_id IS NULL THEN
        RAISE EXCEPTION 'Cliente de teste não encontrado. Execute o seed 005 primeiro.';
    END IF;

    -- Buscar bandeira Visa
    SELECT ban_id INTO v_bandeira_visa
    FROM livraria_financeiro.bandeiras_cartao
    WHERE ban_descricao = 'Visa'
    LIMIT 1;

    IF v_bandeira_visa IS NULL THEN
        INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao) VALUES ('Visa')
        ON CONFLICT (ban_descricao) DO NOTHING;
        SELECT ban_id INTO v_bandeira_visa
        FROM livraria_financeiro.bandeiras_cartao
        WHERE ban_descricao = 'Visa'
        LIMIT 1;
    END IF;

    -- Criar endereço para o cliente (schema: livraria_gestao)
    -- Primeiro verificar se já existe endereço principal
    SELECT end_id INTO v_end_id FROM livraria_gestao.enderecos 
    WHERE usu_id = v_usu_id AND end_principal = TRUE 
    LIMIT 1;

    IF v_end_id IS NULL THEN
        INSERT INTO livraria_gestao.enderecos (
            end_uuid, end_tipo, end_numero, end_complemento,
            end_principal, usu_id, loj_id, pai_id
        )
        VALUES (
            gen_random_uuid(),
            'entrega',
            '123',
            'Apto 1',
            TRUE,
            v_usu_id,
            v_loj_id,
            1
        )
        RETURNING end_id INTO v_end_id;
    END IF;

    RAISE NOTICE 'Endereço criado para cliente test: end_id=%', v_end_id;

    -- Criar cartão para o cliente (schema: livraria_financeiro)
    -- Primeiro, remover a flag principal de todos os cartões existentes do usuário
    UPDATE livraria_financeiro.cartoes
    SET crt_principal = FALSE
    WHERE usu_id = v_usu_id;

    -- Inserir o novo cartão como principal
    INSERT INTO livraria_financeiro.cartoes (
        crt_uuid, usu_id, ban_id, crt_token, crt_final,
        crt_nome_impresso, crt_validade, crt_principal
    )
    VALUES (
        gen_random_uuid(),
        v_usu_id,
        v_bandeira_visa,
        'tok_visa_test_bdd_7',
        '1234',
        'CLIENTE TESTE',
        (CURRENT_DATE + INTERVAL '2 years')::date,
        TRUE
    )
    ON CONFLICT (usu_id, crt_token) DO UPDATE SET
        crt_final = EXCLUDED.crt_final,
        crt_nome_impresso = EXCLUDED.crt_nome_impresso,
        crt_validade = EXCLUDED.crt_validade,
        crt_principal = TRUE
    RETURNING crt_id INTO v_car_id;

    IF v_car_id IS NULL THEN
        SELECT crt_id INTO v_car_id FROM livraria_financeiro.cartoes WHERE usu_id = v_usu_id LIMIT 1;
    END IF;

    RAISE NOTICE 'Cartão criado para cliente test: crt_id=%', v_car_id;

    -- Criar cupom de troca para o cliente (schema: livraria_comercial)
    INSERT INTO livraria_comercial.cupom (
        cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
        cup_ativo, cup_valido_ate, loj_id
    )
    VALUES (
        gen_random_uuid(),
        'TROCA-TESTE-BDD-7',
        'troca',
        50.00,
        0,
        TRUE,
        (CURRENT_DATE + INTERVAL '6 months')::date,
        v_loj_id
    )
    ON CONFLICT (cup_codigo) DO UPDATE SET
        cup_valor_desconto = EXCLUDED.cup_valor_desconto,
        cup_ativo = TRUE,
        cup_valido_ate = EXCLUDED.cup_valido_ate
    RETURNING cup_id INTO v_cup_id;

    IF v_cup_id IS NULL THEN
        SELECT cup_id INTO v_cup_id FROM livraria_comercial.cupom WHERE cup_codigo = 'TROCA-TESTE-BDD-7' LIMIT 1;
    END IF;

    RAISE NOTICE 'Cupom de troca criado para cliente test: cup_id=%, codigo=TROCA-TESTE-BDD-7, valor=50.00', v_cup_id;

END $$;

COMMIT;
