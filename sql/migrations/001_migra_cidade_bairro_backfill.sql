-- =============================================================================
-- MIGRATION 001 — Criar/Popular `ecm_cidade` e `ecm_bairro` e backfill seguro
-- Idempotente: pode ser executado múltiplas vezes sem duplicar dados.
-- Recomenda-se rodar em janela de manutenção curta ou ambiente controlado.
-- =============================================================================

BEGIN;

-- 1) Criar tabelas de destino caso não existam (garante idempotência)
\i sql/ddl/006_criar_tabela_cidade_bairro.sql

-- 2) Adicionar colunas FK em ecm_endereco_usuario, se ainda não existirem
ALTER TABLE ecm_endereco_usuario
    ADD COLUMN IF NOT EXISTS id_cidade INTEGER;

ALTER TABLE ecm_endereco_usuario
    ADD COLUMN IF NOT EXISTS id_bairro INTEGER;

-- 3) Popular ecm_cidade a partir de valores únicos presentes em ecm_endereco_usuario
--    Usa versão normalizada para evitar duplicatas por case/espacos.
INSERT INTO ecm_cidade (nom_cidade, nom_cidade_norm, id_estado)
SELECT DISTINCT
    TRIM(nom_cidade) AS nom_cidade,
    UPPER(TRIM(nom_cidade)) AS nom_cidade_norm,
    id_estado
FROM ecm_endereco_usuario
WHERE nom_cidade IS NOT NULL
ON CONFLICT (nom_cidade_norm, id_estado) DO NOTHING;

-- 4) Popular ecm_bairro a partir dos bairros existentes relacionando pela cidade
INSERT INTO ecm_bairro (nom_bairro, nom_bairro_norm, id_cidade)
SELECT DISTINCT
    TRIM(e.nom_bairro) AS nom_bairro,
    UPPER(TRIM(e.nom_bairro)) AS nom_bairro_norm,
    c.id_cidade
FROM ecm_endereco_usuario e
LEFT JOIN ecm_cidade c
    ON UPPER(TRIM(e.nom_cidade)) = c.nom_cidade_norm
    AND (e.id_estado IS NOT DISTINCT FROM c.id_estado)
WHERE e.nom_bairro IS NOT NULL
ON CONFLICT (nom_bairro_norm, id_cidade) DO NOTHING;

-- 5) Backfill: setar id_cidade nas linhas de ecm_endereco_usuario que ainda não têm
UPDATE ecm_endereco_usuario e
SET id_cidade = c.id_cidade
FROM ecm_cidade c
WHERE e.id_cidade IS NULL
  AND e.nom_cidade IS NOT NULL
  AND UPPER(TRIM(e.nom_cidade)) = c.nom_cidade_norm
  AND (e.id_estado IS NOT DISTINCT FROM c.id_estado);

-- 6) Backfill: setar id_bairro usando o bairro normalizado + id_cidade
UPDATE ecm_endereco_usuario e
SET id_bairro = b.id_bairro
FROM ecm_bairro b
WHERE e.id_bairro IS NULL
  AND e.nom_bairro IS NOT NULL
  AND e.id_cidade IS NOT NULL
  AND UPPER(TRIM(e.nom_bairro)) = b.nom_bairro_norm
  AND b.id_cidade = e.id_cidade;

-- 7) Estatísticas/validações rápidas (notices) — úteis para revisão antes de remover colunas antigas
RAISE NOTICE 'Endereços totais: %', (SELECT COUNT(*) FROM ecm_endereco_usuario);
RAISE NOTICE 'Endereços com id_cidade preenchido: %', (SELECT COUNT(*) FROM ecm_endereco_usuario WHERE id_cidade IS NOT NULL);
RAISE NOTICE 'Endereços com id_bairro preenchido: %', (SELECT COUNT(*) FROM ecm_endereco_usuario WHERE id_bairro IS NOT NULL);

-- 8) Recomendações (comentadas): após validar, você pode:
--    • marcar colunas id_cidade e id_bairro como NOT NULL (se desejado)
--    • remover as colunas textuais nom_cidade e nom_bairro ou mantê-las por um ciclo de compatibilidade
--    • adicionar FK constraints e índices extras
-- Exemplo para tornar NOT NULL (apenas após verificação):
-- ALTER TABLE ecm_endereco_usuario ALTER COLUMN id_cidade SET NOT NULL;
-- ALTER TABLE ecm_endereco_usuario ALTER COLUMN id_bairro SET NOT NULL;

COMMIT;
