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
    SELECT id_papel INTO v_id_papel_admin FROM ecm_papel_usuario WHERE dsc_papel = 'admin';
    SELECT id_papel INTO v_id_papel_cliente FROM ecm_papel_usuario WHERE dsc_papel = 'cliente';

    -- Atualiza ou Insere Administrador de Teste
    INSERT INTO ecm_usuario (nom_usuario, dsc_email, dsc_cpf, dsc_senha_hash, id_papel, flg_ativo)
    VALUES (
        'Admin Teste',
        'admintest@email.com',
        '111.111.111-11',
        '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W',
        v_id_papel_admin,
        TRUE
    ) ON CONFLICT (dsc_email, id_papel) DO UPDATE SET dsc_senha_hash = '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W';

    -- Atualiza ou Insere Cliente de Teste
    INSERT INTO ecm_usuario (nom_usuario, dsc_email, dsc_cpf, dsc_senha_hash, id_papel, flg_ativo)
    VALUES (
        'Cliente Teste',
        'clientetest@email.com',
        '222.222.222-22',
        '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W',
        v_id_papel_cliente,
        TRUE
    ) ON CONFLICT (dsc_email, id_papel) DO UPDATE SET dsc_senha_hash = '$2b$10$GaOa1GtR//oZ7.lI3y.7/uT25D7Px3T.54NuII0z/laURHdAIw59W'
    RETURNING id_usuario INTO v_id_usuario_cli;

    IF v_id_usuario_cli IS NULL THEN
        SELECT id_usuario INTO v_id_usuario_cli FROM ecm_usuario 
        WHERE dsc_email = 'clientetest@email.com' AND id_papel = v_id_papel_cliente;
    END IF;

    IF v_id_usuario_cli IS NOT NULL THEN
        INSERT INTO ecm_perfil_cliente (id_usuario, dsc_genero, dat_nascimento)
        VALUES (v_id_usuario_cli, 'Masculino', '1990-01-01')
        ON CONFLICT (id_usuario) DO NOTHING;
    END IF;
END;
$$;
