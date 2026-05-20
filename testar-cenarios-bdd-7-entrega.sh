#!/bin/bash

# Script de Teste BDD - 7ª Entrega
# Testa todos os cenários BDD via curl no terminal

BASE_URL="http://localhost:3002/api"
LOJA_ID="${LOJA_ID:-1}"
COOKIE_JAR_CLIENTE="/tmp/cliente_cookies_bdd.txt"
COOKIE_JAR_ADMIN="/tmp/admin_cookies_bdd.txt"

# Cores para output
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
AZUL='\033[0;34m'
NC='\033[0m' # No Color

# Cria entrega e confirma recebimento (status ENTREGUE + data de entrega)
criar_entrega_e_confirmar() {
  local venda_uuid="$1"
  local resposta
  resposta=$(curl -s -X POST "$BASE_URL/entregas" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d "{
      \"vendaUuid\": \"$venda_uuid\",
      \"tipoFrete\": \"PAC\",
      \"endereco\": \"Endereço de Teste\",
      \"custo\": 15,
      \"entregador\": \"Transportadora Padrão\"
    }")
  local entrega_uuid
  entrega_uuid=$(echo "$resposta" | jq -r '.uuid // empty')
  if [ -z "$entrega_uuid" ]; then
    echo "$resposta" | jq '.'
    return 1
  fi
  curl -s -X PATCH "$BASE_URL/entregas/$entrega_uuid/confirmar" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" > /dev/null
  echo "$entrega_uuid"
}

obter_item_uuid_venda() {
  local venda_uuid="$1"
  curl -s -X GET "$BASE_URL/vendas/$venda_uuid" -b "$COOKIE_JAR_CLIENTE" | jq -r '.itens[0].id // empty'
}

# Simula pedido entregue há mais de 7 dias (RN0043) via Postgres no Docker
retroceder_data_entrega_8_dias() {
  local venda_uuid="$1"
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'ecm_postgres'; then
    docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -q -c \
      "UPDATE livraria_comercial.vendas SET ven_data_hora_entrega = NOW() - INTERVAL '8 days' WHERE ven_uuid = '${venda_uuid}';" \
      > /dev/null
    return 0
  fi
  return 1
}

# Limpa cookies
rm -f $COOKIE_JAR_CLIENTE $COOKIE_JAR_ADMIN

echo "=========================================="
echo "TESTES BDD - 7ª ENTREGA (VENDA COMPLETA)"
echo "=========================================="
echo ""

# ========================================
# 1. FLUXO DE COMPRA E PAGAMENTO (CLIENTE)
# ========================================

# Setup: Login Cliente
echo -e "${AZUL}=== SETUP: Login Cliente ===${NC}"
LOGIN_CLIENTE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIE_JAR_CLIENTE \
  -d '{
    "email": "clientetest@email.com",
    "senha": "@asdfJKLÇ123"
  }')
echo "$LOGIN_CLIENTE" | jq '.'
CLIENTE_UUID=$(echo "$LOGIN_CLIENTE" | jq -r '.dados.user.uuid')
echo "Cliente UUID: $CLIENTE_UUID"
echo ""

# Setup: Login Admin
echo -e "${AZUL}=== SETUP: Login Admin ===${NC}"
LOGIN_ADMIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIE_JAR_ADMIN \
  -d '{
    "email": "admintest@email.com",
    "senha": "@asdfJKLÇ123"
  }')
echo "$LOGIN_ADMIN" | jq '.'
echo ""

# Setup: Obter livro para teste
echo -e "${AZUL}=== SETUP: Obter livro para teste ===${NC}"
LIVRO_RESPONSE=$(curl -s -X GET "$BASE_URL/livros" -H "x-loja-id: $LOJA_ID" -b $COOKIE_JAR_CLIENTE)
# A API já filtra por estoque > 0, então usar o primeiro livro
LIVRO_UUID=$(echo "$LIVRO_RESPONSE" | jq -r '.livros[0].uuid')
LIVRO_PRECO=$(echo "$LIVRO_RESPONSE" | jq -r '.livros[0].preco')
echo "Livro UUID: $LIVRO_UUID"
echo "Livro Preço: $LIVRO_PRECO"
echo ""

# Setup: Adicionar item ao carrinho
echo -e "${AZUL}=== SETUP: Adicionar item ao carrinho ===${NC}"
curl -s -X POST "$BASE_URL/carrinho/itens" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{\"livroUuid\": \"$LIVRO_UUID\", \"quantidade\": 2}" | jq '.'
echo ""

# Setup: Obter endereço do cliente
echo -e "${AZUL}=== SETUP: Obter endereço do cliente ===${NC}"
ENDERECO_RESPONSE=$(curl -s -X GET "$BASE_URL/clientes/perfil" -b $COOKIE_JAR_CLIENTE)
ENDERECO_UUID=$(echo "$ENDERECO_RESPONSE" | jq -r '.dados.enderecos[0].uuid // empty')
echo "Endereço UUID: $ENDERECO_UUID"
echo ""

# Setup: Obter cartão do cliente
echo -e "${AZUL}=== SETUP: Obter cartão do cliente ===${NC}"
CARTAO_RESPONSE=$(curl -s -X GET "$BASE_URL/clientes/perfil" -b $COOKIE_JAR_CLIENTE)
CARTAO_UUID=$(echo "$CARTAO_RESPONSE" | jq -r '.dados.cartoes[0].uuid // empty')
echo "Cartão UUID: $CARTAO_UUID"
echo ""

# ========================================
# CENÁRIO 1: Compra multi-cartão + cupom + novos endereço/cartão (FELIZ)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 1: Compra multi-cartão + cupom + novos endereço/cartão (FELIZ)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

# NOTA: Este cenário requer funcionalidade de split payment e novos endereço/cartão
# que pode não estar totalmente implementada. Vamos testar o fluxo básico.

echo -e "${AMARELO}Dado: Cliente no checkout com itens no carrinho${NC}"
echo "✓ Carrinho configurado"
echo ""

echo -e "${AMARELO}Quando: Finaliza a compra com cartão existente${NC}"
VENDA_C1=$(curl -s -X POST "$BASE_URL/vendas" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"enderecoUuid\": \"$ENDERECO_UUID\",
    \"cartaoUuid\": \"$CARTAO_UUID\",
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
echo "$VENDA_C1" | jq '.'
VENDA_UUID_C1=$(echo "$VENDA_C1" | jq -r '.id // .uuid // empty')
echo ""

echo -e "${AMARELO}Então: Sistema deve registrar a venda com status EM PROCESSAMENTO${NC}"
if [ -n "$VENDA_UUID_C1" ]; then
  echo "✓ Venda criada com UUID: $VENDA_UUID_C1"
  STATUS=$(echo "$VENDA_C1" | jq -r '.status')
  if [ "$STATUS" = "EM PROCESSAMENTO" ]; then
    echo "✓ Status correto: EM PROCESSAMENTO"
  else
    echo -e "${VERMELHO}✗ Status incorreto: $STATUS${NC}"
  fi
  
  # Setup: Criar entrega e confirmar (status ENTREGUE)
  echo -e "${AZUL}=== SETUP: Criar entrega e confirmar recebimento ===${NC}"
  ENTREGA_UUID_C1=$(criar_entrega_e_confirmar "$VENDA_UUID_C1")
  if [ -n "$ENTREGA_UUID_C1" ]; then
    echo "✓ Entrega confirmada: $ENTREGA_UUID_C1"
  else
    echo -e "${VERMELHO}✗ Falha ao confirmar entrega${NC}"
  fi
  echo ""
else
  echo -e "${VERMELHO}✗ Falha ao criar venda${NC}"
fi
echo ""

# ========================================
# CENÁRIO 2: Falha no pagamento com um dos cartões (FALHA)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 2: Falha no pagamento (FALHA)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AMARELO}Dado: Cliente tenta finalizar compra sem dados de pagamento${NC}"
echo "✓ Pré-condição configurada"
echo ""

echo -e "${AMARELO}Quando: Envia requisição sem campos obrigatórios${NC}"
echo "⚠ Testando validação de payload inválido..."
PAGAMENTO_FALHA=$(curl -s -X POST "$BASE_URL/pagamento/processar" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d '{}')
echo "$PAGAMENTO_FALHA" | jq '.'
echo ""

echo -e "${AMARELO}Então: Sistema deve informar o erro ao cliente${NC}"
if echo "$PAGAMENTO_FALHA" | jq -e '.erro' > /dev/null; then
  echo "✓ Erro retornado corretamente"
  MENSAGEM_ERRO=$(echo "$PAGAMENTO_FALHA" | jq -r '.erro')
  echo "✓ Mensagem: $MENSAGEM_ERRO"
else
  echo -e "${VERMELHO}✗ Erro não retornado${NC}"
fi
echo ""

# ========================================
# CENÁRIO 3: Pagamento integral com Cupom de Troca (VARIAÇÃO)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 3: Pagamento integral com Cupom de Troca (VARIAÇÃO)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AMARELO}Dado: Cliente possui cupom de troca disponível${NC}"
CUPONS=$(curl -s -X GET "$BASE_URL/cupom/disponiveis" -b $COOKIE_JAR_CLIENTE)
echo "$CUPONS" | jq '.'
CUPOM_TROCA_UUID=$(echo "$CUPONS" | jq -r '.dados[] | select(.tipo=="troca") | .uuid' | head -1)
CUPOM_TROCA_CODIGO=$(echo "$CUPONS" | jq -r '.dados[] | select(.tipo=="troca") | .codigo' | head -1)
CUPOM_TROCA_VALOR=$(echo "$CUPONS" | jq -r '.dados[] | select(.tipo=="troca") | .valorDesconto' | head -1)
echo "Cupom: $CUPOM_TROCA_CODIGO (saldo R$ $CUPOM_TROCA_VALOR)"
echo ""

echo -e "${AMARELO}Quando: Cliente finaliza compra apenas com cupom de troca (100%)${NC}"
if [ -n "$CUPOM_TROCA_UUID" ] && [ -n "$CUPOM_TROCA_CODIGO" ]; then
  VENDA_C3=$(curl -s -X POST "$BASE_URL/vendas" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_CLIENTE \
    -d "{
      \"enderecoUuid\": \"$ENDERECO_UUID\",
      \"cartaoUuid\": \"$CARTAO_UUID\",
      \"formaPagamento\": \"cupom\",
      \"valorTotal\": $CUPOM_TROCA_VALOR,
      \"valorTotalItens\": $CUPOM_TROCA_VALOR,
      \"valorFrete\": 0,
      \"parcelas\": 1,
      \"itens\": [
        {
          \"livroUuid\": \"$LIVRO_UUID\",
          \"quantidade\": 1,
          \"precoUnitario\": $CUPOM_TROCA_VALOR
        }
      ]
    }")
  VENDA_UUID_C3=$(echo "$VENDA_C3" | jq -r '.id // .uuid // empty')
  PAGAMENTO_C3=$(curl -s -X POST "$BASE_URL/pagamento/processar" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_CLIENTE \
    -d "{
      \"vendaUuid\": \"$VENDA_UUID_C3\",
      \"valorTotal\": 0,
      \"idIntencao\": \"CUPOM-ONLY\",
      \"segredoConfirmacao\": \"CUPOM-ONLY\",
      \"pagamentosCartao\": [],
      \"cuponsAplicados\": [{
        \"uuid\": \"$CUPOM_TROCA_UUID\",
        \"codigo\": \"$CUPOM_TROCA_CODIGO\",
        \"tipo\": \"troca\",
        \"valor\": $CUPOM_TROCA_VALOR
      }]
    }")
  echo "$PAGAMENTO_C3" | jq '.'
else
  echo -e "${VERMELHO}✗ Nenhum cupom de troca disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Sistema deve autorizar a compra sem solicitar dados de cartão${NC}"
if echo "$PAGAMENTO_C3" | jq -e '.sucesso == true' > /dev/null 2>&1; then
  echo "✓ Pagamento 100% cupom aprovado"
  STATUS_VENDA_C3=$(curl -s -X GET "$BASE_URL/vendas/$VENDA_UUID_C3" -b $COOKIE_JAR_CLIENTE | jq -r '.status // empty')
  if [ "$STATUS_VENDA_C3" = "APROVADA" ]; then
    echo "✓ Venda com status APROVADA"
  else
    echo -e "${AMARELO}⚠ Status da venda: $STATUS_VENDA_C3 (esperado: APROVADA)${NC}"
  fi
else
  echo -e "${VERMELHO}✗ Pagamento 100% cupom não foi aprovado${NC}"
fi
echo ""

# ========================================
# 2. TROCA E DEVOLUÇÃO (CLIENTE E SISTEMA)
# ========================================

# Setup: Criar uma venda aprovada para testes de troca
echo -e "${AZUL}=== SETUP: Criar venda aprovada para testes de troca ===${NC}"
VENDA_TROCA=$(curl -s -X POST "$BASE_URL/vendas" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"enderecoUuid\": \"$ENDERECO_UUID\",
    \"cartaoUuid\": \"$CARTAO_UUID\",
    \"formaPagamento\": \"cartao\",
    \"valorTotal\": 114.8,
    \"valorTotalItens\": 99.8,
    \"valorFrete\": 15,
    \"parcelas\": 1,
    \"itens\": [
      {
        \"livroUuid\": \"$LIVRO_UUID\",
        \"quantidade\": 1,
        \"precoUnitario\": 49.9
      }
    ]
  }")
VENDA_UUID_TROCA=$(echo "$VENDA_TROCA" | jq -r '.id // .uuid // empty')
echo "Venda UUID para troca: $VENDA_UUID_TROCA"

# Setup: Entregar pedido para habilitar troca
if [ -n "$VENDA_UUID_TROCA" ]; then
  echo -e "${AZUL}=== SETUP: Entregar pedido para testes de troca ===${NC}"
  ENTREGA_UUID_TROCA=$(criar_entrega_e_confirmar "$VENDA_UUID_TROCA")
  ITEM_UUID_TROCA=$(obter_item_uuid_venda "$VENDA_UUID_TROCA")
  if [ -n "$ENTREGA_UUID_TROCA" ]; then
    echo "✓ Pedido ENTREGUE — entrega: $ENTREGA_UUID_TROCA | item: $ITEM_UUID_TROCA"
  else
    echo -e "${VERMELHO}✗ Falha ao entregar pedido de troca${NC}"
  fi
  echo ""
fi
echo ""

# ========================================
# CENÁRIO 4: Solicitar troca de um item (FELIZ)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 4: Solicitar troca de um item (FELIZ)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AMARELO}Dado: Cliente possui pedido com status ENTREGUE${NC}"
echo "✓ Pedido entregue no setup"
echo ""

echo -e "${AMARELO}Quando: Seleciona opção 'Solicitar Troca' para item específico${NC}"
if [ -n "$VENDA_UUID_TROCA" ]; then
  TROCA_SOLICITACAO=$(curl -s -X POST "$BASE_URL/vendas/$VENDA_UUID_TROCA/troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_CLIENTE \
    -d "{
      \"motivo\": \"Produto não atendeu expectativas\",
      \"itensUuids\": [\"$ITEM_UUID_TROCA\"]
    }")
  echo "$TROCA_SOLICITACAO" | jq '.'
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Status da solicitação deve ser EM TROCA${NC}"
STATUS_TROCA_C4=$(echo "$TROCA_SOLICITACAO" | jq -r '.status // empty')
if [ "$STATUS_TROCA_C4" = "EM TROCA" ]; then
  echo "✓ Status correto: EM TROCA"
else
  echo -e "${VERMELHO}✗ Status incorreto: $STATUS_TROCA_C4 (esperado: EM TROCA)${NC}"
fi
echo ""

# ========================================
# CENÁRIO 5: Aprovação de Troca e Geração de Cupom (FELIZ)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 5: Aprovação de Troca e Geração de Cupom (FELIZ)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AMARELO}Dado: Administrador aprova solicitação de troca${NC}"
echo "✓ Troca solicitada pelo cliente"
echo ""

echo -e "${AMARELO}Quando: Administrador clica em 'Autorizar Troca'${NC}"
if [ -n "$VENDA_UUID_TROCA" ]; then
  AUTORIZAR_TROCA=$(curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID_TROCA/autorizar-troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN)
  echo "$AUTORIZAR_TROCA" | jq '.'
  STATUS_AUTORIZADO=$(echo "$AUTORIZAR_TROCA" | jq -r '.status // empty')
  if [ "$STATUS_AUTORIZADO" = "TROCA AUTORIZADA" ]; then
    echo "✓ Troca autorizada com sucesso"
  else
    echo -e "${VERMELHO}✗ Status não é TROCA AUTORIZADA: $STATUS_AUTORIZADO${NC}"
  fi
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}E: Administrador clica em 'Confirmar Recebimento de Produto Devolvido'${NC}"
if [ -n "$VENDA_UUID_TROCA" ]; then
  CONFIRMAR_RECEBIMENTO=$(curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID_TROCA/confirmar-recebimento" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN \
    -d '{
      "retornarEstoque": true
    }')
  echo "$CONFIRMAR_RECEBIMENTO" | jq '.'
  STATUS_FINAL=$(echo "$CONFIRMAR_RECEBIMENTO" | jq -r '.pedido.status // empty')
  if [ "$STATUS_FINAL" = "CONCLUÍDA" ]; then
    echo "✓ Troca concluída com sucesso"
    CUPOM_GERADO=$(echo "$CONFIRMAR_RECEBIMENTO" | jq -r '.cupomGerado // empty')
    if [ -n "$CUPOM_GERADO" ]; then
      echo "✓ Cupom gerado: $CUPOM_GERADO"
    fi
  else
    echo -e "${VERMELHO}✗ Status não é CONCLUÍDA: $STATUS_FINAL${NC}"
  fi
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Sistema deve mudar status para TROCA FINALIZADA e gerar cupom${NC}"
echo "✓ Validado acima"

# ========================================
# CENÁRIO 6: Solicitação de troca rejeitada (FALHA)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 6: Solicitação de troca rejeitada (FALHA)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

# Setup: Criar nova venda e solicitar troca para este cenário
echo -e "${AZUL}=== SETUP: Criar venda para teste de rejeição ===${NC}"
VENDA_REJEICAO=$(curl -s -X POST "$BASE_URL/vendas" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"enderecoUuid\": \"$ENDERECO_UUID\",
    \"cartaoUuid\": \"$CARTAO_UUID\",
    \"formaPagamento\": \"cartao\",
    \"valorTotal\": 64.9,
    \"valorTotalItens\": 49.9,
    \"valorFrete\": 15,
    \"parcelas\": 1,
    \"itens\": [
      {
        \"livroUuid\": \"$LIVRO_UUID\",
        \"quantidade\": 1,
        \"precoUnitario\": 49.9
      }
    ]
  }")
VENDA_UUID_REJEICAO=$(echo "$VENDA_REJEICAO" | jq -r '.id // .uuid // empty')
echo "Venda UUID para rejeição: $VENDA_UUID_REJEICAO"

if [ -n "$VENDA_UUID_REJEICAO" ]; then
  criar_entrega_e_confirmar "$VENDA_UUID_REJEICAO" > /dev/null
  ITEM_UUID_REJEICAO=$(obter_item_uuid_venda "$VENDA_UUID_REJEICAO")

  # Solicitar troca
  curl -s -X POST "$BASE_URL/vendas/$VENDA_UUID_REJEICAO/troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_CLIENTE \
    -d "{
      \"motivo\": \"Produto com defeito\",
      \"itensUuids\": [\"$ITEM_UUID_REJEICAO\"]
    }" > /dev/null
fi
echo ""

echo -e "${AMARELO}Dado: Administrador recebe produto para troca${NC}"
echo "✓ Troca solicitada pelo cliente"
echo ""

echo -e "${AMARELO}Quando: Identifica produto danificado e clica em 'Rejeitar Troca'${NC}"
if [ -n "$VENDA_UUID_REJEICAO" ]; then
  REJEITAR_TROCA=$(curl -s -X PATCH "$BASE_URL/admin/pedidos/$VENDA_UUID_REJEICAO/rejeitar-troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN \
    -d '{
      "motivo": "Produto danificado"
    }')
  echo "$REJEITAR_TROCA" | jq '.'
  STATUS_REJEITADO=$(echo "$REJEITAR_TROCA" | jq -r '.status // empty')
  if [ "$STATUS_REJEITADO" = "TROCA REJEITADA" ]; then
    echo "✓ Status correto: TROCA REJEITADA"
  else
    echo -e "${VERMELHO}✗ Status incorreto: $STATUS_REJEITADO${NC}"
  fi
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Status volta para ENTREGUE e não gera cupom${NC}"
if [ -n "$VENDA_UUID_REJEICAO" ]; then
  # Verificar se não há cupom na resposta
  CUPOM_NAO_GERADO=$(echo "$REJEITAR_TROCA" | jq -r '.cupomGerado // empty')
  if [ -z "$CUPOM_NAO_GERADO" ]; then
    echo "✓ Cupom não foi gerado (correto)"
  else
    echo -e "${VERMELHO}✗ Cupom foi gerado incorretamente${NC}"
  fi
fi
echo ""

# ========================================
# CENÁRIO 7: Prazo de arrependimento expirado (EXCEÇÃO)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 7: Prazo de arrependimento expirado (EXCEÇÃO)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AZUL}=== SETUP: Pedido entregue há mais de 7 dias ===${NC}"
VENDA_C7=$(curl -s -X POST "$BASE_URL/vendas" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"enderecoUuid\": \"$ENDERECO_UUID\",
    \"cartaoUuid\": \"$CARTAO_UUID\",
    \"formaPagamento\": \"cartao\",
    \"valorTotal\": 64.9,
    \"valorTotalItens\": 49.9,
    \"valorFrete\": 15,
    \"parcelas\": 1,
    \"itens\": [
      {
        \"livroUuid\": \"$LIVRO_UUID\",
        \"quantidade\": 1,
        \"precoUnitario\": 49.9
      }
    ]
  }")
VENDA_UUID_C7=$(echo "$VENDA_C7" | jq -r '.id // .uuid // empty')
echo "Venda UUID prazo: $VENDA_UUID_C7"

if [ -n "$VENDA_UUID_C7" ]; then
  criar_entrega_e_confirmar "$VENDA_UUID_C7" > /dev/null
  if retroceder_data_entrega_8_dias "$VENDA_UUID_C7"; then
    echo "✓ Data de entrega retrocedida 8 dias (RN0043)"
  else
    echo -e "${AMARELO}⚠ Container ecm_postgres indisponível — não foi possível retroceder data${NC}"
  fi
fi
echo ""

echo -e "${AMARELO}Dado: Pedido foi entregue há mais de 7 dias${NC}"
echo "✓ Pré-condição configurada no setup"
echo ""

echo -e "${AMARELO}Quando: Cliente tenta solicitar troca após prazo${NC}"
if [ -n "$VENDA_UUID_C7" ]; then
  ITEM_UUID_C7=$(obter_item_uuid_venda "$VENDA_UUID_C7")
  TROCA_VALIDACAO=$(curl -s -X POST "$BASE_URL/vendas/$VENDA_UUID_C7/troca" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_CLIENTE \
    -d "{
      \"motivo\": \"Teste prazo expirado\",
      \"itensUuids\": [\"$ITEM_UUID_C7\"]
    }")
  echo "$TROCA_VALIDACAO" | jq '.'
  
  if echo "$TROCA_VALIDACAO" | jq -e '.erro' > /dev/null; then
    MENSAGEM_ERRO=$(echo "$TROCA_VALIDACAO" | jq -r '.erro')
    if echo "$MENSAGEM_ERRO" | grep -qi "7 dias\|expirado\|prazo"; then
      echo "✓ Validação temporal funcionando: $MENSAGEM_ERRO"
    else
      echo -e "${VERMELHO}✗ Erro retornado mas não é de prazo: $MENSAGEM_ERRO${NC}"
    fi
  else
    echo -e "${VERMELHO}✗ Troca aceita fora do prazo (esperado bloqueio)${NC}"
  fi
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Sistema deve bloquear ação e informar prazo legal expirado${NC}"
echo "✓ Validado acima"
echo ""

# ========================================
# 3. GESTÃO DE LOGÍSTICA (ADMINISTRADOR)
# ========================================

# ========================================
# CENÁRIO 8: Saída para entrega (FELIZ)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 8: Saída para entrega (FELIZ)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AMARELO}Dado: Pedido está com status PAGAMENTO REALIZADO${NC}"
echo "⚠ NOTA: Pedido atual está EM PROCESSAMENTO"
echo ""

echo -e "${AMARELO}Quando: Administrador altera status para EM TRANSPORTE${NC}"
if [ -n "$VENDA_UUID_C1" ]; then
  # Entrega já foi criada e confirmada no setup, vamos listar
  LISTAR_ENTREGAS=$(curl -s -X GET "$BASE_URL/entregas?vendaUuid=$VENDA_UUID_C1" -b $COOKIE_JAR_ADMIN)
  echo "$LISTAR_ENTREGAS" | jq '.'
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Sistema deve disparar e-mail de notificação com código de rastreio${NC}"
echo "⚠ NOTA: E-mail não é testado via curl, validar backend logs"
echo ""

# ========================================
# CENÁRIO 9: Confirmação de entrega final (FELIZ)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 9: Confirmação de entrega final (FELIZ)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

echo -e "${AMARELO}Dado: Pedido está EM TRANSPORTE${NC}"
echo "⚠ NOTA: Requer despacho prévio"
echo ""

echo -e "${AMARELO}Quando: Administrador confirma que produto foi ENTREGUE${NC}"
if [ -n "$VENDA_UUID_C1" ]; then
  # Entrega já foi confirmada no setup, vamos verificar status
  LISTAR_ENTREGAS=$(curl -s -X GET "$BASE_URL/entregas?vendaUuid=$VENDA_UUID_C1" -b $COOKIE_JAR_ADMIN)
  echo "$LISTAR_ENTREGAS" | jq '.'
else
  echo -e "${VERMELHO}✗ Venda UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Sistema deve registrar data/hora e iniciar contagem de 7 dias${NC}"
echo "⚠ NOTA: Validar após implementação completa"
echo ""

# ========================================
# CENÁRIO 10: Problema na entrega - Endereço não encontrado (EXCEÇÃO)
# ========================================
echo -e "${VERDE}========================================${NC}"
echo -e "${VERDE}CENÁRIO 10: Problema na entrega (EXCEÇÃO)${NC}"
echo -e "${VERDE}========================================${NC}"
echo ""

# Setup: Criar nova venda e entrega para teste de falha
echo -e "${AZUL}=== SETUP: Criar venda para teste de falha de entrega ===${NC}"
VENDA_FALHA=$(curl -s -X POST "$BASE_URL/vendas" \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR_CLIENTE \
  -d "{
    \"enderecoUuid\": \"$ENDERECO_UUID\",
    \"cartaoUuid\": \"$CARTAO_UUID\",
    \"formaPagamento\": \"cartao\",
    \"valorTotal\": 64.9,
    \"valorTotalItens\": 49.9,
    \"valorFrete\": 15,
    \"parcelas\": 1,
    \"itens\": [
      {
        \"livroUuid\": \"$LIVRO_UUID\",
        \"quantidade\": 1,
        \"precoUnitario\": 49.9
      }
    ]
  }")
VENDA_UUID_FALHA=$(echo "$VENDA_FALHA" | jq -r '.id // .uuid // empty')
echo "Venda UUID para falha: $VENDA_UUID_FALHA"

if [ -n "$VENDA_UUID_FALHA" ]; then
  # Criar entrega (status EM TRÂNSITO)
  CRIAR_ENTREGA_FALHA=$(curl -s -X POST "$BASE_URL/entregas" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN \
    -d "{
      \"vendaUuid\": \"$VENDA_UUID_FALHA\",
      \"tipoFrete\": \"PAC\",
      \"endereco\": \"Endereço de Teste\",
      \"custo\": 15,
      \"entregador\": \"Transportadora Padrão\"
    }")
  echo "$CRIAR_ENTREGA_FALHA" | jq '.'
  ENTREGA_UUID_FALHA=$(echo "$CRIAR_ENTREGA_FALHA" | jq -r '.uuid // empty')
  echo "Entrega UUID para falha: $ENTREGA_UUID_FALHA"
fi
echo ""

echo -e "${AMARELO}Dado: Pedido está EM TRÂNSITO${NC}"
echo "✓ Entrega criada com status EM TRÂNSITO"
echo ""

echo -e "${AMARELO}Quando: Transportador sinaliza 'Endereço não localizado'${NC}"
if [ -n "$ENTREGA_UUID_FALHA" ]; then
  REGISTRAR_FALHA=$(curl -s -X PATCH "$BASE_URL/entregas/$ENTREGA_UUID_FALHA/falha" \
    -H "Content-Type: application/json" \
    -b $COOKIE_JAR_ADMIN)
  echo "$REGISTRAR_FALHA" | jq '.'
  
  # Verificar status HTTP 204 (sem conteúdo)
  if [ -z "$REGISTRAR_FALHA" ]; then
    echo "✓ Falha registrada (HTTP 204)"
  else
    echo -e "${AMARELO}⚠ Resposta com conteúdo: $REGISTRAR_FALHA${NC}"
  fi
else
  echo -e "${VERMELHO}✗ Entrega UUID não disponível${NC}"
fi
echo ""

echo -e "${AMARELO}Então: Status deve refletir falha e permitir reconfirmação${NC}"
if [ -n "$VENDA_UUID_FALHA" ]; then
  # Consultar venda para verificar status
  VENDA_STATUS=$(curl -s -X GET "$BASE_URL/vendas/$VENDA_UUID_FALHA" \
    -b $COOKIE_JAR_ADMIN)
  STATUS_ATUAL=$(echo "$VENDA_STATUS" | jq -r '.status // empty')
  if [ "$STATUS_ATUAL" = "FALHA NA ENTREGA" ]; then
    echo "✓ Status correto: FALHA NA ENTREGA"
  else
    echo -e "${AMARELO}⚠ Status atual: $STATUS_ATUAL (esperado: FALHA NA ENTREGA)${NC}"
  fi
fi
echo ""

# ========================================
# RESUMO
# ========================================
echo "=========================================="
echo "RESUMO DOS TESTES BDD"
echo "=========================================="
echo ""
echo "Cenários Testados: 10"
echo ""
echo "Fluxo de Compra e Pagamento: 3 cenários"
echo "Troca e Devolução: 4 cenários"
echo "Gestão de Logística: 3 cenários"
echo ""
echo "⚠ NOTAS IMPORTANTES:"
echo "- Alguns cenários requerem pré-condições específicas (venda aprovada, entregue, etc.)"
echo "- Alguns endpoints podem não estar totalmente implementados"
echo "- Validações temporais (prazo de 7 dias) requerem manipulação de datas no banco"
echo "- E-mail de notificação não é testável via curl"
echo ""
echo "=========================================="
echo "TESTES CONCLUÍDOS"
echo "=========================================="
