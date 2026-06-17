-- Script para cadastrar cartões e cupons de teste para o cliente de teste
-- Cliente de teste: clientetest@email.com (usu_id = 96, loj_id = 32)

DO $$
DECLARE
    v_usu_id INTEGER := 96;
    v_loj_id INTEGER := 32;
    v_ban_visa INTEGER := 4;
    v_ban_mastercard INTEGER := 5;
    v_ban_elo INTEGER := 6;
BEGIN
    -- Inserir 3 cartões diferentes para o cliente
    
    -- Cartão 1: Visa final 1111
    INSERT INTO livraria_financeiro.cartoes (usu_id, ban_id, crt_token, crt_final, crt_nome_impresso, crt_validade, crt_principal)
    VALUES (
        v_usu_id,
        v_ban_visa,
        'token_visa_1111_' || v_usu_id,
        '1111',
        'CLIENTE TESTE',
        (CURRENT_DATE + INTERVAL '3 years')::date,
        true
    ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
    
    -- Cartão 2: Mastercard final 2222
    INSERT INTO livraria_financeiro.cartoes (usu_id, ban_id, crt_token, crt_final, crt_nome_impresso, crt_validade, crt_principal)
    VALUES (
        v_usu_id,
        v_ban_mastercard,
        'token_mastercard_2222_' || v_usu_id,
        '2222',
        'CLIENTE TESTE',
        (CURRENT_DATE + INTERVAL '2 years')::date,
        false
    ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
    
    -- Cartão 3: Elo final 3333
    INSERT INTO livraria_financeiro.cartoes (usu_id, ban_id, crt_token, crt_final, crt_nome_impresso, crt_validade, crt_principal)
    VALUES (
        v_usu_id,
        v_ban_elo,
        'token_elo_3333_' || v_usu_id,
        '3333',
        'CLIENTE TESTE',
        (CURRENT_DATE + INTERVAL '4 years')::date,
        false
    ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
    
    RAISE NOTICE 'Cartões cadastrados com sucesso para o usuário %', v_usu_id;
END $$;

-- Inserir cupom da loja (específico para a loja do cliente)
INSERT INTO livraria_comercial.cupom (cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo, cup_uso_maximo, cup_valido_de, cup_valido_ate, cup_ativo, loj_id)
VALUES (
    'CUPOM-LOJA-TESTE',
    'promocional',
    10.00,
    50.00,
    100,
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '1 year')::date,
    true,
    32
) ON CONFLICT (cup_codigo) DO UPDATE SET
    cup_ativo = true,
    cup_valido_ate = (CURRENT_DATE + INTERVAL '1 year')::date;

-- Inserir cupom global (disponível para todas as lojas)
INSERT INTO livraria_comercial.cupom (cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo, cup_uso_maximo, cup_valido_de, cup_valido_ate, cup_ativo, loj_id)
VALUES (
    'CUPOM-GLOBAL-TESTE',
    'promocional',
    15.00,
    30.00,
    500,
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '1 year')::date,
    true,
    NULL
) ON CONFLICT (cup_codigo) DO UPDATE SET
    cup_ativo = true,
    cup_valido_ate = (CURRENT_DATE + INTERVAL '1 year')::date;

-- Exibir resultado
SELECT 'Cartões cadastrados:' as mensagem;
SELECT crt_id, crt_token, crt_final, ban_descricao 
FROM livraria_financeiro.cartoes c
JOIN livraria_financeiro.bandeiras_cartao b ON c.ban_id = b.ban_id
WHERE c.usu_id = 96;

SELECT 'Cupons cadastrados:' as mensagem;
SELECT cup_codigo, cup_tipo, cup_valor_desconto, loj_id, cup_ativo
FROM livraria_comercial.cupom
WHERE cup_codigo IN ('CUPOM-LOJA-TESTE', 'CUPOM-GLOBAL-TESTE');
