#!/bin/bash
# Valida disponibilidade do Gemini e Groq diretamente via curl (sem aplicação)

set -euo pipefail

VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
NC='\033[0m'

ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

GEMINI_KEY="${GEMINI_API_KEY:-}"
GEMINI_MODEL="${GEMINI_CHAT_MODEL:-gemini-2.5-flash}"
GROQ_KEY="${GROQ_API_KEY:-}"
GROQ_MODEL="llama-3.1-8b-instant"

ERROS=0

echo "Verificando LLMs..."
echo ""

# --- Gemini ---
if [ -z "$GEMINI_KEY" ]; then
  echo -e "${VERMELHO}[GEMINI] GEMINI_API_KEY não definida no .env${NC}"
  ERROS=$((ERROS + 1))
else
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"ping"}]}]}')

  if [ "$STATUS" = "200" ]; then
    echo -e "${VERDE}[GEMINI] OK (HTTP $STATUS)${NC}"
  else
    echo -e "${VERMELHO}[GEMINI] FALHOU (HTTP $STATUS)${NC}"
    ERROS=$((ERROS + 1))
  fi
fi

# --- Groq ---
if [ -z "$GROQ_KEY" ]; then
  echo -e "${VERMELHO}[GROQ] GROQ_API_KEY não definida no .env${NC}"
  ERROS=$((ERROS + 1))
else
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.groq.com/openai/v1/chat/completions" \
    -H "Authorization: Bearer ${GROQ_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"${GROQ_MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":1}")

  if [ "$STATUS" = "200" ]; then
    echo -e "${VERDE}[GROQ] OK (HTTP $STATUS)${NC}"
  else
    echo -e "${VERMELHO}[GROQ] FALHOU (HTTP $STATUS)${NC}"
    ERROS=$((ERROS + 1))
  fi
fi

echo ""
if [ "$ERROS" -gt 0 ]; then
  echo -e "${VERMELHO}ERRO: $ERROS LLM(s) indisponível(is)${NC}"
  exit 1
fi

echo -e "${VERDE}Todos os LLMs disponíveis.${NC}"
