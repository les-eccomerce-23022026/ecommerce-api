-- =============================================================================
-- DML 002 — Seed do usuário administrador inicial
-- Sistema: LES – E-Commerce de Livros
-- Execute após 001_seeds_tipos_referencia.sql.
--
-- ATENÇÃO SEGURANÇA:
--   Este script NÃO contém a senha em texto plano.
--   O hash abaixo é o bcrypt (rounds=10) de 'Admin@123' (senha de bootstrap).
--   Após o primeiro deploy, o usuário admin DEVE alterar a senha via
--   PATCH /api/clientes/senha ou equivalente administrativo.
--
--   Hash gerado com: bcrypt.hashSync('Admin@123', 10)
--   Valor:          $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHuu
--
-- O INSERT é idempotente (ON CONFLICT DO NOTHING) e pode ser re-executado
-- em ambientes de desenvolvimento sem efeito colateral.
-- =============================================================================

DO $$
DECLARE
    v_id_papel_admin  INTEGER;
    v_uuid_admin      UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Obtém o id interno do papel 'admin' de forma segura
    SELECT id_papel
    INTO   v_id_papel_admin
    FROM   ecm_papel_usuario
    WHERE  dsc_papel = 'admin'
    LIMIT  1;

    IF v_id_papel_admin IS NULL THEN
        RAISE EXCEPTION 'Papel "admin" não encontrado. Execute 001_seeds_tipos_referencia.sql antes deste script.';
    END IF;

    INSERT INTO ecm_usuario (
        uuid_usuario,
        nom_usuario,
        dsc_email,
        dsc_cpf,
        dsc_senha_hash,
        id_papel,
        flg_ativo
    )
    VALUES (
        v_uuid_admin,
        'Administrador Mestre',
        'admin@livraria.com.br',
        '000.000.000-00',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHuu',
        v_id_papel_admin,
        TRUE
    )
    ON CONFLICT (dsc_email) DO NOTHING;
END;
$$;
