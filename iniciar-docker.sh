#!/bin/bash
# Script simples para subir docker e configurar banco automaticamente

set -e

# Carrega PORTA_HTTP_EXTERNA do .env (compose usa o mesmo contrato)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
PORTA_EXTERNA="${PORTA_HTTP_EXTERNA:-3002}"

echo "=========================================="
echo "INICIANDO AMBIENTE DE DESENVOLVIMENTO"
echo "=========================================="
echo ""

# Subir docker compose
echo "Subindo containers Docker..."
docker compose up -d

# Aguardar postgres estar pronto
echo "Aguardando PostgreSQL estar pronto..."
until docker exec ecm_postgres pg_isready -U ecm_user -d ecm_livraria > /dev/null 2>&1; do
  echo -n "."
  sleep 2
done
echo ""
echo "PostgreSQL está pronto!"

echo "Aguardando API HTTP na porta ${PORTA_EXTERNA}..."
for _ in $(seq 1 30); do
  if curl -sf --max-time 2 "http://127.0.0.1:${PORTA_EXTERNA}/api" -o /dev/null; then
    break
  fi
  # 404/401 ainda indicam que o Express respondeu
  codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${PORTA_EXTERNA}/api" || echo "000")
  if [ "$codigo" != "000" ]; then
    break
  fi
  sleep 2
done
codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${PORTA_EXTERNA}/api" || echo "000")
if [ "$codigo" = "000" ]; then
  echo "ERRO: API não responde em http://localhost:${PORTA_EXTERNA} (verifique PORTA_HTTP / PORTA_HTTP_EXTERNA e docker compose ps)"
  exit 1
fi

# Executar setup do banco
echo ""
echo "Configurando banco de dados..."
../scripts/setup-db-unificado.sh --env dev

echo ""
echo "=========================================="
echo "AMBIENTE PRONTO!"
echo "=========================================="
echo ""
echo "Backend: http://localhost:${PORTA_EXTERNA}/api"
echo "PostgreSQL: localhost:5432"
echo ""
