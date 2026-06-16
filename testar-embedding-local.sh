#!/bin/bash
# Valida que o embedding local (ChromaDB + HuggingFace) está funcionando

set -euo pipefail

VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
NC='\033[0m'

ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

CHROMA_HOST="${CHROMADB_HOST:-http://localhost:8001}"
BASE="${CHROMA_HOST}/api/v2/tenants/default_tenant/databases/default_database"

falhar() {
  echo -e "${VERMELHO}ERRO: $1${NC}" >&2
  exit 1
}

# 1. Heartbeat
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CHROMA_HOST}/api/v2/heartbeat")
[ "$STATUS" = "200" ] || falhar "ChromaDB não responde (HTTP $STATUS)"
echo -e "${VERDE}[CHROMADB] Heartbeat OK${NC}"

# 2. Coleção existe
COLECAO=$(curl -s "${BASE}/collections" | python3 -c "
import sys, json
cols = json.load(sys.stdin)
livros = next((c for c in cols if c['name'] == 'produtos_livraria'), None)
print(livros['id'] if livros else '')
" 2>/dev/null)
[ -n "$COLECAO" ] || falhar "Coleção 'produtos_livraria' não encontrada"
echo -e "${VERDE}[CHROMADB] Coleção 'produtos_livraria' encontrada (id: $COLECAO)${NC}"

# 3. Embeddings indexados
COUNT=$(curl -s "${BASE}/collections/${COLECAO}/count")
[ "$COUNT" -gt 0 ] 2>/dev/null || falhar "Nenhum embedding indexado na coleção"
echo -e "${VERDE}[EMBEDDING] $COUNT documentos indexados${NC}"

# 4. Embedding tem dimensão esperada (384 = MiniLM-L12-v2)
DIM=$(curl -s -X POST "${BASE}/collections/${COLECAO}/get" \
  -H "Content-Type: application/json" \
  -d '{"limit":1,"include":["embeddings"]}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
embs = data.get('embeddings', [])
print(len(embs[0]) if embs else 0)
" 2>/dev/null)

[ "$DIM" -gt 0 ] || falhar "Embedding retornado está vazio"
echo -e "${VERDE}[EMBEDDING] Dimensão do vetor: ${DIM}${NC}"

echo ""
echo -e "${VERDE}Embedding local funcionando corretamente.${NC}"
