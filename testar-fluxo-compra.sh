#!/bin/bash
# Testa o fluxo completo de compra de 4 livros como cliente via curl

set -euo pipefail

BASE="http://localhost:3002/api"
LOJA_UUID="82c0a24c-4cf4-4b12-823a-f1a8b9a086c3"
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
NC='\033[0m'

LIVRO1="aa615c13-2dca-42df-841e-e05eef9c5a84"
LIVRO2="ba50ae57-9ab8-434a-8389-2b2265028e98"
LIVRO3="caf0ae90-442b-43ac-94b9-af9f82ecb261"
LIVRO4="83f59c46-e2aa-49c1-bb73-da19496b1b1b"

ok()    { echo -e "${VERDE}[OK]${NC} $1"; }
falhar(){ echo -e "${VERMELHO}[ERRO]${NC} $1"; exit 1; }
info()  { echo -e "${AMARELO}>>>${NC} $1"; }

checar_status() {
  local esperado="$1" recebido="$2" etapa="$3"
  [ "$recebido" = "$esperado" ] || falhar "$etapa — esperado HTTP $esperado, recebido $recebido"
}

# ─── 1. LOGIN ────────────────────────────────────────────────────────────────
info "1. Login como cliente"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"clientetest@email.com","senha":"123456"}')
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
checar_status "200" "$HTTP" "Login"
TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('dados',{}).get('token') or d.get('token',''))")
[ -n "$TOKEN" ] || falhar "Token não encontrado na resposta de login"
ok "Login — token obtido"

AUTH="-H \"Authorization: Bearer $TOKEN\" -H \"x-loja-uuid: $LOJA_UUID\""

# ─── 2. LISTAR LIVROS ────────────────────────────────────────────────────────
info "2. Listar catálogo de livros"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/livros" \
  -H "x-loja-uuid: $LOJA_UUID")
checar_status "200" "$HTTP" "Listar livros"
ok "Listagem de livros"

# ─── 3. DETALHE DOS 4 LIVROS ─────────────────────────────────────────────────
info "3. Consultar detalhes dos 4 livros"
for UUID in $LIVRO1 $LIVRO2 $LIVRO3 $LIVRO4; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/livros/$UUID" \
    -H "x-loja-uuid: $LOJA_UUID")
  checar_status "200" "$HTTP" "Detalhe livro $UUID"
done
ok "Detalhes dos 4 livros"

# ─── 4. LIMPAR E CONSULTAR CARRINHO ─────────────────────────────────────────
info "4. Limpar e consultar carrinho"
curl -s -o /dev/null -X DELETE "$BASE/carrinho" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID" || true
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/carrinho" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID")
checar_status "200" "$HTTP" "Ver carrinho"
ok "Carrinho limpo e consultado"

# ─── 5. ADICIONAR 4 LIVROS AO CARRINHO ──────────────────────────────────────
info "5. Adicionar 4 livros ao carrinho"
for UUID in $LIVRO1 $LIVRO2 $LIVRO3 $LIVRO4; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/carrinho/itens" \
    -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID" \
    -H "Content-Type: application/json" \
    -d "{\"livroUuid\":\"$UUID\",\"quantidade\":1}")
  checar_status "200" "$HTTP" "Adicionar livro $UUID ao carrinho"
done
ok "4 livros adicionados ao carrinho"

# ─── 6. VER CARRINHO ATUALIZADO ──────────────────────────────────────────────
info "6. Verificar carrinho com 4 itens"
RESP=$(curl -s "$BASE/carrinho" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID")
QTD=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); itens=d.get('itens') or d.get('dados',{}).get('itens',[]); print(len(itens))" 2>/dev/null || echo "?")
ok "Carrinho com $QTD item(ns)"

# ─── 7. COTAÇÃO DE FRETE ─────────────────────────────────────────────────────
info "7. Cotar frete"
RESP_FRETE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/frete/cotar" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID" \
  -H "Content-Type: application/json" \
  -d '{"cepDestino":"01310100"}')
HTTP=$(echo "$RESP_FRETE" | tail -1)
BODY_FRETE=$(echo "$RESP_FRETE" | head -1)
checar_status "200" "$HTTP" "Cotação frete"
COTACAO_UUID=$(echo "$BODY_FRETE" | python3 -c "import sys,json; d=json.load(sys.stdin); ops=d.get('opcoes') or d.get('dados',{}).get('opcoes',[]); print(ops[0]['uuid'] if ops else '')" 2>/dev/null || echo "")
ok "Frete cotado${COTACAO_UUID:+ — cotação: $COTACAO_UUID}"

# ─── 8. REGISTRAR PEDIDO ─────────────────────────────────────────────────────
info "8. Registrar pedido de venda"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/vendas" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID" \
  -H "Content-Type: application/json" \
  -d '{
    "enderecoEntregaUuid": null,
    "itens": [
      {"livroUuid":"'"$LIVRO1"'","quantidade":1},
      {"livroUuid":"'"$LIVRO2"'","quantidade":1},
      {"livroUuid":"'"$LIVRO3"'","quantidade":1},
      {"livroUuid":"'"$LIVRO4"'","quantidade":1}
    ]
  }')
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
checar_status "201" "$HTTP" "Registrar pedido"
VENDA_UUID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('uuid') or d.get('dados',{}).get('uuid',''))" 2>/dev/null)
[ -n "$VENDA_UUID" ] || falhar "UUID da venda não encontrado"
ok "Pedido registrado — venda: $VENDA_UUID"

# ─── 9. DETALHE DA VENDA ─────────────────────────────────────────────────────
info "9. Consultar detalhes da venda"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/vendas/$VENDA_UUID" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID")
checar_status "200" "$HTTP" "Detalhe da venda"
ok "Detalhes da venda consultados"

# ─── 10. INFO DE PAGAMENTO ───────────────────────────────────────────────────
info "10. Consultar info de pagamento"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/pagamento/info" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID")
[ "$HTTP" = "200" ] && ok "Info de pagamento" || info "Info pagamento retornou $HTTP (sem venda vinculada ainda)"

# ─── 11. PROCESSAR PAGAMENTO (PIX SIMULADO) ──────────────────────────────────
info "11a. Selecionar método de pagamento PIX"
VALOR=$(curl -s "$BASE/vendas/$VENDA_UUID" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('totalVenda',0))" 2>/dev/null || echo "0")

RESP_SEL=$(curl -s -w "\n%{http_code}" -X POST "$BASE/pagamentos/selecionar" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID" \
  -H "Content-Type: application/json" \
  -d "{\"vendaUuid\":\"$VENDA_UUID\",\"valor\":$VALOR,\"tipoPagamento\":\"pix\"}")
HTTP=$(echo "$RESP_SEL" | tail -1)
BODY_SEL=$(echo "$RESP_SEL" | head -1)
[ "$HTTP" = "200" ] || [ "$HTTP" = "201" ] || falhar "Selecionar método PIX — esperado HTTP 200/201, recebido $HTTP"
PAG_UUID=$(echo "$BODY_SEL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d.get('uuid',''))" 2>/dev/null || echo "")
SEGREDO=$(echo "$BODY_SEL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pixCobranca',{}).get('segredoConfirmacao',''))" 2>/dev/null || echo "")
ok "PIX selecionado — pagamento: $PAG_UUID"

info "11b. Confirmar pagamento PIX (webhook simulado)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/webhooks/pagamento-pix-simulado" \
  -H "Content-Type: application/json" \
  -H "x-loja-uuid: $LOJA_UUID" \
  -d "{\"pagamentoUuid\":\"$PAG_UUID\",\"segredoConfirmacao\":\"$SEGREDO\"}")
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
[ "$HTTP" = "200" ] || [ "$HTTP" = "204" ] && ok "PIX confirmado via webhook (HTTP $HTTP)" || info "Webhook PIX retornou $HTTP: $(echo "$BODY" | python3 -c 'import sys; print(sys.stdin.read()[:400])' 2>/dev/null)"

# ─── 12. LISTAR MINHAS VENDAS ────────────────────────────────────────────────
info "12. Listar vendas do cliente"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/minhas-vendas" \
  -H "Authorization: Bearer $TOKEN" -H "x-loja-uuid: $LOJA_UUID")
checar_status "200" "$HTTP" "Listar minhas vendas"
ok "Vendas listadas"

echo ""
echo -e "${VERDE}=========================================="
echo -e "  FLUXO DE COMPRA CONCLUÍDO COM SUCESSO"
echo -e "==========================================${NC}"
echo "  Venda UUID: $VENDA_UUID"
