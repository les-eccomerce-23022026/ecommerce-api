#!/bin/bash

# Script para testar endpoints de gerenciamento de papéis de usuários
# Backend rodando em http://localhost:3000/api

BASE_URL="http://localhost:3000/api"
COOKIE_JAR_ADMIN="/tmp/admin_papeis_cookies.txt"
COOKIE_JAR_CLIENTE="/tmp/cliente_papeis_cookies.txt"

# UUID fixo do admin mestre para testes iniciais
UUID_USUARIO_TESTE="00000000-0000-0000-0000-000000000001"

# Cores para output
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
AZUL='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "TESTE DE ENDPOINTS DE PAPÉIS DE USUÁRIO"
echo "=========================================="
echo ""

# Limpar cookies anteriores
rm -f $COOKIE_JAR_ADMIN $COOKIE_JAR_CLIENTE

# Função para imprimir resultado
imprimir_resultado() {
    if [ $1 -eq 0 ]; then
        echo -e "${VERDE}✓ $2${NC}"
    else
        echo -e "${VERMELHO}✗ $2${NC}"
    fi
}

# 1. LOGIN ADMIN MESTRE
echo -e "${AMARELO}1. Login Admin Mestre${NC}"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIE_JAR_ADMIN \
  -d '{
    "email": "admin@livraria.com.br",
    "senha": "Admin@123"
  }' | jq '.'
echo ""

# 2. USAR UUID DO ADMIN MESTRE PARA TESTES
echo -e "${AMARELO}2. Usando UUID do Admin Mestre para testes${NC}"
echo -e "${AZUL}UUID do usuário de teste: $UUID_USUARIO_TESTE${NC}"
echo ""

# 4. ASSOCIAR PAPEL ADMIN A UM CLIENTE
echo -e "${AMARELO}4. Associar Papel Admin ao Usuário${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/associar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 2
  }" | jq '.' 2>/dev/null || echo "Erro ao associar papel"
echo ""

# 5. VERIFICAR USUÁRIO COM MÚLTIPLOS PAPÉIS
echo -e "${AMARELO}5. Verificar Usuário com Múltiplos Papéis${NC}"
curl -s -X GET "$BASE_URL/admin/administradores" \
  -b $COOKIE_JAR_ADMIN | jq ".dados[] | select(.uuid == \"$UUID_USUARIO_TESTE\")" 2>/dev/null || echo "Erro ao listar usuários"
echo ""

# 6. TENTAR ASSOCIAR PAPEL JÁ EXISTENTE (deve funcionar com ON CONFLICT)
echo -e "${AMARELO}6. Tentar Associar Papel Já Existente (deve funcionar)${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/associar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 2
  }" | jq '.' 2>/dev/null || echo "Erro ao associar papel duplicado"
echo ""

# 7. TENTAR ASSOCIAR PAPEL INVÁLIDO (idPapel = 999)
echo -e "${AMARELO}7. Tentar Associar Papel Inválido (idPapel = 999)${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/associar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 999
  }" | jq '.' 2>/dev/null || echo "Erro ao associar papel inválido"
echo ""

# 8. TENTAR ASSOCIAR PAPEL COM UUID INEXISTENTE
echo -e "${AMARELO}8. Tentar Associar Papel com UUID Inexistente${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/associar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d '{
    "uuidUsuario": "00000000-0000-0000-0000-000000000999",
    "idPapel": 2
  }' | jq '.' 2>/dev/null || echo "Erro ao associar papel com UUID inexistente"
echo ""

# 9. TENTAR ASSOCIAR SEM AUTENTICAÇÃO
echo -e "${AMARELO}9. Tentar Associar Papel sem Autenticação${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/associar" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 2
  }" | jq '.' 2>/dev/null || echo "Erro ao associar sem autenticação"
echo ""

# 10. REMOVER PAPEL ADMIN DO USUÁRIO
echo -e "${AMARELO}10. Remover Papel Admin do Usuário${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/remover" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 2
  }" | jq '.' 2>/dev/null || echo "Erro ao remover papel"
echo ""

# 11. VERIFICAR USUÁRIO APÓS REMOÇÃO DO PAPEL
echo -e "${AMARELO}11. Verificar Usuário Após Remoção do Papel${NC}"
curl -s -X GET "$BASE_URL/admin/administradores" \
  -b $COOKIE_JAR_ADMIN | jq ".dados[] | select(.uuid == \"$UUID_USUARIO_TESTE\")" 2>/dev/null || echo "Erro ao listar usuários após remoção"
echo ""

# 12. TENTAR REMOVER PAPEL QUE NÃO EXISTE
echo -e "${AMARELO}12. Tentar Remover Papel que Não Existe${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/remover" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 2
  }" | jq '.' 2>/dev/null || echo "Erro ao remover papel inexistente"
echo ""

# 13. TENTAR REMOVER ÚNICO PAPEL DO USUÁRIO (deve falhar)
echo -e "${AMARELO}13. Tentar Remover Único Papel do Usuário (deve falhar)${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/remover" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 1
  }" | jq '.' 2>/dev/null || echo "Erro ao remover único papel"
echo ""

# 14. REASSOCIAR PAPEL ADMIN PARA TESTE FINAL
echo -e "${AMARELO}14. Reassociar Papel Admin para Teste Final${NC}"
curl -s -X POST "$BASE_URL/usuarios/papeis/associar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_ADMIN \
  -d "{
    \"uuidUsuario\": \"$UUID_USUARIO_TESTE\",
    \"idPapel\": 2
  }" | jq '.' 2>/dev/null || echo "Erro ao reassociar papel"
echo ""

# 15. VERIFICAR USUÁRIO COM AMBOS PAPÉIS NO FINAL
echo -e "${AMARELO}15. Verificar Usuário com Ambos Papéis (cliente + admin)${NC}"
curl -s -X GET "$BASE_URL/admin/administradores" \
  -b $COOKIE_JAR_ADMIN | jq ".dados[] | select(.uuid == \"$UUID_USUARIO_TESTE\")" 2>/dev/null || echo "Erro ao verificar usuário final"
echo ""

# Limpar cookies
rm -f $COOKIE_JAR_ADMIN $COOKIE_JAR_CLIENTE

echo "=========================================="
echo "TESTE CONCLUÍDO"
echo "=========================================="
