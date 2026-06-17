#!/bin/bash
# Testa fluxo completo de troca e devolução via curl

set -euo pipefail

BASE="http://localhost:3002/api"
LOJA_UUID="82c0a24c-4cf4-4b12-823a-f1a8b9a086c3"
VERDE='\033[0;32m'; VERMELHO='\033[0;31m'; AMARELO='\033[1;33m'; NC='\033[0m'

ok()    { echo -e "${VERDE}[OK]${NC} $1"; }
info()  { echo -e "${AMARELO}>>>${NC} $1"; }
falhar(){ echo -e "${VERMELHO}[ERRO]${NC} $1"; exit 1; }

checar() {
  local esperado="$1" recebido="$2" etapa="$3"
  [ "$recebido" = "$esperado" ] || falhar "$etapa — esperado HTTP $esperado, recebido $recebido"
}

# ── Auth ──────────────────────────────────────────────────────────────────────
login() {
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"senha\":\"$2\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['dados']['token'])"
}

TOKEN_CLIENTE=$(login "clientetest@email.com" "123456")
TOKEN_ADMIN=$(login "admintest@email.com" "123456")
ok "Login cliente e admin"

C="-H \"Authorization: Bearer $TOKEN_CLIENTE\" -H \"x-loja-uuid: $LOJA_UUID\""
A="-H \"Authorization: Bearer $TOKEN_ADMIN\" -H \"x-loja-uuid: $LOJA_UUID\""

cli()   { curl -s "$@" -H "Authorization: Bearer $TOKEN_CLIENTE" -H "x-loja-uuid: $LOJA_UUID"; }
clih()  { curl -s -w "\n%{http_code}" "$@" -H "Authorization: Bearer $TOKEN_CLIENTE" -H "x-loja-uuid: $LOJA_UUID"; }
adm()   { curl -s "$@" -H "Authorization: Bearer $TOKEN_ADMIN" -H "x-loja-uuid: $LOJA_UUID"; }
admh()  { curl -s -w "\n%{http_code}" "$@" -H "Authorization: Bearer $TOKEN_ADMIN" -H "x-loja-uuid: $LOJA_UUID"; }

extrair_uuid() { python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('uuid') or d.get('ven_uuid','')); " 2>/dev/null; }
http()  { echo "$1" | tail -1; }
body()  { echo "$1" | head -1; }

# ── Preparar: criar venda e marcar como ENTREGUE ──────────────────────────────
preparar_venda_entregue() {
  # Limpar carrinho e criar nova venda
  cli -X DELETE "$BASE/carrinho" >/dev/null 2>&1 || true
  cli -s -X POST "$BASE/carrinho/itens" -H "Content-Type: application/json" \
    -d '{"livroUuid":"aa615c13-2dca-42df-841e-e05eef9c5a84","quantidade":1}' >/dev/null

  local resp=$(clih -X POST "$BASE/vendas" -H "Content-Type: application/json" \
    -d '{"itens":[{"livroUuid":"aa615c13-2dca-42df-841e-e05eef9c5a84","quantidade":1}]}')
  checar "201" "$(http "$resp")" "Criar venda"
  local venda_uuid=$(body "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['uuid'])")

  # Pagar via PIX simulado
  local valor=$(body "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['totalVenda'])")
  local pix=$(cli -X POST "$BASE/pagamentos/selecionar" -H "Content-Type: application/json" \
    -d "{\"vendaUuid\":\"$venda_uuid\",\"valor\":$valor,\"tipoPagamento\":\"pix\"}")
  local pag_id=$(echo "$pix" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
  local segredo=$(echo "$pix" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['pixCobranca']['segredoConfirmacao'])")
  curl -s -X POST "$BASE/webhooks/pagamento-pix-simulado" \
    -H "Content-Type: application/json" -H "x-loja-uuid: $LOJA_UUID" \
    -d "{\"pagamentoUuid\":\"$pag_id\",\"segredoConfirmacao\":\"$segredo\"}" >/dev/null

  # Confirmar entrega (cliente)
  local r=$(clih -X PATCH "$BASE/vendas/$venda_uuid/confirmar-entrega")
  checar "200" "$(http "$r")" "Confirmar entrega"

  echo "$venda_uuid"
}

# ── Buscar item de venda ───────────────────────────────────────────────────────
obter_item_uuid() {
  local venda_uuid="$1"
  cli "$BASE/vendas/$venda_uuid" | python3 -c "
import sys,json; d=json.load(sys.stdin)
itens=d.get('itens',[])
print(itens[0]['uuid'] if itens else '')
" 2>/dev/null
}

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${AMARELO}══════════════════════════════════════${NC}"
echo -e "${AMARELO}  FLUXO 1: TROCA${NC}"
echo -e "${AMARELO}══════════════════════════════════════${NC}"

info "Preparando venda entregue para troca..."
VENDA_TROCA=$(preparar_venda_entregue)
ITEM_TROCA=$(obter_item_uuid "$VENDA_TROCA")
ok "Venda pronta: $VENDA_TROCA | Item: $ITEM_TROCA"

# 1. Cliente solicita troca
info "1. Cliente solicita troca"
RESP=$(clih -X POST "$BASE/vendas/$VENDA_TROCA/troca" -H "Content-Type: application/json" \
  -d "{\"motivo\":\"Produto com defeito\",\"itensUuids\":[\"$ITEM_TROCA\"]}")
checar "200" "$(http "$RESP")" "Solicitar troca"
ok "Troca solicitada"

# 2. Admin lista trocas pendentes
info "2. Admin lista trocas pendentes"
RESP=$(admh "$BASE/admin/pedidos/trocas")
checar "200" "$(http "$RESP")" "Listar trocas pendentes"
ok "Trocas listadas"

# 3. Admin autoriza troca
info "3. Admin autoriza troca"
RESP=$(admh -X PATCH "$BASE/admin/pedidos/$VENDA_TROCA/autorizar-troca" \
  -H "Content-Type: application/json" -d '{}')
checar "200" "$(http "$RESP")" "Autorizar troca"
ok "Troca autorizada"

# 4. Admin confirma recebimento do produto trocado
info "4. Admin confirma recebimento do produto"
RESP=$(admh -X PATCH "$BASE/admin/pedidos/$VENDA_TROCA/confirmar-recebimento" \
  -H "Content-Type: application/json" -d '{"retornarEstoque":true}')
checar "200" "$(http "$RESP")" "Confirmar recebimento troca"
ok "Recebimento confirmado — troca concluída"

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${AMARELO}══════════════════════════════════════${NC}"
echo -e "${AMARELO}  FLUXO 2: TROCA REJEITADA${NC}"
echo -e "${AMARELO}══════════════════════════════════════${NC}"

info "Preparando venda entregue para troca rejeitada..."
VENDA_TROCA_REJ=$(preparar_venda_entregue)
ITEM_TROCA_REJ=$(obter_item_uuid "$VENDA_TROCA_REJ")
ok "Venda pronta: $VENDA_TROCA_REJ"

info "1. Cliente solicita troca"
RESP=$(clih -X POST "$BASE/vendas/$VENDA_TROCA_REJ/troca" -H "Content-Type: application/json" \
  -d "{\"motivo\":\"Não gostei\",\"itensUuids\":[\"$ITEM_TROCA_REJ\"]}")
checar "200" "$(http "$RESP")" "Solicitar troca"
ok "Troca solicitada"

info "2. Admin rejeita troca"
RESP=$(admh -X PATCH "$BASE/admin/pedidos/$VENDA_TROCA_REJ/rejeitar-troca" \
  -H "Content-Type: application/json" -d '{"motivo":"Fora do prazo de 7 dias"}')
checar "200" "$(http "$RESP")" "Rejeitar troca"
ok "Troca rejeitada"

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${AMARELO}══════════════════════════════════════${NC}"
echo -e "${AMARELO}  FLUXO 3: DEVOLUÇÃO${NC}"
echo -e "${AMARELO}══════════════════════════════════════${NC}"

info "Preparando venda entregue para devolução..."
VENDA_DEV=$(preparar_venda_entregue)
ITEM_DEV=$(obter_item_uuid "$VENDA_DEV")
ok "Venda pronta: $VENDA_DEV | Item: $ITEM_DEV"

# 1. Cliente solicita devolução
info "1. Cliente solicita devolução"
RESP=$(clih -X POST "$BASE/vendas/$VENDA_DEV/devolucao" -H "Content-Type: application/json" \
  -d "{\"motivo\":\"Produto errado\",\"itensUuids\":[\"$ITEM_DEV\"]}")
checar "200" "$(http "$RESP")" "Solicitar devolução"
ok "Devolução solicitada"

# 2. Admin lista devoluções pendentes
info "2. Admin lista devoluções pendentes"
RESP=$(admh "$BASE/admin/pedidos/devolucoes")
checar "200" "$(http "$RESP")" "Listar devoluções"
ok "Devoluções listadas"

# 3. Admin autoriza devolução
info "3. Admin autoriza devolução"
RESP=$(admh -X PATCH "$BASE/admin/pedidos/$VENDA_DEV/autorizar-devolucao" \
  -H "Content-Type: application/json" -d '{}')
checar "200" "$(http "$RESP")" "Autorizar devolução"
ok "Devolução autorizada"

# 4. Admin confirma recebimento da devolução
info "4. Admin confirma recebimento da devolução"
RESP=$(admh -X PATCH "$BASE/admin/pedidos/$VENDA_DEV/confirmar-recebimento-devolucao" \
  -H "Content-Type: application/json" -d '{"retornarEstoque":true}')
checar "200" "$(http "$RESP")" "Confirmar recebimento devolução"
ok "Recebimento confirmado — devolução concluída"

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${AMARELO}══════════════════════════════════════${NC}"
echo -e "${AMARELO}  FLUXO 4: DEVOLUÇÃO REJEITADA${NC}"
echo -e "${AMARELO}══════════════════════════════════════${NC}"

info "Preparando venda entregue para devolução rejeitada..."
VENDA_DEV_REJ=$(preparar_venda_entregue)
ITEM_DEV_REJ=$(obter_item_uuid "$VENDA_DEV_REJ")

info "1. Cliente solicita devolução"
RESP=$(clih -X POST "$BASE/vendas/$VENDA_DEV_REJ/devolucao" -H "Content-Type: application/json" \
  -d "{\"motivo\":\"Arrependimento\",\"itensUuids\":[\"$ITEM_DEV_REJ\"]}")
checar "200" "$(http "$RESP")" "Solicitar devolução"
ok "Devolução solicitada"

info "2. Admin rejeita devolução"
RESP=$(admh -X PATCH "$BASE/admin/pedidos/$VENDA_DEV_REJ/rejeitar-devolucao" \
  -H "Content-Type: application/json" -d '{"motivo":"Produto sem defeito comprovado"}')
checar "200" "$(http "$RESP")" "Rejeitar devolução"
ok "Devolução rejeitada"

echo ""
echo -e "${VERDE}══════════════════════════════════════${NC}"
echo -e "${VERDE}  TODOS OS FLUXOS CONCLUÍDOS${NC}"
echo -e "${VERDE}══════════════════════════════════════${NC}"
echo "  Troca autorizada:    $VENDA_TROCA"
echo "  Troca rejeitada:     $VENDA_TROCA_REJ"
echo "  Devolução autorizada:$VENDA_DEV"
echo "  Devolução rejeitada: $VENDA_DEV_REJ"
