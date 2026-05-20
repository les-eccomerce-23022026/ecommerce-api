-- =============================================================================
-- DML 005 — Seed de usuários de teste (Cliente e Admin)
-- Senha para ambos: "@asdfJKLÇ123"
-- O hash antigo deu erro no compare por algum problema de encoding. Este deve funcionar: 
-- Hash real node bcrypt: $2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W
-- =============================================================================

DO $$
DECLARE
    v_id_papel_admin   INTEGER;
    v_id_papel_cliente INTEGER;
    v_id_usuario_cli   BIGINT;
BEGIN
    SELECT pap_id INTO v_id_papel_admin FROM livraria_comercial.papeis WHERE pap_descricao = 'admin';
    SELECT pap_id INTO v_id_papel_cliente FROM livraria_comercial.papeis WHERE pap_descricao = 'cliente';

    -- Atualiza ou Insere Administrador de Teste
    INSERT INTO livraria_gestao.usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
    VALUES (
        'Admin Teste',
        'admintest@email.com',
        '111.111.111-11',
        '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W',
        v_id_papel_admin,
        TRUE,
        1  -- loj_id = 1 (loja padrão)
    ) ON CONFLICT (usu_email) DO UPDATE SET usu_senha_hash = '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W';

    -- Atualiza ou Insere Cliente de Teste
    INSERT INTO livraria_gestao.usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
    VALUES (
        'Cliente Teste',
        'clientetest@email.com',
        '222.222.222-22',
        '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W',
        v_id_papel_cliente,
        TRUE,
        1  -- loj_id = 1 (loja padrão)
    ) ON CONFLICT (usu_email) DO UPDATE SET usu_senha_hash = '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W'
    RETURNING usu_id INTO v_id_usuario_cli;

    IF v_id_usuario_cli IS NULL THEN
        SELECT usu_id INTO v_id_usuario_cli FROM livraria_gestao.usuarios 
        WHERE usu_email = 'clientetest@email.com' AND pap_id = v_id_papel_cliente;
    END IF;

    IF v_id_usuario_cli IS NOT NULL THEN
        INSERT INTO livraria_gestao.clientes (usu_id, cli_genero, cli_data_nascimento, loj_id)
        VALUES (v_id_usuario_cli, 'Masculino', '1990-01-01', 1)
        ON CONFLICT (usu_id) DO UPDATE SET loj_id = 1;
    END IF;
END;
$$;
