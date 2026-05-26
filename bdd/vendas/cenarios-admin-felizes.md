# Cenários BDD – Vendas – Administrador – Sucesso

Referência: **RF0038**, **RF0039**, **RF0041–RF0044** do documento LES  
(`documentacao-exigida/doc-requirement-ecommerce-NAO-ALTERAR-CONTEUDO.md`).  
Alinhamento com a API: **[alinhamento-doc-requisitos.md](./alinhamento-doc-requisitos.md)**

Cada cenário traz **(requisito doc)** e, quando aplicável, **(implementação atual)** para o backend deste repositório.

---

## RF0038 — Despachar produtos para entrega (status **EM TRÂNSITO**)

### Cenário: administrador coloca venda aprovada em trânsito

- **(requisito doc)** **Dado** que existe uma venda com pagamento **aprovado** (status compatível com “liberada para envio”)
- **E** o administrador está autenticado com perfil adequado
- **Quando** o administrador registra o despacho / transporte da venda
- **Então** o status do pedido passa a **EM TRÂNSITO** (RF0038)

- **(implementação atual)** Na API há `POST /api/entregas` (autenticado) que agenda remessa e atualiza a venda para **EM TRÂNSITO**.  
  Hoje **não** existe rota exclusiva “somente admin”; cliente autenticado também pode acionar esse fluxo nos testes. O comportamento desejado pelo doc (somente admin seleciona vendas aprovadas) pode ser reforçado no futuro com autorização ou tela administrativa dedicada.

### Cenário: administrador consulta entrega vinculada a uma venda

- **Dado** que existe entrega cadastrada para uma venda
- **Quando** o administrador solicita `GET /api/entregas?vendaUuid={uuidDaVenda}` ou `GET /api/entregas/{entregaUuid}`
- **Então** a resposta tem status `200`
- **E** os dados de transporte (tipo de frete, endereço, custo, entregador) são retornados

---

## RF0039 — Confirmar entrega (**ENTREGUE**)

### Cenário: administrador confirma que o cliente recebeu o pedido

- **(requisito doc)** **Dado** que o pedido está **EM TRÂNSITO** (ou equivalente “em transporte”)
- **Quando** o administrador confirma a entrega do pedido
- **Então** o status da compra passa a **ENTREGUE** (RF0039 / RN0040)

- **(implementação atual)** Existe método de domínio `ServicoEntrega.confirmarRecebimento(entregaUuid)` que atualiza a venda para **ENTREGUE**, porém **ainda não há rota HTTP** exposta para o administrador.  
  **Tag:** `pendente-de-api` — quando implementado, documentar `PATCH` ou `POST` aqui.

---

## RF0041 — Autorizar trocas (status **TROCA AUTORIZADA**)

### Cenário: administrador autoriza pedido de troca

- **(requisito doc)** **Dado** que existe pedido/compra com status **EM TROCA**
- **Quando** o administrador autoriza a troca
- **Então** o status passa a **TROCA AUTORIZADA** (conforme doc RF0041)

- **(implementação atual)** **Tag:** `pendente-de-api` — fluxo não exposto no backend descrito neste BDD.

---

## RF0042 — Visualização de trocas

### Cenário: administrador lista pedidos em troca

- **(requisito doc)** **Quando** o administrador consulta a lista de pedidos com status **EM TROCA**
- **Então** obtém a relação filtrada para gestão de trocas

- **(implementação atual)** **Tag:** `pendente-de-api`

---

## RF0043 — Confirmar recebimento de itens para troca

### Cenário: administrador confirma recebimento físico e informa retorno ao estoque

- **(requisito doc)** **Dado** que o pedido está no fluxo de troca
- **Quando** o administrador confirma o recebimento dos itens
- **E** informa se os itens devem retornar ao estoque
- **Então** o sistema registra a confirmação (RF0043)

- **(implementação atual)** **Tag:** `pendente-de-api`

---

## RF0044 — Gerar cupom de troca após recebimento

### Cenário: cupom disponibilizado ao cliente após conferência

- **(requisito doc)** **Dado** que o administrador confirmou o recebimento dos itens para troca
- **Então** um **cupom de troca** é gerado e fica disponível para o cliente (RF0044)

- **(implementação atual)** **Tag:** `pendente-de-api` — cupons simulados em `GET /pagamento/info` não equivalem a este fluxo completo.

---

## Consulta administrativa de clientes (apoio ao fluxo de vendas)

### Cenário: administrador lista clientes (RF0024)

- **Dado** que o administrador está autenticado com papel **admin**
- **Quando** acessa `GET /api/clientes` com filtros opcionais (`nome`, `pagina`, `limite`, …)
- **Então** a resposta tem status `200` e estrutura paginada com clientes

- **(implementação atual)** **Administrador mestre** e **administrador comum** podem listar. Ver BDD em `bdd/admin/` e testes `admin-comum-permissoes-listagens`.

---

## Resumo rápido

| RF | Tema | Status na API (resumo) |
|----|------|-------------------------|
| RF0038 | EM TRÂNSITO | `POST /entregas` — efetivo; papel “só admin” opcional no doc. |
| RF0039 | ENTREGUE | Domínio existe; **rota HTTP pendente**. |
| RF0041–RF0044 | Trocas | **Pendente**. |
