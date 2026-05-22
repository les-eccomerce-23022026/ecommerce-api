-- =============================================================================
-- Migration 042 — Remover campo usu_is_admin_mestre
-- Sistema: LES – E-Commerce de Livros
--
-- Esta migration remove o conceito de "Administrador Mestre" do sistema.
-- O sistema agora usa um modelo multi-tenant onde cada administrador
-- gerencia sua própria loja, não existindo mais um administrador
-- com acesso global a todas as lojas.
-- =============================================================================

-- Remover a coluna usu_is_admin_mestre da tabela usuarios
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'livraria_gestao'
          AND table_name = 'usuarios'
          AND column_name = 'usu_is_admin_mestre'
    ) THEN
        ALTER TABLE livraria_gestao.usuarios DROP COLUMN usu_is_admin_mestre;
        RAISE NOTICE 'Coluna usu_is_admin_mestre removida com sucesso.';
    ELSE
        RAISE NOTICE 'Coluna usu_is_admin_mestre não existe, nada a fazer.';
    END IF;
END $$;

-- Remover comentário da coluna se ainda existir
COMMENT ON COLUMN livraria_gestao.usuarios.usu_is_admin_mestre IS NULL;
