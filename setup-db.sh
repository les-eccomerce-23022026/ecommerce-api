#!/bin/bash
set -e

# Configurações do banco
DB_URL="postgresql://ecm_user:ecm_senha@localhost:5432/ecm_livraria"

echo "Aguardando banco de dados..."
until pg_isready -h localhost -p 5432 -U ecm_user -d ecm_livraria; do
  echo "Banco não está pronto, aguardando..."
  sleep 2
done

echo "Aplicando DDL..."
for file in sql/modelagem-dados/ddl/*.sql; do
  echo "Executando $file..."
  psql "$DB_URL" -f "$file"
done

echo "Aplicando DML..."
for file in sql/modelagem-dados/dml/*.sql; do
  echo "Executando $file..."
  psql "$DB_URL" -f "$file"
done

echo "Aplicando migrations..."
for file in sql/migrations/*.sql; do
  echo "Executando $file..."
  psql "$DB_URL" -f "$file"
done

echo "Banco de dados configurado com sucesso!"
