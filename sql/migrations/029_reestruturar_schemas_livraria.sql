-- Migration: Reestruturação de Schemas - les -> livraria com subdivisão por contexto limitado
-- Version: 029
-- NOTA: Esta migration foi desativada pois as tabelas já estão organizadas em schemas específicos
-- (livraria_gestao, livraria_comercial, livraria_catalogo, livraria_ref, livraria_logistica)
-- e não devem ser movidas. O schema "les" nunca foi criado (migration 025 desativada).

-- Migration vazia - as tabelas já estão nos schemas corretos
SELECT 1;
