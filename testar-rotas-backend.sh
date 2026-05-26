#!/bin/bash

# Script para testar todos os casos de uso da 7ª entrega usando curl
# Backend rodando em http://localhost:3002/api

BASE_URL="http://localhost:3002/api"
COOKIE_JAR_CLIENTE="/tmp/cliente_cookies.txt"
COOKIE_JAR_ADMIN="/tmp/admin_cookies.txt"

# Cores para output
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "TESTE DE ROTAS BACKEND - 7ª ENTREGA"
echo "=========================================="
echo ""

# Limpar cookies anteriores
rm -f $COOKIE_JAR_CLIENTE $COOKIE_JAR_ADMIN

# Função para imprimir resultado
imprimir_resultado() {
    if [ $1 -eq 0 ]; then
        echo -e "${VERDE}✓ $2${NC}"
    else
        echo -e "${VERMELHO}✗ $2${NC}"
    fi
}

# 1. BOOTSTRAP ADMIN (criar admin inicial)
echo -e "${AMARELO}1. Bootstrap Admin${NC}"
curl -s -X POST "$BASE_URL/admin/bootstrap" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin Mestre",
    "email": "admin@ecm.com",
    "senha": "admin123"
  }' | jq '.'
echo ""

# 2. LOGIN ADMIN
echo -e "${AMARELO}2. Login Admin${NC}"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIE_JAR_ADMIN \
  -d '{
    "email": "admin@livraria.com.br",
    "senha": "Admin@123"
  }' | jq '.'
echo ""

# 3. LOGIN CLIENTE
echo -e "${AMARELO}3. Login Cliente${NC}"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIE_JAR_CLIENTE \
  -d '{
    "email": "clientetest@email.com",
    "senha": "@asdfJKLÇ123"
  }' | jq '.'
echo ""

# 4. LISTAR LIVROS DO CATÁLOGO
echo -e "${AMARELO}4. Listar Livros do Catálogo${NC}"
curl -s -X GET "$BASE_URL/livros" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 5. OBTER DETALHES DE UM LIVRO (usando UUID fixo para teste)
echo -e "${AMARELO}5. Obter Detalhes de Livro${NC}"
LIVRO_UUID="55667788-1122-3344-aabb-ccddeeff0011"
curl -s -X GET "$BASE_URL/livros/$LIVRO_UUID" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 6. ADICIONAR ITEM AO CARRINHO
echo -e "${AMARELO}6. Adicionar Item ao Carrinho${NC}"
curl -s -X POST "$BASE_URL/carrinho/itens" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"livroUuid\": \"$LIVRO_UUID\",
    \"quantidade\": 2
  }" | jq '.'
echo ""

# 7. OBTER CARRINHO
echo -e "${AMARELO}7. Obter Carrinho${NC}"
curl -s -X GET "$BASE_URL/carrinho" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 8. COTAR FRETE
echo -e "${AMARELO}8. Cotar Frete${NC}"
curl -s -X POST "$BASE_URL/frete/cotar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d '{
    "cepDestino": "01310-100"
  }' | jq '.'
echo ""

# 9. LISTAR CUPONS DISPONÍVEIS
echo -e "${AMARELO}9. Listar Cupons Disponíveis${NC}"
curl -s -X GET "$BASE_URL/cupom/disponiveis" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 10. APLICAR CUPOM
echo -e "${AMARELO}10. Aplicar Cupom${NC}"
curl -s -X POST "$BASE_URL/cupom/aplicar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d '{
    "codigo": "DESCONTO10"
  }' | jq '.'
echo ""

# 11. CADASTRAR NOVO CARTÃO (Cliente)
echo -e "${AMARELO}11. Cadastrar Novo Cartão${NC}"
curl -s -X POST "$BASE_URL/clientes/perfil/cartoes" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d '{
    "numero": "4111111111111111",
    "nomeTitular": "Cliente Teste",
    "validade": "12/2025",
    "cvv": "123"
  }' | jq '.'
echo ""

# 12. LISTAR CARTÕES DO CLIENTE
echo -e "${AMARELO}12. Listar Cartões do Cliente${NC}"
curl -s -X GET "$BASE_URL/clientes/perfil/cartoes" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 13. CRIAR VENDA/PEDIDO (Cliente realizar compra)
echo -e "${AMARELO}13. Criar Venda/Pedido (Cliente realizar compra)${NC}"
VENDA_RESPONSE=$(curl -s -X POST "$BASE_URL/vendas" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"enderecoUuid\": \"fe348c4f-dfb5-43b1-bb0f-db718d6f61ed\",
    \"cartaoUuid\": \"a2d6bbf2-63bf-4732-ae7c-1472eebf3d56\",
    \"formaPagamento\": \"cartao\",
    \"valorTotal\": 114.8,
    \"valorTotalItens\": 99.8,
    \"valorFrete\": 15,
    \"parcelas\": 1,
    \"itens\": [
      {
        \"livroUuid\": \"$LIVRO_UUID\",
        \"quantidade\": 2,
        \"precoUnitario\": 49.9
      }
    ]
  }")
echo "$VENDA_RESPONSE" | jq '.'
VENDA_UUID=$(echo "$VENDA_RESPONSE" | jq -r '.dados.uuid // empty')
echo "Venda UUID: $VENDA_UUID"
echo ""

# 14. VISUALIZAR DETALHES DA VENDA
echo -e "${AMARELO}14. Visualizar Detalhes da Venda${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X GET "$BASE_URL/vendas/$VENDA_UUID" \
    -b $COOKIE_JAR_CLIENTE | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 15. LISTAR VENDAS DO CLIENTE
echo -e "${AMARELO}15. Listar Vendas do Cliente${NC}"
curl -s -X GET "$BASE_URL/minhas-vendas" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 16. OBTER INFORMAÇÕES DE PAGAMENTO
echo -e "${AMARELO}16. Obter Informações de Pagamento${NC}"
curl -s -X GET "$BASE_URL/pagamento/info" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 17. PROCESSAR PAGAMENTO (Cliente pagar)
echo -e "${AMARELO}17. Processar Pagamento (Cliente pagar)${NC}"
PAGAMENTO_RESPONSE=$(curl -s -X POST "$BASE_URL/pagamento/processar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"vendaUuid\": \"$VENDA_UUID\",
    \"formaPagamento\": \"pix\"
  }")
echo "$PAGAMENTO_RESPONSE" | jq '.'
PAGAMENTO_UUID=$(echo "$PAGAMENTO_RESPONSE" | jq -r '.dados.uuid // empty')
echo "Pagamento UUID: $PAGAMENTO_UUID"
echo ""

# 18. CONSULTAR PAGAMENTO
echo -e "${AMARELO}18. Consultar Pagamento${NC}"
if [ -n "$PAGAMENTO_UUID" ]; then
  curl -s -X GET "$BASE_URL/pagamentos/$PAGAMENTO_UUID" \
    -b $COOKIE_JAR_CLIENTE | jq '.'
else
  echo -e "${VERMELHO}Pagamento UUID não encontrado${NC}"
fi
echo ""

# 19. SIMULAR WEBHOOK PAGAMENTO PIX (Admin confirma pagamento)
echo -e "${AMARELO}19. Simular Webhook Pagamento PIX (Admin confirma pagamento)${NC}"
if [ -n "$PAGAMENTO_UUID" ]; then
  curl -s -X POST "$BASE_URL/webhooks/pagamento-pix-simulado" \
    -H "Content-Type: application/json" \
    -d "{
      \"pagamentoUuid\": \"$PAGAMENTO_UUID\",
      \"status\": \"aprovado\"
    }" | jq '.'
else
  echo -e "${VERMELHO}Pagamento UUID não encontrado${NC}"
fi
echo ""

# 20. AGENDAR ENTREGA
echo -e "${AMARELO}20. Agendar Entrega${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X POST "$BASE_URL/entregas" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN \
    -d "{
      \"vendaUuid\": \"$VENDA_UUID\",
      \"dataEntrega\": \"2026-05-20\"
    }" | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 21. LISTAR ENTREGAS
echo -e "${AMARELO}21. Listar Entregas${NC}"
curl -s -X GET "$BASE_URL/entregas" \
  -b $COOKIE_JAR_ADMIN | jq '.'
echo ""

# 22. DESPACHAR PEDIDO (Admin define que produto está EM TRANSPORTE)
echo -e "${AMARELO}22. Despachar Pedido (Admin define EM TRANSPORTE)${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID/despachar" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN \
    -d '{
      "codigoRastreio": "BR123456789BR"
    }' | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 23. CONFIRMAR ENTREGA DO PEDIDO (Admin confirma que produto foi ENTREGUE)
echo -e "${AMARELO}23. Confirmar Entrega do Pedido (Admin confirma ENTREGUE)${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID/entrega" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 24. SOLICITAR TROCA (Usuário pode solicitar troca ou devolução)
echo -e "${AMARELO}24. Solicitar Troca (Usuário solicita troca/devolução)${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X POST "$BASE_URL/vendas/$VENDA_UUID/troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_CLIENTE \
    -d '{
      "motivo": "Produto com defeito",
      "tipo": "troca",
      "itens": [
        {
          "livroUuid": "'$LIVRO_UUID'",
          "quantidade": 1
        }
      ]
    }' | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 25. LISTAR TROCAS PENDENTES (Admin)
echo -e "${AMARELO}25. Listar Trocas Pendentes (Admin)${NC}"
curl -s -X GET "$BASE_URL/admin/pedidos/trocas" \
  -b $COOKIE_JAR_ADMIN | jq '.'
echo ""

# 26. AUTORIZAR TROCA (Admin aceitar troca/devolução)
echo -e "${AMARELO}26. Autorizar Troca (Admin aceita troca/devolução)${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID/autorizar-troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 27. CONFIRMAR RECEBIMENTO DE TROCA (Admin confirma recebimento do produto devolvido)
echo -e "${AMARELO}27. Confirmar Recebimento de Troca (Admin confirma recebimento)${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID/confirmar-recebimento" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 28. VERIFICAR CUPOM DE TROCA GERADO (Sistema gerar cupom de troca)
echo -e "${AMARELO}28. Listar Cupons Disponíveis (Verificar cupom de troca gerado)${NC}"
curl -s -X GET "$BASE_URL/cupom/disponiveis" \
  -b $COOKIE_JAR_CLIENTE | jq '.'
echo ""

# 29. REJEITAR TROCA (Admin negar troca/devolução) - teste adicional
echo -e "${AMARELO}29. Rejeitar Troca (Admin nega troca/devolução)${NC}"
if [ -n "$VENDA_UUID" ]; then
  curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID/rejeitar-troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN \
    -d '{
      "motivo": "Produto sem defeito conforme análise"
    }' | jq '.'
else
  echo -e "${VERMELHO}Venda UUID não encontrado${NC}"
fi
echo ""

# 30. LISTAR PEDIDOS ADMIN
echo -e "${AMARELO}30. Listar Pedidos Admin${NC}"
curl -s -X GET "$BASE_URL/admin/pedidos" \
  -b $COOKIE_JAR_ADMIN | jq '.'
echo ""

# 31. DASHBOARD ADMIN
echo -e "${AMARELO}31. Dashboard Admin${NC}"
curl -s -X GET "$BASE_URL/admin/dashboard" \
  -b $COOKIE_JAR_ADMIN | jq '.'
echo ""

# Limpar cookies
rm -f $COOKIE_JAR_CLIENTE $COOKIE_JAR_ADMIN

echo "=========================================="
echo -e "${VERDE}TESTES CONCLUÍDOS${NC}"
echo "=========================================="
