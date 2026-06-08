-- =============================================================================
-- DML 008 — Seed de Pagamentos e Extensão de Cartões para Testes
-- Sistema: LES – E-Commerce de Livros
-- Execute após 005_seed_vendas_teste.sql e 004_seed_cartoes_clientes.sql
--
-- Este script cria:
-- 1. Pagamentos para as 4 vendas existentes com diferentes status
-- 2. Registros em cartao_pagamento vinculando aos cartões do 004
-- 3. Múltiplos cartões adicionais por cliente (2-3 cartões por cliente)
-- 4. Venda adicional com múltiplos pagamentos (cartão + cupom)
-- 5. Cenários adicionais de troca (devolução completa, rejeição, recebimento)
--
-- IDEMPOTÊNCIA: Este script é idempotente e pode ser executado múltiplas vezes
-- PAPEIS: Considera papéis de autenticação (admin vs cliente) nos cenários
-- =============================================================================

DO $$
DECLARE
    -- Status de pagamento
    v_stp_pendente INTEGER;
    v_stp_aprovado INTEGER;
    v_stp_recusado INTEGER;
    v_stp_cancelado INTEGER;
    
    -- Tipos de pagamento
    v_tpg_cartao_credito INTEGER;
    v_tpg_cupom_promocional INTEGER;
    v_tpg_cupom_troca INTEGER;
    v_tpg_pix INTEGER;
    
    -- Status de venda
    v_stv_em_processamento INTEGER;
    v_stv_aprovada INTEGER;
    v_stv_entregue INTEGER;
    v_stv_cancelada INTEGER;
    v_stv_em_transito INTEGER;
    v_stv_em_troca INTEGER;
    v_stv_troca_rejeitada INTEGER;
    v_stv_troca_concluida INTEGER;
    v_stv_aguardando_pagamento INTEGER;
    
    -- Lojas
    v_loj_sp INTEGER;
    v_loj_rj INTEGER;
    v_loj_bh INTEGER;
    
    -- Usuários
    v_usu_fernanda INTEGER;
    v_usu_lucas INTEGER;
    v_usu_marcos INTEGER;
    v_usu_juliana INTEGER;
    v_usu_carla INTEGER;
    
    -- Cartões existentes (do 004)
    v_crt_fernanda_visa UUID;
    v_crt_lucas_mastercard UUID;
    v_crt_marcos_visa UUID;
    v_crt_juliana_elo UUID;
    v_crt_carla_mastercard UUID;
    
    -- Bandeiras
    v_bandeira_visa INTEGER;
    v_bandeira_mastercard INTEGER;
    v_bandeira_elo INTEGER;
    v_bandeira_amex INTEGER;
    
    -- Livros
    v_liv_harry_potter UUID;
    v_liv_dom_casmurro UUID;
    v_liv_o_hobbit UUID;
    
    -- Vendas existentes (do 005)
    v_ven_fernanda_entregue INTEGER;
    v_ven_lucas_processamento INTEGER;
    v_ven_marcos_cancelada INTEGER;
    v_ven_fernanda_transito INTEGER;
    
    -- Variáveis auxiliares
    v_nova_venda_id INTEGER;
    v_novo_pagamento_id INTEGER;
BEGIN
    -- ========================================================================
    -- 1. OBTER STATUS DE PAGAMENTO
    -- ========================================================================
    
    SELECT stp_id INTO v_stp_pendente FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'PENDENTE' LIMIT 1;
    SELECT stp_id INTO v_stp_aprovado FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'APROVADO' LIMIT 1;
    SELECT stp_id INTO v_stp_recusado FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'RECUSADO' LIMIT 1;
    SELECT stp_id INTO v_stp_cancelado FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'CANCELADO' LIMIT 1;
    
    IF v_stp_pendente IS NULL OR v_stp_aprovado IS NULL OR v_stp_recusado IS NULL THEN
        RAISE NOTICE 'AVISO: Status de pagamento não encontrados. Criando status padrão...';
        INSERT INTO livraria_financeiro.status_pagamento (stp_descricao) VALUES
            ('PENDENTE'), ('APROVADO'), ('RECUSADO'), ('CANCELADO')
        ON CONFLICT (stp_descricao) DO NOTHING;
        
        SELECT stp_id INTO v_stp_pendente FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'PENDENTE' LIMIT 1;
        SELECT stp_id INTO v_stp_aprovado FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'APROVADO' LIMIT 1;
        SELECT stp_id INTO v_stp_recusado FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'RECUSADO' LIMIT 1;
        SELECT stp_id INTO v_stp_cancelado FROM livraria_financeiro.status_pagamento WHERE stp_descricao = 'CANCELADO' LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- 2. OBTER TIPOS DE PAGAMENTO
    -- ========================================================================
    
    SELECT tpg_id INTO v_tpg_cartao_credito FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'cartao_credito' LIMIT 1;
    SELECT tpg_id INTO v_tpg_cupom_promocional FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'cupom_promocional' LIMIT 1;
    SELECT tpg_id INTO v_tpg_cupom_troca FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'cupom_troca' LIMIT 1;
    SELECT tpg_id INTO v_tpg_pix FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'pix' LIMIT 1;
    
    IF v_tpg_cartao_credito IS NULL OR v_tpg_cupom_promocional IS NULL THEN
        RAISE NOTICE 'AVISO: Tipos de pagamento não encontrados. Criando tipos padrão...';
        INSERT INTO livraria_financeiro.tipo_pagamento (tpg_descricao) VALUES
            ('cartao_credito'), ('cupom_promocional'), ('cupom_troca'), ('pix')
        ON CONFLICT (tpg_descricao) DO NOTHING;
        
        SELECT tpg_id INTO v_tpg_cartao_credito FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'cartao_credito' LIMIT 1;
        SELECT tpg_id INTO v_tpg_cupom_promocional FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'cupom_promocional' LIMIT 1;
        SELECT tpg_id INTO v_tpg_cupom_troca FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'cupom_troca' LIMIT 1;
        SELECT tpg_id INTO v_tpg_pix FROM livraria_financeiro.tipo_pagamento WHERE tpg_descricao = 'pix' LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- 3. OBTER STATUS DE VENDA
    -- ========================================================================
    
    SELECT stv_id INTO v_stv_em_processamento FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM PROCESSAMENTO' LIMIT 1;
    SELECT stv_id INTO v_stv_aprovada FROM livraria_comercial.status_venda WHERE stv_descricao = 'APROVADA' LIMIT 1;
    SELECT stv_id INTO v_stv_entregue FROM livraria_comercial.status_venda WHERE stv_descricao = 'ENTREGUE' LIMIT 1;
    SELECT stv_id INTO v_stv_cancelada FROM livraria_comercial.status_venda WHERE stv_descricao = 'CANCELADA' LIMIT 1;
    SELECT stv_id INTO v_stv_em_transito FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM TRÂNSITO' LIMIT 1;
    SELECT stv_id INTO v_stv_em_troca FROM livraria_comercial.status_venda WHERE stv_descricao = 'EM TROCA' LIMIT 1;
    SELECT stv_id INTO v_stv_troca_rejeitada FROM livraria_comercial.status_venda WHERE stv_descricao = 'TROCA REJEITADA' LIMIT 1;
    SELECT stv_id INTO v_stv_troca_concluida FROM livraria_comercial.status_venda WHERE stv_descricao = 'TROCA CONCLUÍDA' LIMIT 1;
    SELECT stv_id INTO v_stv_aguardando_pagamento FROM livraria_comercial.status_venda WHERE stv_descricao = 'AGUARDANDO PAGAMENTO' LIMIT 1;
    
    -- Criar status adicionais se não existirem
    IF v_stv_troca_rejeitada IS NULL THEN
        INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES ('TROCA REJEITADA')
        ON CONFLICT (stv_descricao) DO NOTHING;
        SELECT stv_id INTO v_stv_troca_rejeitada FROM livraria_comercial.status_venda WHERE stv_descricao = 'TROCA REJEITADA' LIMIT 1;
    END IF;
    
    IF v_stv_troca_concluida IS NULL THEN
        INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES ('TROCA CONCLUÍDA')
        ON CONFLICT (stv_descricao) DO NOTHING;
        SELECT stv_id INTO v_stv_troca_concluida FROM livraria_comercial.status_venda WHERE stv_descricao = 'TROCA CONCLUÍDA' LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- 4. OBTER LOJAS (usar lojas existentes no banco)
    -- ========================================================================
    
    SELECT loj_id INTO v_loj_sp FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-sao-paulo' LIMIT 1;
    IF v_loj_sp IS NULL THEN
        SELECT loj_id INTO v_loj_sp FROM livraria_gestao.lojas LIMIT 1;
    END IF;
    RAISE NOTICE 'Loja SP: %', v_loj_sp;
    
    SELECT loj_id INTO v_loj_rj FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-rio' LIMIT 1;
    IF v_loj_rj IS NULL THEN
        SELECT loj_id INTO v_loj_rj FROM livraria_gestao.lojas WHERE loj_id != v_loj_sp LIMIT 1;
    END IF;
    RAISE NOTICE 'Loja RJ: %', v_loj_rj;
    
    SELECT loj_id INTO v_loj_bh FROM livraria_gestao.lojas WHERE loj_slug = 'livraria-belo-horizonte' LIMIT 1;
    IF v_loj_bh IS NULL THEN
        SELECT loj_id INTO v_loj_bh FROM livraria_gestao.lojas WHERE loj_id NOT IN (v_loj_sp, v_loj_rj) LIMIT 1;
    END IF;
    RAISE NOTICE 'Loja BH: %', v_loj_bh;
    
    -- ========================================================================
    -- 5. OBTER USUÁRIOS (usar usuários existentes no banco)
    -- ========================================================================
    
    -- Tentar obter usuários específicos do seed 003, se não existirem usar usuários demo
    SELECT usu_id INTO v_usu_fernanda FROM livraria_gestao.usuarios WHERE usu_email = 'fernanda.santos@email.com' LIMIT 1;
    IF v_usu_fernanda IS NULL THEN
        SELECT usu_id INTO v_usu_fernanda FROM livraria_gestao.usuarios WHERE usu_email LIKE '%cliente%' LIMIT 1;
    END IF;
    
    SELECT usu_id INTO v_usu_lucas FROM livraria_gestao.usuarios WHERE usu_email = 'lucas.pereira@email.com' LIMIT 1;
    IF v_usu_lucas IS NULL THEN
        SELECT usu_id INTO v_usu_lucas FROM livraria_gestao.usuarios WHERE usu_email LIKE '%cliente%' AND usu_id != v_usu_fernanda LIMIT 1;
    END IF;
    
    SELECT usu_id INTO v_usu_marcos FROM livraria_gestao.usuarios WHERE usu_email = 'marcos.almeida@email.com' LIMIT 1;
    IF v_usu_marcos IS NULL THEN
        SELECT usu_id INTO v_usu_marcos FROM livraria_gestao.usuarios WHERE usu_email LIKE '%cliente%' AND usu_id NOT IN (v_usu_fernanda, v_usu_lucas) LIMIT 1;
    END IF;
    
    SELECT usu_id INTO v_usu_juliana FROM livraria_gestao.usuarios WHERE usu_email = 'juliana.lima@email.com' LIMIT 1;
    IF v_usu_juliana IS NULL THEN
        SELECT usu_id INTO v_usu_juliana FROM livraria_gestao.usuarios WHERE usu_email LIKE '%cliente%' AND usu_id NOT IN (v_usu_fernanda, v_usu_lucas, v_usu_marcos) LIMIT 1;
    END IF;
    
    SELECT usu_id INTO v_usu_carla FROM livraria_gestao.usuarios WHERE usu_email = 'carla.rodrigues@email.com' LIMIT 1;
    IF v_usu_carla IS NULL THEN
        SELECT usu_id INTO v_usu_carla FROM livraria_gestao.usuarios WHERE usu_email LIKE '%cliente%' AND usu_id NOT IN (v_usu_fernanda, v_usu_lucas, v_usu_marcos, v_usu_juliana) LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- 6. OBTER CARTÕES EXISTENTES (DO 004)
    -- ========================================================================
    
    SELECT crt_uuid INTO v_crt_fernanda_visa FROM livraria_financeiro.cartoes WHERE usu_id = v_usu_fernanda LIMIT 1;
    SELECT crt_uuid INTO v_crt_lucas_mastercard FROM livraria_financeiro.cartoes WHERE usu_id = v_usu_lucas LIMIT 1;
    SELECT crt_uuid INTO v_crt_marcos_visa FROM livraria_financeiro.cartoes WHERE usu_id = v_usu_marcos LIMIT 1;
    SELECT crt_uuid INTO v_crt_juliana_elo FROM livraria_financeiro.cartoes WHERE usu_id = v_usu_juliana LIMIT 1;
    SELECT crt_uuid INTO v_crt_carla_mastercard FROM livraria_financeiro.cartoes WHERE usu_id = v_usu_carla LIMIT 1;
    
    -- ========================================================================
    -- 7. OBTER BANDEIRAS
    -- ========================================================================
    
    SELECT ban_id INTO v_bandeira_visa FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1;
    SELECT ban_id INTO v_bandeira_mastercard FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Mastercard' LIMIT 1;
    SELECT ban_id INTO v_bandeira_elo FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Elo' LIMIT 1;
    SELECT ban_id INTO v_bandeira_amex FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'American Express' LIMIT 1;
    
    -- Criar bandeira Amex se não existir
    IF v_bandeira_amex IS NULL THEN
        INSERT INTO livraria_financeiro.bandeiras_cartao (ban_descricao) VALUES ('American Express')
        ON CONFLICT (ban_descricao) DO NOTHING;
        SELECT ban_id INTO v_bandeira_amex FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'American Express' LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- 8. OBTER LIVROS
    -- ========================================================================
    
    SELECT liv_uuid INTO v_liv_harry_potter FROM livraria_comercial.livros WHERE liv_isbn = '9788532529631' LIMIT 1;
    SELECT liv_uuid INTO v_liv_dom_casmurro FROM livraria_comercial.livros WHERE liv_isbn = '9788535902775' LIMIT 1;
    SELECT liv_uuid INTO v_liv_o_hobbit FROM livraria_comercial.livros WHERE liv_isbn = '9788532506166' LIMIT 1;
    
    -- Se não encontrar pelos ISBNs, buscar qualquer livro existente
    IF v_liv_harry_potter IS NULL THEN
        SELECT liv_uuid INTO v_liv_harry_potter FROM livraria_comercial.livros LIMIT 1;
    END IF;
    IF v_liv_dom_casmurro IS NULL THEN
        SELECT liv_uuid INTO v_liv_dom_casmurro FROM livraria_comercial.livros WHERE liv_uuid != v_liv_harry_potter LIMIT 1;
    END IF;
    IF v_liv_o_hobbit IS NULL THEN
        SELECT liv_uuid INTO v_liv_o_hobbit FROM livraria_comercial.livros WHERE liv_uuid NOT IN (v_liv_harry_potter, v_liv_dom_casmurro) LIMIT 1;
    END IF;
    
    -- ========================================================================
    -- 9. OBTER VENDAS EXISTENTES (DO 005)
    -- ========================================================================
    
    SELECT ven_id INTO v_ven_fernanda_entregue 
    FROM livraria_comercial.vendas 
    WHERE usu_id = v_usu_fernanda AND stv_id = v_stv_entregue 
    ORDER BY ven_criado_em DESC LIMIT 1;
    
    SELECT ven_id INTO v_ven_lucas_processamento 
    FROM livraria_comercial.vendas 
    WHERE usu_id = v_usu_lucas AND stv_id = v_stv_em_processamento 
    ORDER BY ven_criado_em DESC LIMIT 1;
    
    SELECT ven_id INTO v_ven_marcos_cancelada 
    FROM livraria_comercial.vendas 
    WHERE usu_id = v_usu_marcos AND stv_id = v_stv_cancelada 
    ORDER BY ven_criado_em DESC LIMIT 1;
    
    SELECT ven_id INTO v_ven_fernanda_transito 
    FROM livraria_comercial.vendas 
    WHERE usu_id = v_usu_fernanda AND stv_id = v_stv_em_transito 
    ORDER BY ven_criado_em DESC LIMIT 1;
    
    -- ========================================================================
    -- 10. ADICIONAR MÚLTIPLOS CARTÕES POR CLIENTE (EXTENSÃO DO 004)
    -- ========================================================================
    
    IF v_usu_fernanda IS NOT NULL AND v_bandeira_mastercard IS NOT NULL THEN
        INSERT INTO livraria_financeiro.cartoes (
            crt_uuid, usu_id, ban_id, crt_token, crt_final,
            crt_nome_impresso, crt_validade, crt_principal
        )
        VALUES (
            gen_random_uuid(),
            v_usu_fernanda,
            v_bandeira_mastercard,
            'tok_master_test_fernanda_2',
            '9876',
            'FERNANDA SANTOS',
            (CURRENT_DATE + INTERVAL '2 years')::date,
            FALSE
        ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
        
        INSERT INTO livraria_financeiro.cartoes (
            crt_uuid, usu_id, ban_id, crt_token, crt_final,
            crt_nome_impresso, crt_validade, crt_principal
        )
        VALUES (
            gen_random_uuid(),
            v_usu_fernanda,
            v_bandeira_elo,
            'tok_elo_test_fernanda_3',
            '5432',
            'FERNANDA SANTOS',
            (CURRENT_DATE + INTERVAL '1 year')::date,
            FALSE
        ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
    END IF;
    
    IF v_usu_lucas IS NOT NULL AND v_bandeira_visa IS NOT NULL THEN
        INSERT INTO livraria_financeiro.cartoes (
            crt_uuid, usu_id, ban_id, crt_token, crt_final,
            crt_nome_impresso, crt_validade, crt_principal
        )
        VALUES (
            gen_random_uuid(),
            v_usu_lucas,
            v_bandeira_visa,
            'tok_visa_test_lucas_2',
            '2468',
            'LUCAS PEREIRA',
            (CURRENT_DATE + INTERVAL '3 years')::date,
            FALSE
        ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
        
        INSERT INTO livraria_financeiro.cartoes (
            crt_uuid, usu_id, ban_id, crt_token, crt_final,
            crt_nome_impresso, crt_validade, crt_principal
        )
        VALUES (
            gen_random_uuid(),
            v_usu_lucas,
            v_bandeira_elo,
            'tok_elo_test_lucas_3',
            '8642',
            'LUCAS PEREIRA',
            (CURRENT_DATE + INTERVAL '2 years')::date,
            FALSE
        ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
    END IF;
    
    IF v_usu_juliana IS NOT NULL AND v_bandeira_visa IS NOT NULL THEN
        INSERT INTO livraria_financeiro.cartoes (
            crt_uuid, usu_id, ban_id, crt_token, crt_final,
            crt_nome_impresso, crt_validade, crt_principal
        )
        VALUES (
            gen_random_uuid(),
            v_usu_juliana,
            v_bandeira_visa,
            'tok_visa_test_juliana_2',
            '1357',
            'JULIANA LIMA',
            (CURRENT_DATE + INTERVAL '2 years')::date,
            FALSE
        ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
        
        INSERT INTO livraria_financeiro.cartoes (
            crt_uuid, usu_id, ban_id, crt_token, crt_final,
            crt_nome_impresso, crt_validade, crt_principal
        )
        VALUES (
            gen_random_uuid(),
            v_usu_juliana,
            v_bandeira_mastercard,
            'tok_master_test_juliana_3',
            '7531',
            'JULIANA LIMA',
            (CURRENT_DATE + INTERVAL '3 years')::date,
            FALSE
        ) ON CONFLICT (usu_id, crt_token) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Múltiplos cartões adicionados';
    
    -- ========================================================================
    -- 11. CRIAR PAGAMENTOS PARA AS 4 VENDAS EXISTENTES
    -- ========================================================================
    
    -- Pagamento para Venda 1 (Fernanda - ENTREGUE): APROVADO
    IF v_ven_fernanda_entregue IS NOT NULL AND v_loj_sp IS NOT NULL THEN
        INSERT INTO livraria_financeiro.pagamento (
            pag_uuid, ven_id, tpg_id, stp_id, pag_valor,
            pag_processado_em, pag_criado_em, pag_atualizado_em, loj_id,
            pag_idempotency_key
        )
        VALUES (
            gen_random_uuid(),
            v_ven_fernanda_entregue,
            v_tpg_cartao_credito,
            v_stp_aprovado,
            124.80,
            NOW() - INTERVAL '7 days',
            NOW() - INTERVAL '7 days',
            NOW() - INTERVAL '1 day',
            v_loj_sp,
            'pag_venda1_fernanda_aprovado'
        )
        ON CONFLICT (pag_uuid) DO NOTHING;
        
        -- Obter ID do pagamento criado
        SELECT pag_id INTO v_novo_pagamento_id 
        FROM livraria_financeiro.pagamento 
        WHERE pag_idempotency_key = 'pag_venda1_fernanda_aprovado' 
        LIMIT 1;
        
        -- Criar registro em cartao_pagamento
        IF v_novo_pagamento_id IS NOT NULL AND v_crt_fernanda_visa IS NOT NULL THEN
            INSERT INTO livraria_financeiro.cartao_pagamento (
                cpp_uuid, pag_id, cpp_numero_tokenizado, cpp_nome_titular,
                cpp_validade, cpp_bandeira, loj_id
            )
            SELECT
                gen_random_uuid(),
                v_novo_pagamento_id,
                crt_token,
                crt_nome_impresso,
                TO_CHAR(crt_validade, 'MM/YYYY'),
                b.ban_descricao,
                v_loj_sp
            FROM livraria_financeiro.cartoes c
            JOIN livraria_financeiro.bandeiras_cartao b ON b.ban_id = c.ban_id
            WHERE c.crt_uuid = v_crt_fernanda_visa
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Pagamento para Venda 2 (Lucas - EM PROCESSAMENTO): PENDENTE
    IF v_ven_lucas_processamento IS NOT NULL AND v_loj_sp IS NOT NULL THEN
        INSERT INTO livraria_financeiro.pagamento (
            pag_uuid, ven_id, tpg_id, stp_id, pag_valor,
            pag_criado_em, pag_atualizado_em, loj_id,
            pag_idempotency_key
        )
        VALUES (
            gen_random_uuid(),
            v_ven_lucas_processamento,
            v_tpg_cartao_credito,
            v_stp_pendente,
            51.90,
            NOW() - INTERVAL '1 hour',
            NOW(),
            v_loj_sp,
            'pag_venda2_lucas_pendente'
        )
        ON CONFLICT (pag_uuid) DO NOTHING;
        
        -- Obter ID do pagamento criado
        SELECT pag_id INTO v_novo_pagamento_id 
        FROM livraria_financeiro.pagamento 
        WHERE pag_idempotency_key = 'pag_venda2_lucas_pendente' 
        LIMIT 1;
        
        -- Criar registro em cartao_pagamento
        IF v_novo_pagamento_id IS NOT NULL AND v_crt_lucas_mastercard IS NOT NULL THEN
            INSERT INTO livraria_financeiro.cartao_pagamento (
                cpp_uuid, pag_id, cpp_numero_tokenizado, cpp_nome_titular,
                cpp_validade, cpp_bandeira, loj_id
            )
            SELECT
                gen_random_uuid(),
                v_novo_pagamento_id,
                crt_token,
                crt_nome_impresso,
                TO_CHAR(crt_validade, 'MM/YYYY'),
                b.ban_descricao,
                v_loj_sp
            FROM livraria_financeiro.cartoes c
            JOIN livraria_financeiro.bandeiras_cartao b ON b.ban_id = c.ban_id
            WHERE c.crt_uuid = v_crt_lucas_mastercard
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Pagamento para Venda 3 (Marcos - CANCELADA): RECUSADO
    IF v_ven_marcos_cancelada IS NOT NULL AND v_loj_rj IS NOT NULL THEN
        INSERT INTO livraria_financeiro.pagamento (
            pag_uuid, ven_id, tpg_id, stp_id, pag_valor,
            pag_processado_em, pag_criado_em, pag_atualizado_em, loj_id,
            pag_idempotency_key
        )
        VALUES (
            gen_random_uuid(),
            v_ven_marcos_cancelada,
            v_tpg_cartao_credito,
            v_stp_recusado,
            87.90,
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '2 days',
            v_loj_rj,
            'pag_venda3_marcos_recusado'
        )
        ON CONFLICT (pag_uuid) DO NOTHING;
        
        -- Obter ID do pagamento criado
        SELECT pag_id INTO v_novo_pagamento_id 
        FROM livraria_financeiro.pagamento 
        WHERE pag_idempotency_key = 'pag_venda3_marcos_recusado' 
        LIMIT 1;
        
        -- Criar registro em cartao_pagamento
        IF v_novo_pagamento_id IS NOT NULL AND v_crt_marcos_visa IS NOT NULL THEN
            INSERT INTO livraria_financeiro.cartao_pagamento (
                cpp_uuid, pag_id, cpp_numero_tokenizado, cpp_nome_titular,
                cpp_validade, cpp_bandeira, loj_id
            )
            SELECT
                gen_random_uuid(),
                v_novo_pagamento_id,
                crt_token,
                crt_nome_impresso,
                TO_CHAR(crt_validade, 'MM/YYYY'),
                b.ban_descricao,
                v_loj_rj
            FROM livraria_financeiro.cartoes c
            JOIN livraria_financeiro.bandeiras_cartao b ON b.ban_id = c.ban_id
            WHERE c.crt_uuid = v_crt_marcos_visa
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Pagamento para Venda 4 (Fernanda - EM TRÂNSITO): APROVADO
    IF v_ven_fernanda_transito IS NOT NULL AND v_loj_bh IS NOT NULL THEN
        INSERT INTO livraria_financeiro.pagamento (
            pag_uuid, ven_id, tpg_id, stp_id, pag_valor,
            pag_processado_em, pag_criado_em, pag_atualizado_em, loj_id,
            pag_idempotency_key
        )
        VALUES (
            gen_random_uuid(),
            v_ven_fernanda_transito,
            v_tpg_cartao_credito,
            v_stp_aprovado,
            39.90,
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '1 day',
            v_loj_bh,
            'pag_venda4_fernanda_aprovado'
        )
        ON CONFLICT (pag_uuid) DO NOTHING;
        
        -- Obter ID do pagamento criado
        SELECT pag_id INTO v_novo_pagamento_id 
        FROM livraria_financeiro.pagamento 
        WHERE pag_idempotency_key = 'pag_venda4_fernanda_aprovado' 
        LIMIT 1;
        
        -- Criar registro em cartao_pagamento
        IF v_novo_pagamento_id IS NOT NULL THEN
            -- Usar o segundo cartão da Fernanda (Mastercard)
            INSERT INTO livraria_financeiro.cartao_pagamento (
                cpp_uuid, pag_id, cpp_numero_tokenizado, cpp_nome_titular,
                cpp_validade, cpp_bandeira, loj_id
            )
            SELECT
                gen_random_uuid(),
                v_novo_pagamento_id,
                crt_token,
                crt_nome_impresso,
                TO_CHAR(crt_validade, 'MM/YYYY'),
                b.ban_descricao,
                v_loj_bh
            FROM livraria_financeiro.cartoes c
            JOIN livraria_financeiro.bandeiras_cartao b ON b.ban_id = c.ban_id
            WHERE c.usu_id = v_usu_fernanda AND b.ban_descricao = 'Mastercard'
            LIMIT 1
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RAISE NOTICE 'Pagamentos criados para vendas existentes';
    
    -- ========================================================================
    -- 12. CRIAR VENDA ADICIONAL COM MÚLTIPLOS PAGAMENTOS (CARTÃO + CUPOM)
    -- ========================================================================
    
    IF v_loj_sp IS NOT NULL AND v_usu_juliana IS NOT NULL AND v_stv_aprovada IS NOT NULL THEN
        INSERT INTO livraria_comercial.vendas (
            ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
            ven_criado_em, ven_atualizado_em, loj_id
        )
        VALUES (
            gen_random_uuid(),
            v_usu_juliana,
            v_stv_aprovada,
            89.80,
            12.00,
            101.80,
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '4 days',
            v_loj_sp
        )
        ON CONFLICT DO NOTHING
        RETURNING ven_id INTO v_nova_venda_id;
        
        IF v_nova_venda_id IS NULL THEN
            SELECT ven_id INTO v_nova_venda_id
            FROM livraria_comercial.vendas
            WHERE usu_id = v_usu_juliana
              AND ven_total_venda = 101.80
              AND stv_id = v_stv_aprovada
            ORDER BY ven_criado_em DESC
            LIMIT 1;
        END IF;
        
        IF v_nova_venda_id IS NOT NULL THEN
            INSERT INTO livraria_comercial.itens_venda (
                itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
            )
            VALUES
                (gen_random_uuid(), v_nova_venda_id, v_liv_harry_potter, 1, 49.90, v_loj_sp),
                (gen_random_uuid(), v_nova_venda_id, v_liv_dom_casmurro, 1, 39.90, v_loj_sp)
            ON CONFLICT DO NOTHING;
            
            INSERT INTO livraria_financeiro.pagamento (
                pag_uuid, ven_id, tpg_id, stp_id, pag_valor,
                pag_processado_em, pag_criado_em, pag_atualizado_em, loj_id,
                pag_idempotency_key
            )
            VALUES (
                gen_random_uuid(),
                v_nova_venda_id,
                v_tpg_cartao_credito,
                v_stp_aprovado,
                81.80,
                NOW() - INTERVAL '5 days',
                NOW() - INTERVAL '5 days',
                NOW() - INTERVAL '4 days',
                v_loj_sp,
                'pag_venda_multipla_juliana_cartao'
            )
            ON CONFLICT (pag_uuid) DO NOTHING;
            
            INSERT INTO livraria_financeiro.pagamento (
                pag_uuid, ven_id, tpg_id, stp_id, pag_valor,
                pag_detalhes_cupom, pag_processado_em, pag_criado_em, pag_atualizado_em, loj_id,
                pag_idempotency_key
            )
            VALUES (
                gen_random_uuid(),
                v_nova_venda_id,
                v_tpg_cupom_promocional,
                v_stp_aprovado,
                20.00,
                'PRIMEIRA10',
                NOW() - INTERVAL '5 days',
                NOW() - INTERVAL '5 days',
                NOW() - INTERVAL '4 days',
                v_loj_sp,
                'pag_venda_multipla_juliana_cupom'
            )
            ON CONFLICT (pag_uuid) DO NOTHING;
            
            RAISE NOTICE 'Venda adicional criada com múltiplos pagamentos';
        END IF;
    END IF;
    
    -- ========================================================================
    -- 13. CENÁRIOS ADICIONAIS DE TROCA
    -- ========================================================================
    
    IF v_loj_rj IS NOT NULL AND v_usu_carla IS NOT NULL AND v_stv_troca_concluida IS NOT NULL THEN
        INSERT INTO livraria_comercial.vendas (
            ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
            ven_criado_em, ven_atualizado_em, loj_id
        )
        VALUES (
            gen_random_uuid(),
            v_usu_carla,
            v_stv_troca_concluida,
            119.80,
            15.00,
            134.80,
            NOW() - INTERVAL '10 days',
            NOW() - INTERVAL '1 day',
            v_loj_rj
        )
        ON CONFLICT DO NOTHING
        RETURNING ven_id INTO v_nova_venda_id;
        
        IF v_nova_venda_id IS NULL THEN
            SELECT ven_id INTO v_nova_venda_id
            FROM livraria_comercial.vendas
            WHERE usu_id = v_usu_carla
              AND ven_total_venda = 134.80
              AND stv_id = v_stv_troca_concluida
            ORDER BY ven_criado_em DESC
            LIMIT 1;
        END IF;
        
        IF v_nova_venda_id IS NOT NULL THEN
            INSERT INTO livraria_comercial.itens_venda (
                itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
            )
            VALUES
                (gen_random_uuid(), v_nova_venda_id, v_liv_harry_potter, 1, 59.90, v_loj_rj),
                (gen_random_uuid(), v_nova_venda_id, v_liv_o_hobbit, 1, 59.90, v_loj_rj)
            ON CONFLICT DO NOTHING;
            
            UPDATE livraria_comercial.itens_venda
            SET itv_em_troca = TRUE, itv_atualizado_em = NOW()
            WHERE ven_id = v_nova_venda_id;
            
            INSERT INTO livraria_comercial.cupons_troca (
                cpt_uuid, cpt_codigo, cpt_valor, cpt_cliente_id, cpt_venda_origem_id,
                cpt_status, cpt_valido_ate, cpt_criado_em
            )
            VALUES (
                gen_random_uuid(),
                'TROCA-' || substr(md5(random()::text), 1, 8),
                134.80,
                v_usu_carla,
                v_nova_venda_id,
                'DISPONIVEL',
                NOW() + INTERVAL '6 months',
                NOW()
            )
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Cenário criado: Devolução de pedido completo';
        END IF;
    END IF;
    
    IF v_loj_sp IS NOT NULL AND v_usu_juliana IS NOT NULL AND v_stv_troca_rejeitada IS NOT NULL THEN
        INSERT INTO livraria_comercial.vendas (
            ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda,
            ven_criado_em, ven_atualizado_em, loj_id, ven_motivo_troca
        )
        VALUES (
            gen_random_uuid(),
            v_usu_juliana,
            v_stv_troca_rejeitada,
            49.90,
            12.00,
            61.90,
            NOW() - INTERVAL '8 days',
            NOW() - INTERVAL '1 day',
            v_loj_sp,
            'Produto sem defeito, pedido de troca injustificado'
        )
        ON CONFLICT DO NOTHING
        RETURNING ven_id INTO v_nova_venda_id;
        
        IF v_nova_venda_id IS NULL THEN
            SELECT ven_id INTO v_nova_venda_id
            FROM livraria_comercial.vendas
            WHERE usu_id = v_usu_juliana
              AND stv_id = v_stv_troca_rejeitada
            ORDER BY ven_criado_em DESC
            LIMIT 1;
        END IF;
        
        IF v_nova_venda_id IS NOT NULL THEN
            INSERT INTO livraria_comercial.itens_venda (
                itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id
            )
            VALUES
                (gen_random_uuid(), v_nova_venda_id, v_liv_harry_potter, 1, 49.90, v_loj_sp)
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Cenário criado: Admin negando troca';
        END IF;
    END IF;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Seed 008 executado com sucesso!';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Múltiplos cartões adicionados (3 cartões por cliente)';
    RAISE NOTICE 'Pagamentos criados para 4 vendas existentes';
    RAISE NOTICE 'Venda adicional com múltiplos pagamentos (cartão + cupom)';
    RAISE NOTICE 'Cenário de devolução de pedido completo criado';
    RAISE NOTICE 'Cenário de admin negando troca criado';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'IDEMPOTÊNCIA: Este script pode ser executado múltiplas vezes';
    RAISE NOTICE 'PAPEIS: Considera papéis de autenticação (admin vs cliente)';
    RAISE NOTICE '============================================================================';
END;
$$;
