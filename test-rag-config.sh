#!/bin/bash

# Script de Teste das Configurações RAG Avançadas
# Testa as rotas de IA com as novas configurações implementadas

BASE_URL="http://localhost:5001/api/ia"

echo "=== Teste das Configurações RAG Avançadas ==="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar rota
testar_rota() {
    local nome="$1"
    local metodo="$2"
    local url="$3"
    local dados="$4"
    
    echo -e "${YELLOW}Testando: $nome${NC}"
    echo "Método: $metodo"
    echo "URL: $url"
    
    if [ -n "$dados" ]; then
        echo "Dados: $dados"
        response=$(curl -s -X "$metodo" "$url" \
            -H "Content-Type: application/json" \
            -d "$dados")
    else
        response=$(curl -s "$url")
    fi
    
    echo "Response: $response"
    echo ""
}

# Teste 1: Health Check
testar_rota "Health Check" "GET" "$BASE_URL/saude" ""

# Teste 2: Métricas (sem filtro)
testar_rota "Métricas (todos)" "GET" "$BASE_URL/metricas" ""

# Teste 3: Métricas Agregadas
testar_rota "Métricas Agregadas" "GET" "$BASE_URL/metricas/agregadas" ""

# Teste 4: Métricas por período
testar_rota "Métricas (hoje)" "GET" "$BASE_URL/metricas/hoje" ""

# Teste 5: Recomendar - Query simples
testar_rota "Recomendar (livros de fantasia)" "POST" "$BASE_URL/recomendar" \
    '{"query": "livros de fantasia com magia", "limite": 5}'

# Teste 6: Recomendar - Query específica
testar_rota "Recomendar (livros de terror)" "POST" "$BASE_URL/recomendar" \
    '{"query": "livros de terror e suspense", "limite": 3}'

# Teste 7: Recomendar - Query com limite diferente
testar_rota "Recomendar (livros de mistério)" "POST" "$BASE_URL/recomendar" \
    '{"query": "livros de mistério policial", "limite": 2}'

# Teste 8: Chat - Mensagem simples
testar_rota "Chat (livros de fantasia)" "POST" "$BASE_URL/chat" \
    '{"mensagem": "Quero recomendações de livros de fantasia"}'

# Teste 9: Chat - Mensagem específica
testar_rota "Chat (livros de mistério)" "POST" "$BASE_URL/chat" \
    '{"mensagem": "Me recomende livros de mistério"}'

# Teste 10: Reindexar - Forçar reindexação
testar_rota "Reindexar (forçar)" "POST" "$BASE_URL/reindexar" \
    '{"forcarReindexacao": true}'

echo -e "${GREEN}=== Testes Concluídos ===${NC}"
echo ""
echo "Verifique os logs do servidor para detalhes das configurações RAG aplicadas:"
echo "- RAG_CONFIG.topK: 5"
echo "- RAG_CONFIG.similarityThreshold: 0.7"
echo "- RAG_CONFIG.searchMultiplier: 2"
echo "- Configuração de personalização aplicada"
echo "- Chunking implementado para textos longos"
