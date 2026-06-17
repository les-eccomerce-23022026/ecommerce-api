-- =============================================================================
-- DML 005 — Seed de usuários de teste (Cliente e Admin)
-- Senha para ambos: "123456"
-- Hash real node bcrypt: $2b$10$nNjJUpOfuXZiC2bQyN2dbOI1dWjKfiz7qw0E6dHJanuAEoHogz0K.
-- =============================================================================
-- NOTA: O usuário admin@livraria.com.br não é criado aqui pois é gerado
-- dinamicamente pelo helper de testes (obterTokenAdmin) com hash correto
-- =============================================================================

DO $$
DECLARE
    v_id_papel_admin   INTEGER;
    v_id_papel_cliente INTEGER;
    v_id_usuario_cli   BIGINT;
    v_id_usuario_admin BIGINT;
    v_loj_id           BIGINT;
BEGIN
    SELECT pap_id INTO v_id_papel_admin FROM livraria_gestao.papeis WHERE pap_descricao = 'admin';
    SELECT pap_id INTO v_id_papel_cliente FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente';

    SELECT l.loj_id INTO v_loj_id
    FROM livraria_gestao.lojas l
    WHERE l.loj_slug IN ('loja-padrao', 'livraria-teste', 'livraria-padrao')
    ORDER BY CASE l.loj_slug
        WHEN 'loja-padrao' THEN 1
        WHEN 'livraria-teste' THEN 2
        WHEN 'livraria-padrao' THEN 3
        ELSE 99
    END,
    l.loj_id
    LIMIT 1;

    IF v_loj_id IS NULL THEN
        SELECT loj_id INTO v_loj_id
        FROM livraria_gestao.lojas
        WHERE loj_ativo = TRUE
        ORDER BY loj_id
        LIMIT 1;
    END IF;

    IF v_loj_id IS NULL THEN
        RAISE EXCEPTION 'Seed 005: nenhuma loja ativa encontrada. Rode as migrations de lojas antes.';
    END IF;

    -- Atualiza ou Insere Administrador de Teste
    INSERT INTO livraria_gestao.usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
    VALUES (
        'Admin Teste',
        'admintest@email.com',
        '111.111.111-11',
        '$2b$10$nNjJUpOfuXZiC2bQyN2dbOI1dWjKfiz7qw0E6dHJanuAEoHogz0K.',
        v_id_papel_admin,
        TRUE,
        v_loj_id
    ) ON CONFLICT (usu_email) DO UPDATE SET
        usu_senha_hash = '$2b$10$nNjJUpOfuXZiC2bQyN2dbOI1dWjKfiz7qw0E6dHJanuAEoHogz0K.',
        loj_id = v_loj_id,
        usu_ativo = TRUE
    RETURNING usu_id INTO v_id_usuario_admin;

    IF v_id_usuario_admin IS NULL THEN
        SELECT usu_id INTO v_id_usuario_admin FROM livraria_gestao.usuarios
        WHERE usu_email = 'admintest@email.com';
    END IF;

    -- Associar papel admin na tabela usuario_papeis
    IF v_id_usuario_admin IS NOT NULL THEN
        INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo)
        VALUES (v_id_usuario_admin, v_id_papel_admin, TRUE)
        ON CONFLICT (usu_id, pap_id) DO UPDATE SET usp_ativo = TRUE;

        INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
        VALUES (v_id_usuario_admin, v_loj_id, 'admin_principal', TRUE, 'LOJA')
        ON CONFLICT (usu_id, loj_id) DO UPDATE
            SET adl_ativo = TRUE,
                adl_papel = EXCLUDED.adl_papel,
                adl_escopo = EXCLUDED.adl_escopo;
    END IF;

    -- Atualiza ou Insere Cliente de Teste
    INSERT INTO livraria_gestao.usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
    VALUES (
        'Cliente Teste',
        'clientetest@email.com',
        '529.982.247-25',
        '$2b$10$nNjJUpOfuXZiC2bQyN2dbOI1dWjKfiz7qw0E6dHJanuAEoHogz0K.',
        v_id_papel_cliente,
        TRUE,
        v_loj_id
    ) ON CONFLICT (usu_email) DO UPDATE SET
        usu_senha_hash = '$2b$10$nNjJUpOfuXZiC2bQyN2dbOI1dWjKfiz7qw0E6dHJanuAEoHogz0K.',
        loj_id = v_loj_id,
        usu_ativo = TRUE
    RETURNING usu_id INTO v_id_usuario_cli;

    IF v_id_usuario_cli IS NULL THEN
        SELECT usu_id INTO v_id_usuario_cli FROM livraria_gestao.usuarios
        WHERE usu_email = 'clientetest@email.com' AND pap_id = v_id_papel_cliente;
    END IF;

    -- Associar papel cliente na tabela usuario_papeis
    IF v_id_usuario_cli IS NOT NULL THEN
        INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo)
        VALUES (v_id_usuario_cli, v_id_papel_cliente, TRUE)
        ON CONFLICT (usu_id, pap_id) DO UPDATE SET usp_ativo = TRUE;
        
        INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
        VALUES (v_id_usuario_cli, 'Masculino', '1990-01-01', v_loj_id)
        ON CONFLICT (usu_id) DO UPDATE SET loj_id = v_loj_id;
    END IF;
END;
$$;
