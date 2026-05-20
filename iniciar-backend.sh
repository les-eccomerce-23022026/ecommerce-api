#!/bin/bash

# Script para iniciar o backend automaticamente
# Verifica se a porta 3000 está ocupada e mata o processo se necessário

PORTA=3000
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${AMARELO}==========================================${NC}"
echo -e "${AMARELO}INICIANDO BACKEND${NC}"
echo -e "${AMARELO}==========================================${NC}"
echo ""

# Verificar se a porta está ocupada
if lsof -Pi :$PORTA -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${AMARELO}Porta $PORTA está ocupada. Matando processo...${NC}"
    fuser -k $PORTA/tcp 2>/dev/null
    sleep 2
    echo -e "${VERDE}Processo morto com sucesso.${NC}"
    echo ""
fi

# Iniciar o backend
echo -e "${AMARELO}Iniciando backend na porta $PORTA...${NC}"
npm run dev
