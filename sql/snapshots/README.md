# Snapshots DDL — versionamento da estrutura PostgreSQL

Este diretório guarda a **estrutura** do banco (`ecm_livraria` no container `ecm_postgres`), não dados de negócio.

## Artefatos

| Arquivo / pasta | Propósito |
|-----------------|-----------|
| [`schema_canonico.sql`](schema_canonico.sql) | Foto **atual** da estrutura — use no diff do PR |
| [`historico/schema_YYYYMMDD_HHMMSS.sql`](historico/) | Backup datado antes/depois de mudanças — rollback |
| [`historico/legado/`](historico/legado/) | Snapshots antigos (`schema_snapshot_*`) — apenas referência |

## Schemas incluídos no dump

- `livraria_comercial`, `livraria_financeiro`, `livraria_gestao`, `livraria_logistica`, `livraria_ref`
- `public` (extensões `pg_trgm`, `unaccent` e funções legadas usadas por índices GIN)

Ao criar um novo schema `livraria_*`, atualize `SCHEMAS_SNAPSHOT` em [`backend/scripts/lib/db-utils.sh`](../../scripts/lib/db-utils.sh).

## Comandos

```bash
cd backend   # ou na raiz: npm run db:snapshot (monorepo)

# Antes de migration arriscada — só backup datado (não altera o canônico)
npm run db:snapshot:historico

# Migration com snapshot + rollback automático se falhar
npm run db:migrate:segura -- sql/migrations/048_exemplo.sql

# Após migration estável — atualiza canônico + novo histórico
npm run db:snapshot

# Ver diff do canônico no Git
npm run db:snapshot:diff

# Restaurar estrutura (último historico/schema_*.sql por padrão)
npm run db:restore:schema -- --confirmar
npm run db:restore:schema -- --confirmar --arquivo=sql/snapshots/historico/schema_YYYYMMDD_HHMMSS.sql
```

Pré-requisito: `docker compose up -d postgres` e banco com tabelas já criadas.

## Fluxo recomendado

1. `npm run db:snapshot:historico` — ponto de restauração antes da alteração.
2. Aplicar script em `sql/migrations/` ou `sql/modelagem-dados/ddl/`.
3. `npm run db:snapshot` — atualizar `schema_canonico.sql`.
4. No PR: commit da migration + `schema_canonico.sql` + (opcional) o `historico/schema_*.sql` da mesma sessão.

A **narrativa do porquê** da mudança continua nas migrations; o snapshot registra **o quê** mudou na estrutura.

## Restauração (rollback)

**Cuidado:** apaga o banco atual (só estrutura; dados de negócio não voltam).

```bash
cd backend
npm run db:restore:schema -- --confirmar
# ou arquivo específico:
npm run db:restore:schema -- --confirmar --arquivo=sql/snapshots/historico/schema_YYYYMMDD_HHMMSS.sql
```

Equivalente manual (se o script não estiver disponível):

```bash
docker exec ecm_postgres psql -U ecm_user -d postgres -c "DROP DATABASE ecm_livraria;"
docker exec ecm_postgres psql -U ecm_user -d postgres -c "CREATE DATABASE ecm_livraria;"
cat backend/sql/snapshots/historico/schema_YYYYMMDD_HHMMSS.sql | docker exec -i ecm_postgres psql -U ecm_user -d ecm_livraria
```

Após restore: `npm run db:setup` se precisar repopular seeds.

## Normalização do dump

Os arquivos gerados por `npm run db:snapshot` removem linhas `\restrict` / `\unrestrict` do pg_dump 16 e incluem cabeçalho com data, fonte e comando — para diffs mais estáveis no Git.

## Relacionado

- Protocolo para agentes: [`../AGENTS.md`](../AGENTS.md)
- ADR: [`../../../documentacao-exigida/adr/0012-snapshots-ddl-versionados-git.md`](../../../documentacao-exigida/adr/0012-snapshots-ddl-versionados-git.md)
