# Cenários BDD – Vendas – Administrador – Falhas

Referência: **RF0038–RF0044** e regras de negócio associadas ao fluxo administrativo.  
Ver **[alinhamento-doc-requisitos.md](./alinhamento-doc-requisitos.md)**

---

## Acesso e autorização

### Tentativa de consulta de clientes sem ser administrador

- **Dado** um token JWT de **cliente** (papel `cliente`)
- **Quando** é enviado `GET /api/clientes` (consulta administrativa RF0024)
- **Então** a resposta tem status `403`
- **E** a mensagem indica restrição a administradores

---

## Despacho e entrega (RF0038 / RF0039)

### Registro de entrega para venda inexistente

- **Dado** um UUID de venda que não existe na base
- **Quando** é enviado `POST /api/entregas` com esse `vendaUuid`
- **Então** a resposta tem status `400`
- **E** a mensagem informa que a venda não foi encontrada

### Listagem de entregas sem informar a venda

- **Dado** um usuário autenticado
- **Quando** é enviado `GET /api/entregas` **sem** query `vendaUuid`
- **Então** a resposta tem status `400`
- **E** indica que o UUID da venda é obrigatório na query

### Consulta de entrega inexistente

- **Dado** um UUID de entrega inválido
- **Quando** é enviado `GET /api/entregas/{entregaUuid}`
- **Então** a resposta tem status `404`

---

## Rotas administrativas de gestão de vendas / trocas (futuras)

Os cenários abaixo descrevem **comportamento esperado** quando as rotas forem implementadas conforme o documento LES. Enquanto não existirem endpoints, permanecem como especificação (`pendente-de-api`).

### Confirmar entrega sem permissão

- **Dado** um token de **cliente** comum
- **Quando** (futuro) for chamado o endpoint de **confirmar entrega** / **ENTREGUE** reservado ao administrador
- **Então** a resposta deve ser `403` (ou equivalente de negócio)

### Autorizar troca para pedido que não está EM TROCA

- **Dado** um pedido cujo status **não** é **EM TROCA**
- **Quando** (futuro) o administrador tenta autorizar troca
- **Então** a resposta deve indicar erro de regra de negócio (`400`)

---

## Observação

Falhas de **validação de estoque** (RN0031) e **split mínimo** (RN0034) no fluxo de **compra** estão em [cenarios-falhas.md](./cenarios-falhas.md) (lado cliente).
