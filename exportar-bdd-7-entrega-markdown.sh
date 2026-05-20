#!/bin/bash
# Gera markdown com fluxos, rotas, payloads enviados e respostas JSON do teste BDD 7ª entrega

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3002/api}"
LOJA_ID="${LOJA_ID:-1}"
OUTPUT="${1:-backend/docs/EXPORT-BDD-7-ENTREGA-API.md}"
COOKIE_JAR_CLIENTE="/tmp/cliente_cookies_bdd_export.txt"
COOKIE_JAR_ADMIN="/tmp/admin_cookies_bdd_export.txt"
LAST_RESP=""

mkdir -p "$(dirname "$OUTPUT")"
rm -f "$COOKIE_JAR_CLIENTE" "$COOKIE_JAR_ADMIN"

MD="$OUTPUT"
exec 3>"$MD"

log_md() { echo -e "$1" >&3; }

json_block() {
  local titulo="$1"
  local json="$2"
  log_md ""
  log_md "**$titulo**"
  log_md '```json'
  if ! echo "$json" | jq '.' >&3 2>/dev/null; then
    echo "$json" >&3
  fi
  log_md '```'
}

req_res() {
  local metodo="$1"
  local rota="$2"
  local headers_extra="${3:-}"
  local body="${4:-}"
  local resp http_code body_out curl_hdr=(-s -w "\n__HTTP_CODE__%{http_code}")

  case "$metodo" in
    GET)
      if [ -n "$headers_extra" ]; then
        resp=$(curl "${curl_hdr[@]}" -X GET "$BASE_URL$rota" \
          -H "Content-Type: application/json" \
          -H "$headers_extra" -b "$COOKIE_JAR_CLIENTE")
      else
        resp=$(curl "${curl_hdr[@]}" -X GET "$BASE_URL$rota" \
          -H "Content-Type: application/json" -b "$COOKIE_JAR_CLIENTE")
      fi
      ;;
    GET_ADMIN)
      if [ -n "$headers_extra" ]; then
        resp=$(curl "${curl_hdr[@]}" -X GET "$BASE_URL$rota" \
          -H "Content-Type: application/json" \
          -H "$headers_extra" -b "$COOKIE_JAR_ADMIN")
      else
        resp=$(curl "${curl_hdr[@]}" -X GET "$BASE_URL$rota" \
          -H "Content-Type: application/json" -b "$COOKIE_JAR_ADMIN")
      fi
      metodo="GET"
      ;;
    POST_LOGIN_CLIENTE)
      resp=$(curl "${curl_hdr[@]}" -X POST "$BASE_URL$rota" \
        -H "Content-Type: application/json" -c "$COOKIE_JAR_CLIENTE" -d "$body")
      metodo="POST"
      ;;
    POST_LOGIN_ADMIN)
      resp=$(curl "${curl_hdr[@]}" -X POST "$BASE_URL$rota" \
        -H "Content-Type: application/json" -c "$COOKIE_JAR_ADMIN" -d "$body")
      metodo="POST"
      ;;
    POST_ADMIN)
      resp=$(curl "${curl_hdr[@]}" -X POST "$BASE_URL$rota" \
        -H "Content-Type: application/json" $headers_extra \
        -b "$COOKIE_JAR_ADMIN" -d "$body")
      metodo="POST"
      ;;
    PATCH_ADMIN)
      resp=$(curl "${curl_hdr[@]}" -X PATCH "$BASE_URL$rota" \
        -H "Content-Type: application/json" $headers_extra \
        -b "$COOKIE_JAR_ADMIN" -d "$body")
      metodo="PATCH"
      ;;
    PATCH_ADMIN_EMPTY)
      resp=$(curl "${curl_hdr[@]}" -X PATCH "$BASE_URL$rota" \
        -H "Content-Type: application/json" $headers_extra \
        -b "$COOKIE_JAR_ADMIN")
      metodo="PATCH"
      body=""
      ;;
    *)
      resp=$(curl "${curl_hdr[@]}" -X "$metodo" "$BASE_URL$rota" \
        -H "Content-Type: application/json" $headers_extra \
        -b "$COOKIE_JAR_CLIENTE" -d "$body")
      ;;
  esac

  http_code=$(echo "$resp" | tail -1 | sed 's/.*__HTTP_CODE__//')
  body_out=$(echo "$resp" | sed '/__HTTP_CODE__/d')

  log_md ""
  log_md "### \`$metodo $BASE_URL$rota\`"
  log_md ""
  log_md "| Campo | Valor |"
  log_md "|-------|-------|"
  log_md "| Método HTTP | \`$metodo\` |"
  log_md "| URL completa | \`$BASE_URL$rota\` |"
  log_md "| Status HTTP | \`$http_code\` |"
  log_md "| Autenticação | Cookie de sessão |"
  [ -n "$headers_extra" ] && log_md "| Headers extras | \`$headers_extra\` |"

  if [ -n "$body" ] && [ "$body" != "{}" ]; then
    json_block "Corpo enviado (request)" "$body"
  else
    log_md ""
    log_md "_Sem corpo na requisição._"
  fi

  if [ -z "$body_out" ]; then
    log_md ""
    log_md "**Resposta (response):** corpo vazio (típico de HTTP 204)."
  else
    json_block "Resposta (response)" "$body_out"
  fi

  LAST_RESP="$body_out"
}

criar_entrega_e_confirmar_export() {
  local venda_uuid="$1"
  local body_entrega
  body_entrega=$(jq -n --arg v "$venda_uuid" \
    '{vendaUuid:$v,tipoFrete:"PAC",endereco:"Endereço de Teste",custo:15,entregador:"Transportadora Padrão"}')
  req_res "POST_ADMIN" "/entregas" "" "$body_entrega"
  local entrega_uuid
  entrega_uuid=$(echo "$LAST_RESP" | jq -r '.uuid // empty')
  if [ -n "$entrega_uuid" ]; then
    req_res "PATCH_ADMIN_EMPTY" "/entregas/$entrega_uuid/confirmar" "" ""
  fi
  echo "$entrega_uuid"
}

log_md "# Exportação BDD — 7ª Entrega (Venda Completa)"
log_md ""
log_md "Documento gerado por \`exportar-bdd-7-entrega-markdown.sh\` a partir de \`testar-cenarios-bdd-7-entrega.sh\`."
log_md ""
log_md "| Item | Valor |"
log_md "|------|-------|"
log_md "| Base URL | \`$BASE_URL\` |"
log_md "| Header loja | \`x-loja-id: $LOJA_ID\` |"
log_md "| Cliente | \`clientetest@email.com\` |"
log_md "| Admin | \`admintest@email.com\` |"
log_md "| Gerado em | $(date -Iseconds) |"
log_md ""
log_md "## Índice de rotas"
log_md ""
log_md "| # | Método | Rota | Uso nos cenários |"
log_md "|---|--------|------|------------------|"
log_md "| 1 | POST | \`/auth/login\` | Setup (cliente e admin) |"
log_md "| 2 | GET | \`/livros\` | Setup catálogo |"
log_md "| 3 | POST | \`/carrinho/itens\` | Setup carrinho |"
log_md "| 4 | GET | \`/clientes/perfil\` | Setup endereço/cartão |"
log_md "| 5 | POST | \`/vendas\` | 1, 3, troca, 6, 7, 10 |"
log_md "| 6 | POST | \`/entregas\` | 1, troca, 10 |"
log_md "| 7 | PATCH | \`/entregas/:entregaUuid/confirmar\` | 1, troca, 7 |"
log_md "| 8 | POST | \`/pagamento/processar\` | 2 (erro), 3 (100% cupom) |"
log_md "| 9 | GET | \`/cupom/disponiveis\` | 3 |"
log_md "| 10 | GET | \`/vendas/:uuid\` | Detalhe / itens para troca |"
log_md "| 11 | POST | \`/vendas/:uuid/troca\` | 4, 6, 7 |"
log_md "| 12 | PATCH | \`/admin/pedidos/:uuid/autorizar-troca\` | 5 |"
log_md "| 13 | PATCH | \`/admin/pedidos/:uuid/confirmar-recebimento\` | 5 |"
log_md "| 14 | PATCH | \`/admin/pedidos/:uuid/rejeitar-troca\` | 6 |"
log_md "| 15 | GET | \`/entregas?vendaUuid=:uuid\` | 8, 9 |"
log_md "| 16 | PATCH | \`/entregas/:entregaUuid/falha\` | 10 |"
log_md ""
log_md "## Variações de rotas"
log_md ""
log_md "| Padrão | Descrição |"
log_md "|--------|-----------|"
log_md "| \`/vendas/{uuid}\` | UUID da venda no path |"
log_md "| \`/vendas/{uuid}/troca\` | Cliente solicita troca (body: \`motivo\`, \`itensUuids[]\`) |"
log_md "| \`/admin/pedidos/{uuid}/autorizar-troca\` | Admin — sem body obrigatório |"
log_md "| \`/admin/pedidos/{uuid}/confirmar-recebimento\` | Admin — body: \`retornarEstoque: boolean\` |"
log_md "| \`/admin/pedidos/{uuid}/rejeitar-troca\` | Admin — body: \`motivo: string\` |"
log_md "| \`/entregas/{entregaUuid}/confirmar\` | Venda → \`ENTREGUE\` + \`ven_data_hora_entrega\` |"
log_md "| \`/entregas/{entregaUuid}/falha\` | Venda → \`FALHA NA ENTREGA\` (HTTP 204) |"
log_md "| \`/entregas?vendaUuid={uuid}\` | Query string — lista entregas da venda |"
log_md "| \`/pagamento/processar\` | Checkout: cartões, cupons ou \`CUPOM-ONLY\` (valorTotal 0) |"
log_md ""

# SETUP
log_md "---"
log_md "## Setup global"
log_md ""

req_res "POST_LOGIN_CLIENTE" "/auth/login" "" '{"email":"clientetest@email.com","senha":"@asdfJKLÇ123"}'
req_res "POST_LOGIN_ADMIN" "/auth/login" "" '{"email":"admintest@email.com","senha":"@asdfJKLÇ123"}'

req_res "GET" "/livros" "x-loja-id: $LOJA_ID" ""
LIVRO_UUID=$(echo "$LAST_RESP" | jq -r '.livros[0].uuid')

CARRINHO_BODY=$(jq -n --arg u "$LIVRO_UUID" '{livroUuid:$u,quantidade:2}')
req_res "POST" "/carrinho/itens" "" "$CARRINHO_BODY"

req_res "GET" "/clientes/perfil" "" ""
ENDERECO_UUID=$(echo "$LAST_RESP" | jq -r '.dados.enderecos[0].uuid')
CARTAO_UUID=$(echo "$LAST_RESP" | jq -r '.dados.cartoes[0].uuid')

# CENÁRIO 1
log_md "---"
log_md "## Cenário 1 — Compra com cartão (feliz)"
log_md ""
log_md "**Descrição:** Cliente registra pedido com cartão. Status inicial \`EM PROCESSAMENTO\`. Admin agenda entrega e confirma recebimento (\`ENTREGUE\`)."
log_md ""

VENDA_BODY_C1=$(jq -n --arg e "$ENDERECO_UUID" --arg c "$CARTAO_UUID" --arg l "$LIVRO_UUID" \
  '{enderecoUuid:$e,cartaoUuid:$c,formaPagamento:"cartao",valorTotal:114.8,valorTotalItens:99.8,valorFrete:15,parcelas:1,itens:[{livroUuid:$l,quantidade:2,precoUnitario:49.9}]}')
req_res "POST" "/vendas" "" "$VENDA_BODY_C1"
VENDA_UUID_C1=$(echo "$LAST_RESP" | jq -r '.id')

log_md "#### Subfluxo: entrega e confirmação"
criar_entrega_e_confirmar_export "$VENDA_UUID_C1" > /dev/null

# CENÁRIO 2
log_md "---"
log_md "## Cenário 2 — Falha no pagamento (payload inválido)"
log_md ""
log_md "**Descrição:** Checkout sem campos obrigatórios retorna \`400\` com mensagem de erro."
log_md ""
req_res "POST" "/pagamento/processar" "" '{}'

# CENÁRIO 3
log_md "---"
log_md "## Cenário 3 — Pagamento 100% cupom de troca"
log_md ""
log_md "**Descrição:** Venda coberta integralmente por cupom (\`CUPOM-ONLY\`, \`pagamentosCartao: []\`). Esperado: \`sucesso: true\` e venda \`APROVADA\`."
log_md ""

req_res "GET" "/cupom/disponiveis" "" ""
CUPOM_TROCA_UUID=$(echo "$LAST_RESP" | jq -r '.dados[] | select(.tipo=="troca") | .uuid' | head -1)
CUPOM_TROCA_CODIGO=$(echo "$LAST_RESP" | jq -r '.dados[] | select(.tipo=="troca") | .codigo' | head -1)
CUPOM_TROCA_VALOR=$(echo "$LAST_RESP" | jq -r '.dados[] | select(.tipo=="troca") | .valorDesconto' | head -1)

VENDA_BODY_C3=$(jq -n --arg e "$ENDERECO_UUID" --arg c "$CARTAO_UUID" --arg l "$LIVRO_UUID" --argjson v "$CUPOM_TROCA_VALOR" \
  '{enderecoUuid:$e,cartaoUuid:$c,formaPagamento:"cupom",valorTotal:$v,valorTotalItens:$v,valorFrete:0,parcelas:1,itens:[{livroUuid:$l,quantidade:1,precoUnitario:$v}]}')
req_res "POST" "/vendas" "" "$VENDA_BODY_C3"
VENDA_UUID_C3=$(echo "$LAST_RESP" | jq -r '.id')

PAG_BODY_C3=$(jq -n --arg v "$VENDA_UUID_C3" --arg u "$CUPOM_TROCA_UUID" --arg cod "$CUPOM_TROCA_CODIGO" --argjson val "$CUPOM_TROCA_VALOR" \
  '{vendaUuid:$v,valorTotal:0,idIntencao:"CUPOM-ONLY",segredoConfirmacao:"CUPOM-ONLY",pagamentosCartao:[],cuponsAplicados:[{uuid:$u,codigo:$cod,tipo:"troca",valor:$val}]}')
req_res "POST" "/pagamento/processar" "" "$PAG_BODY_C3"
req_res "GET" "/vendas/$VENDA_UUID_C3" "" ""

# SETUP TROCA
log_md "---"
log_md "## Setup — Pedido entregue (cenários 4 a 6)"
log_md ""

VENDA_BODY_TROCA=$(jq -n --arg e "$ENDERECO_UUID" --arg c "$CARTAO_UUID" --arg l "$LIVRO_UUID" \
  '{enderecoUuid:$e,cartaoUuid:$c,formaPagamento:"cartao",valorTotal:114.8,valorTotalItens:99.8,valorFrete:15,parcelas:1,itens:[{livroUuid:$l,quantidade:1,precoUnitario:49.9}]}')
req_res "POST" "/vendas" "" "$VENDA_BODY_TROCA"
VENDA_UUID_TROCA=$(echo "$LAST_RESP" | jq -r '.id')
criar_entrega_e_confirmar_export "$VENDA_UUID_TROCA" > /dev/null
req_res "GET" "/vendas/$VENDA_UUID_TROCA" "" ""
ITEM_UUID_TROCA=$(echo "$LAST_RESP" | jq -r '.itens[0].id')

# CENÁRIO 4
log_md "---"
log_md "## Cenário 4 — Solicitar troca (feliz)"
log_md ""
log_md "**Descrição:** Cliente solicita troca de item. Status → \`EM TROCA\`."
log_md ""
TROCA_BODY_C4=$(jq -n --arg m "Produto não atendeu expectativas" --arg i "$ITEM_UUID_TROCA" '{motivo:$m,itensUuids:[$i]}')
req_res "POST" "/vendas/$VENDA_UUID_TROCA/troca" "" "$TROCA_BODY_C4"

# CENÁRIO 5
log_md "---"
log_md "## Cenário 5 — Aprovar troca e gerar cupom (feliz)"
log_md ""
log_md "**Descrição:** Admin autoriza → \`TROCA AUTORIZADA\`. Confirma recebimento → \`CONCLUÍDA\` + objeto \`cupomGerado\`."
log_md ""
req_res "PATCH_ADMIN" "/admin/pedidos/$VENDA_UUID_TROCA/autorizar-troca" "" "{}"
req_res "PATCH_ADMIN" "/admin/pedidos/$VENDA_UUID_TROCA/confirmar-recebimento" "" '{"retornarEstoque":true}'

# CENÁRIO 6
log_md "---"
log_md "## Cenário 6 — Troca rejeitada (falha)"
log_md ""

VENDA_BODY_REJ=$(jq -n --arg e "$ENDERECO_UUID" --arg c "$CARTAO_UUID" --arg l "$LIVRO_UUID" \
  '{enderecoUuid:$e,cartaoUuid:$c,formaPagamento:"cartao",valorTotal:64.9,valorTotalItens:49.9,valorFrete:15,parcelas:1,itens:[{livroUuid:$l,quantidade:1,precoUnitario:49.9}]}')
req_res "POST" "/vendas" "" "$VENDA_BODY_REJ"
VENDA_UUID_REJ=$(echo "$LAST_RESP" | jq -r '.id')
criar_entrega_e_confirmar_export "$VENDA_UUID_REJ" > /dev/null
req_res "GET" "/vendas/$VENDA_UUID_REJ" "" ""
ITEM_REJ=$(echo "$LAST_RESP" | jq -r '.itens[0].id')
TROCA_REJ_BODY=$(jq -n --arg i "$ITEM_REJ" '{motivo:"Produto com defeito",itensUuids:[$i]}')
req_res "POST" "/vendas/$VENDA_UUID_REJ/troca" "" "$TROCA_REJ_BODY"
req_res "PATCH_ADMIN" "/admin/pedidos/$VENDA_UUID_REJ/rejeitar-troca" "" '{"motivo":"Produto danificado"}'

# CENÁRIO 7
log_md "---"
log_md "## Cenário 7 — Prazo de 7 dias expirado (exceção)"
log_md ""
log_md "**Descrição:** Após entrega, data retrocedida 8 dias no banco (RN0043). Nova solicitação de troca é bloqueada."
log_md ""
log_md "**Pré-condição (SQL, não é rota HTTP):**"
log_md '```sql'
log_md "UPDATE livraria_comercial.vendas"
log_md "SET ven_data_hora_entrega = NOW() - INTERVAL '8 days'"
log_md "WHERE ven_uuid = '<uuid-da-venda>';"
log_md '```'
log_md ""

VENDA_BODY_C7=$(jq -n --arg e "$ENDERECO_UUID" --arg c "$CARTAO_UUID" --arg l "$LIVRO_UUID" \
  '{enderecoUuid:$e,cartaoUuid:$c,formaPagamento:"cartao",valorTotal:64.9,valorTotalItens:49.9,valorFrete:15,parcelas:1,itens:[{livroUuid:$l,quantidade:1,precoUnitario:49.9}]}')
req_res "POST" "/vendas" "" "$VENDA_BODY_C7"
VENDA_UUID_C7=$(echo "$LAST_RESP" | jq -r '.id')
criar_entrega_e_confirmar_export "$VENDA_UUID_C7" > /dev/null
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'ecm_postgres'; then
  docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -q -c \
    "UPDATE livraria_comercial.vendas SET ven_data_hora_entrega = NOW() - INTERVAL '8 days' WHERE ven_uuid = '${VENDA_UUID_C7}';" > /dev/null || true
fi
req_res "GET" "/vendas/$VENDA_UUID_C7" "" ""
ITEM_C7=$(echo "$LAST_RESP" | jq -r '.itens[0].id')
TROCA_C7_BODY=$(jq -n --arg i "$ITEM_C7" '{motivo:"Teste prazo expirado",itensUuids:[$i]}')
req_res "POST" "/vendas/$VENDA_UUID_C7/troca" "" "$TROCA_C7_BODY"

# CENÁRIO 8 e 9
log_md "---"
log_md "## Cenário 8 — Saída para entrega (consulta)"
log_md ""
log_md "**Descrição:** Lista entregas vinculadas à venda (após \`POST /entregas\` a venda fica \`EM TRÂNSITO\`)."
log_md ""
req_res "GET_ADMIN" "/entregas?vendaUuid=$VENDA_UUID_C1" "" ""

log_md "---"
log_md "## Cenário 9 — Confirmação de entrega (consulta)"
log_md ""
log_md "**Descrição:** Mesma rota após confirmação — pedido já \`ENTREGUE\` no cenário 1."
log_md ""
req_res "GET_ADMIN" "/entregas?vendaUuid=$VENDA_UUID_C1" "" ""

# CENÁRIO 10
log_md "---"
log_md "## Cenário 10 — Falha na entrega (exceção)"
log_md ""
log_md "**Descrição:** Entrega criada → \`PATCH .../falha\` (204) → venda \`FALHA NA ENTREGA\`."
log_md ""

VENDA_BODY_F=$(jq -n --arg e "$ENDERECO_UUID" --arg c "$CARTAO_UUID" --arg l "$LIVRO_UUID" \
  '{enderecoUuid:$e,cartaoUuid:$c,formaPagamento:"cartao",valorTotal:64.9,valorTotalItens:49.9,valorFrete:15,parcelas:1,itens:[{livroUuid:$l,quantidade:1,precoUnitario:49.9}]}')
req_res "POST" "/vendas" "" "$VENDA_BODY_F"
VENDA_UUID_F=$(echo "$LAST_RESP" | jq -r '.id')
BODY_ENT_F=$(jq -n --arg v "$VENDA_UUID_F" '{vendaUuid:$v,tipoFrete:"PAC",endereco:"Endereço de Teste",custo:15,entregador:"Transportadora Padrão"}')
req_res "POST_ADMIN" "/entregas" "" "$BODY_ENT_F"
ENTREGA_UUID_F=$(echo "$LAST_RESP" | jq -r '.uuid')
req_res "PATCH_ADMIN_EMPTY" "/entregas/$ENTREGA_UUID_F/falha" "" ""
req_res "GET_ADMIN" "/vendas/$VENDA_UUID_F" "" ""

log_md "---"
log_md "## Diagrama do fluxo"
log_md ""
log_md '```mermaid'
log_md 'flowchart TD'
log_md '  login[POST /auth/login] --> catalogo[GET /livros + carrinho]'
log_md '  catalogo --> venda[POST /vendas]'
log_md '  venda --> pag{Pagamento?}'
log_md '  pag -->|cartão futuro| proc[EM PROCESSAMENTO]'
log_md '  pag -->|CUPOM-ONLY| aprov[APROVADA]'
log_md '  proc --> entrega[POST /entregas]'
log_md '  entrega --> transito[EM TRÂNSITO]'
log_md '  transito --> confirmar[PATCH /confirmar]'
log_md '  confirmar --> entregue[ENTREGUE]'
log_md '  entregue --> troca[POST /vendas/uuid/troca]'
log_md '  troca --> emtroca[EM TROCA]'
log_md '  emtroca --> admin{Admin}'
log_md '  admin -->|autorizar| taut[TROCA AUTORIZADA]'
log_md '  taut --> conf[PATCH confirmar-recebimento]'
log_md '  conf --> concl[CONCLUÍDA + cupomGerado]'
log_md '  admin -->|rejeitar| trej[TROCA REJEITADA]'
log_md '  transito --> falha[PATCH /falha]'
log_md '  falha --> fent[FALHA NA ENTREGA]'
log_md '```'
log_md ""
log_md "## Mapa de status da venda"
log_md ""
log_md "| Status | Gatilho (rota) |"
log_md "|--------|----------------|"
log_md "| EM PROCESSAMENTO | POST /vendas |"
log_md "| APROVADA | POST /pagamento/processar (sucesso) |"
log_md "| EM TRÂNSITO | POST /entregas |"
log_md "| ENTREGUE | PATCH /entregas/:uuid/confirmar |"
log_md "| FALHA NA ENTREGA | PATCH /entregas/:uuid/falha |"
log_md "| EM TROCA | POST /vendas/:uuid/troca |"
log_md "| TROCA AUTORIZADA | PATCH /admin/pedidos/:uuid/autorizar-troca |"
log_md "| CONCLUÍDA | PATCH /admin/pedidos/:uuid/confirmar-recebimento |"
log_md "| TROCA REJEITADA | PATCH /admin/pedidos/:uuid/rejeitar-troca |"
log_md ""

exec 3>&-
echo "Markdown exportado em: $OUTPUT"
