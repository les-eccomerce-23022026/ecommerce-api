#!/bin/sh
set -e

# Script de entrypoint para setup automático do banco de dados
# Executa DDL, DML e migrations automaticamente ao iniciar o container

echo "[entrypoint] Iniciando configuração do banco de dados..."

# Detectar ambiente (dev ou test) baseado em variáveis de ambiente
case "$POSTGRES_DB" in
  *test*)
    ENV="test"
    PGHOST="${POSTGRES_HOST_TEST:-postgres}"
    PGPORT="${POSTGRES_PORT_TEST:-5432}"
    PGUSER="${POSTGRES_USER_TEST:-ecm_user_test}"
    PGPASSWORD="${POSTGRES_PASSWORD_TEST:-ecm_senha_test}"
    PGDATABASE="${POSTGRES_DB_TEST:-ecm_livraria_test}"
    ;;
  *)
    ENV="dev"
    PGHOST="${POSTGRES_HOST:-postgres}"
    PGPORT="${POSTGRES_PORT:-5432}"
    PGUSER="${POSTGRES_USER:-ecm_user}"
    PGPASSWORD="${POSTGRES_PASSWORD:-ecm_senha}"
    PGDATABASE="${POSTGRES_DB:-ecm_livraria}"
    ;;
esac

echo "[entrypoint] Ambiente: $ENV"
echo "[entrypoint] Banco: ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}"

# Aguardar postgres estar pronto
echo "[entrypoint] Aguardando postgres estar pronto..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" > /dev/null 2>&1; do
  echo "[entrypoint] Aguardando postgres... (${PGHOST}:${PGPORT})"
  sleep 2
done
echo "[entrypoint] Postgres está pronto!"

# Verificar se o banco já foi configurado (verificar tabela de referência)
if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1 FROM livraria.livros LIMIT 1;" > /dev/null 2>&1; then
  echo "[entrypoint] Banco já configurado. Pulando setup."
else
  echo "[entrypoint] Banco não configurado. Iniciando setup..."

  SQL_ROOT="/app/sql"

  # Aplicar DDL
  echo "[entrypoint] Aplicando DDL (Schema Base)..."
  for file in $SQL_ROOT/modelagem-dados/ddl/*.sql; do
    if [ -f "$file" ]; then
      echo "[entrypoint] DDL: $(basename "$file")"
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$file"
    fi
  done

  # Aplicar DML
  echo "[entrypoint] Aplicando DML (Seeds Iniciais)..."
  for file in $SQL_ROOT/modelagem-dados/dml/*.sql; do
    if [ -f "$file" ]; then
      echo "[entrypoint] DML: $(basename "$file")"
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$file"
    fi
  done

  # Aplicar Migrations
  echo "[entrypoint] Aplicando Migrations..."
  for file in $SQL_ROOT/migrations/*.sql; do
    if [ -f "$file" ]; then
      # Pular migration 029_reestruturar_schemas_livraria em produção (já aplicada)
      case "$file" in
        *029_reestruturar_schemas_livraria*)
          case "$PGDATABASE" in
            *test*)
              # Aplicar em teste
              ;;
            *)
              echo "[entrypoint] MIG: $(basename "$file") [PULADO - já aplicada em produção]"
              continue
              ;;
          esac
          ;;
      esac
      echo "[entrypoint] MIG: $(basename "$file")"
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$file"
    fi
  done

  # Verificar migration 030 (multi-tenancy)
  echo "[entrypoint] Verificando migration de multi-tenancy..."
  if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1 FROM livraria_gestao.lojas LIMIT 1;" > /dev/null 2>&1; then
    echo "[entrypoint] Migration 030 (multi-tenancy) não aplicada. Executando..."
    if [ -f "$SQL_ROOT/migrations/030_multi_tenancy_lojas.sql" ]; then
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SQL_ROOT/migrations/030_multi_tenancy_lojas.sql"
      echo "[entrypoint] Migration 030 aplicada com sucesso"
    else
      echo "[entrypoint] Aviso: Arquivo 030_multi_tenancy_lojas.sql não encontrado"
    fi
  else
    echo "[entrypoint] Migration 030 (multi-tenancy) já aplicada"
  fi

  echo "[entrypoint] Setup do banco concluído com sucesso!"
fi

# Executar comando original (CMD do Dockerfile)
echo "[entrypoint] Iniciando aplicação..."
exec "$@"
