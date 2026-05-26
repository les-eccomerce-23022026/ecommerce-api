#!/bin/bash

# Script de teste de integração para endpoints de gerenciamento de papéis de usuários
# Sem mocks - usa endpoints reais e banco de dados real
# Cenários baseados em regras de negócio reais

set -e  # Para em caso de erro

BASE_URL="http://localhost:3000/api"
COOKIE_JAR="/tmp/teste_papeis_cookies.txt"
UUID_USUARIO_TESTE="00000000-0000-0000-0000-000000000001"

# Cores
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
AZUL='\033[0;34m'
CINZA='\033[0;90m'
NC='\033[0m'

# Contadores
TOTAL_TESTES=0
TESTES_PASSARAM=0
TESTES_FALHARAM=0

# Função de log
log() {
    echo -e "${CINZA}[$(date '+%H:%M:%S')]${NC} $1"
}

# Função para executar teste
executar_teste() {
    local nome_teste="$1"
    local comando="$2"
    local esperado_sucesso="$3"
    local mensagem_esperada="$4"
    
    TOTAL_TESTES=$((TOTAL_TESTES + 1))
    echo -e "\n${AMARELO}Teste $TOTAL_TESTES: $nome_teste${NC}"
    
    local resposta=$(eval "$comando")
    local sucesso=$(echo "$resposta" | jq -r '.sucesso // false')
    local mensagem=$(echo "$resposta" | jq -r '.mensagem // .dados?.mensagem // ""')
    
    if [ "$sucesso" = "$esperado_sucesso" ]; then
        if [ -n "$mensagem_esperada" ]; then
            if echo "$mensagem" | grep -qi "$mensagem_esperada"; then
                echo -e "${VERDE}✓ PASSOU${NC} - $mensagem"
                TESTES_PASSARAM=$((TESTES_PASSARAM + 1))
                return 0
            else
                echo -e "${VERMELHO}✗ FALHOU${NC} - Mensagem esperada: '$mensagem_esperada', recebida: '$mensagem'"
                TESTES_FALHARAM=$((TESTES_FALHARAM + 1))
                return 1
            fi
        else
            echo -e "${VERDE}✓ PASSOU${NC}"
            TESTES_PASSARAM=$((TESTES_PASSARAM + 1))
            return 0
        fi
    else
        echo -e "${VERMELHO}✗ FALHOU${NC} - Sucesso esperado: $esperado_sucesso, recebido: $sucesso"
        echo "Resposta: $resposta"
        TESTES_FALHARAM=$((TESTES_FALHARAM + 1))
        return 1
    fi
}

# Função para verificar se usuário está na lista
verificar_usuario_na_lista() {
    local uuid="$1"
    local deve_existir="$2"
    
    local resposta=$(curl -s -X GET "$BASE_URL/admin/administradores" -b "$COOKIE_JAR")
    local dados=$(echo "$resposta" | jq -r '.dados // "[]"')
    local encontrado=$(echo "$dados" | jq -r ".[] | select(.uuid == \"$uuid\") | .uuid")
    
    if [ "$deve_existir" = "true" ]; then
        if [ -n "$encontrado" ]; then
            echo -e "${VERDE}✓ PASSOU${NC} - Usuário encontrado na lista"
            TESTES_PASSARAM=$((TESTES_PASSARAM + 1))
            return 0
        else
            echo -e "${VERMELHO}✗ FALHOU${NC} - Usuário deveria estar na lista mas não está"
            TESTES_FALHARAM=$((TESTES_FALHARAM + 1))
            return 1
        fi
    else
        if [ -z "$encontrado" ]; then
            echo -e "${VERDE}✓ PASSOU${NC} - Usuário não está na lista (comportamento correto)"
            TESTES_PASSARAM=$((TESTES_PASSARAM + 1))
            return 0
        else
            echo -e "${VERMELHO}✗ FALHOU${NC} - Usuário não deveria estar na lista mas está"
            TESTES_FALHARAM=$((TESTES_FALHARAM + 1))
            return 1
        fi
    fi
}

# Função para verificar quantidade de papéis
verificar_quantidade_papeis() {
    local uuid="$1"
    local quantidade_esperada="$2"
    
    local resposta=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -c "$COOKIE_JAR" \
        -d '{"email": "admin@livraria.com.br", "senha": "Admin@123"}')
    
    local quantidade=$(echo "$resposta" | jq -r '.dados.user.papeis | length')
    
    if [ "$quantidade" = "$quantidade_esperada" ]; then
        echo -e "${VERDE}✓ PASSOU${NC} - Usuário tem $quantidade papéis (esperado: $quantidade_esperada)"
        TESTES_PASSARAM=$((TESTES_PASSARAM + 1))
        return 0
    else
        echo -e "${VERMELHO}✗ FALHOU${NC} - Usuário tem $quantidade papéis (esperado: $quantidade_esperada)"
        TESTES_FALHARAM=$((TESTES_FALHARAM + 1))
        return 1
    fi
}

echo "=========================================="
echo "TESTE DE INTEGRAÇÃO - PAPÉIS DE USUÁRIO"
echo "=========================================="
echo "Sem mocks - usando endpoints reais"
echo ""

# Limpar cookies
rm -f "$COOKIE_JAR"

# Cenário 1: Login como Admin Mestre
TOTAL_TESTES=$((TOTAL_TESTES + 1))
echo -e "\n${AMARELO}Teste $TOTAL_TESTES: Login Admin Mestre${NC}"
resposta_login=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -c "$COOKIE_JAR" \
    -d '{"email": "admin@livraria.com.br", "senha": "Admin@123"}')
sucesso_login=$(echo "$resposta_login" | jq -r '.sucesso')
if [ "$sucesso_login" = "true" ]; then
    echo -e "${VERDE}✓ PASSOU${NC} - Login realizado com sucesso"
    echo "UUID: $(echo "$resposta_login" | jq -r '.dados.user.uuid')"
    echo "Papéis: $(echo "$resposta_login" | jq -r '.dados.user.papeis')"
    TESTES_PASSARAM=$((TESTES_PASSARAM + 1))
else
    echo -e "${VERMELHO}✗ FALHOU${NC} - Login falhou"
    echo "Resposta: $resposta_login"
    TESTES_FALHARAM=$((TESTES_FALHARAM + 1))
    exit 1
fi

# Cenário 2: Associar papel admin a usuário que já tem papel cliente
executar_teste \
    "Associar papel admin ao usuário" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/associar' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 2}'" \
    "true" \
    "Papel associado"

# Cenário 3: Verificar que usuário aparece na lista de administradores
TOTAL_TESTES=$((TOTAL_TESTES + 1))
echo -e "\n${AMARELO}Teste $TOTAL_TESTES: Verificar usuário na lista de administradores${NC}"
verificar_usuario_na_lista "$UUID_USUARIO_TESTE" "true"

# Cenário 4: Verificar que usuário tem 2 papéis (cliente + admin)
TOTAL_TESTES=$((TOTAL_TESTES + 1))
echo -e "\n${AMARELO}Teste $TOTAL_TESTES: Verificar quantidade de papéis (deve ser 2)${NC}"
verificar_quantidade_papeis "$UUID_USUARIO_TESTE" "2"

# Cenário 5: Tentar associar mesmo papel novamente (deve ser idempotente)
executar_teste \
    "Associar papel já existente (idempotência)" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/associar' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 2}'" \
    "true" \
    ""

# Cenário 6: Tentar associar papel inválido
executar_teste \
    "Associar papel inválido (id=999)" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/associar' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 999}'" \
    "false" \
    "Papel inválido"

# Cenário 7: Tentar associar papel a UUID inexistente
executar_teste \
    "Associar papel a UUID inexistente" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/associar' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"00000000-0000-0000-0000-000000000999\", \"idPapel\": 2}'" \
    "false" \
    "Usuário não encontrado"

# Cenário 8: Tentar associar sem autenticação
executar_teste \
    "Associar papel sem autenticação" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/associar' -H 'Content-Type: application/json' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 2}'" \
    "false" \
    "Token não fornecido"

# Cenário 9: Remover papel admin do usuário
executar_teste \
    "Remover papel admin do usuário" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/remover' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 2}'" \
    "true" \
    "Papel removido"

# Cenário 10: Verificar que usuário NÃO aparece mais na lista de administradores (comportamento correto)
TOTAL_TESTES=$((TOTAL_TESTES + 1))
echo -e "\n${AMARELO}Teste $TOTAL_TESTES: Verificar usuário NÃO está na lista de administradores (após remoção)${NC}"
verificar_usuario_na_lista "$UUID_USUARIO_TESTE" "false"

# Cenário 11: Verificar que usuário tem apenas 1 papel (cliente)
TOTAL_TESTES=$((TOTAL_TESTES + 1))
echo -e "\n${AMARELO}Teste $TOTAL_TESTES: Verificar quantidade de papéis (deve ser 1)${NC}"
verificar_quantidade_papeis "$UUID_USUARIO_TESTE" "1"

# Cenário 12: Tentar remover papel que não existe
executar_teste \
    "Remover papel que não está associado" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/remover' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 2}'" \
    "false" \
    "Papel não encontrado"

# Cenário 13: Tentar remover único papel do usuário (deve falhar - RN: usuário deve ter pelo menos 1 papel)
executar_teste \
    "Remover único papel do usuário (deve falhar)" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/remover' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 1}'" \
    "false" \
    "pelo menos um papel"

# Cenário 14: Reassociar papel admin (cleanup para restaurar estado inicial)
executar_teste \
    "Reassociar papel admin (cleanup)" \
    "curl -s -X POST '$BASE_URL/usuarios/papeis/associar' -H 'Content-Type: application/json' -b '$COOKIE_JAR' -d '{\"uuidUsuario\": \"$UUID_USUARIO_TESTE\", \"idPapel\": 2}'" \
    "true" \
    "Papel associado"

# Cenário 15: Verificar estado final restaurado
TOTAL_TESTES=$((TOTAL_TESTES + 1))
echo -e "\n${AMARELO}Teste $TOTAL_TESTES: Verificar estado final restaurado (usuário com 2 papéis)${NC}"
verificar_quantidade_papeis "$UUID_USUARIO_TESTE" "2"

# Limpar cookies
rm -f "$COOKIE_JAR"

# Resumo
echo ""
echo "=========================================="
echo "RESUMO DOS TESTES"
echo "=========================================="
echo -e "Total de testes: $TOTAL_TESTES"
echo -e "${VERDE}Testes passaram: $TESTES_PASSARAM${NC}"
echo -e "${VERMELHO}Testes falharam: $TESTES_FALHARAM${NC}"
echo ""

if [ $TESTES_FALHARAM -eq 0 ]; then
    echo -e "${VERDE}TODOS OS TESTES PASSARAM!${NC}"
    exit 0
else
    echo -e "${VERMELHO}ALGUNS TESTES FALHARAM${NC}"
    exit 1
fi
