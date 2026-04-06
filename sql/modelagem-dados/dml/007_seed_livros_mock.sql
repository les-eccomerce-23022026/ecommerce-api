-- =============================================================================
-- REMOVIDO: o seed de livros foi movido para migrations/021_seed_livros_catalogo_mock.sql
--
-- Motivo: este script DML rodava no setup ANTES das migrations; a tabela `livros`
-- só existe após a migration 014 — o INSERT falhava e o catálogo ficava vazio.
--
-- Para popular o banco: execute `./scripts/setup-db.sh` (aplica DDL, DML, migrations)
-- ou apenas `psql ... -f sql/migrations/021_seed_livros_catalogo_mock.sql` se o schema
-- já estiver aplicado.
-- =============================================================================

SELECT 1 AS seed_livros_movido_para_migration_021;
