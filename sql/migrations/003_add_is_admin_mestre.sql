-- migration: 003 — Adicionar flag de admin mestre na tabela de usuários

-- Adiciona a coluna se ela ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'usu_is_admin_mestre'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN usu_is_admin_mestre BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Atualizar o administrador mestre inicial (UUID conhecido)
UPDATE usuarios 
SET usu_is_admin_mestre = TRUE 
WHERE usu_uuid = '00000000-0000-0000-0000-000000000001' 
   OR usu_email = 'admin@livraria.com.br';
