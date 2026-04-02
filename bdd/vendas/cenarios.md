# Cenários BDD – Vendas, Pagamentos e Entrega

## Relação com o documento de requisitos (LES)

O documento oficial do projeto (**não editar o conteúdo**) está em  
`documentacao-exigida/doc-requirement-ecommerce-NAO-ALTERAR-CONTEUDO.md`  
— grupo **Gerenciar Vendas Eletrônicas** (RF0031–RF0044) e regras RN0031–RN0046.

- **Mapeamento detalhado** (cliente × admin × implementação):  
  **[alinhamento-doc-requisitos.md](./alinhamento-doc-requisitos.md)**

---

## Atores nos fluxos de venda

| Ator | O que o documento cobre (resumo) | Onde está no BDD hoje |
|------|----------------------------------|------------------------|
| **Cliente** | Carrinho (RF0031–32), compra, frete, endereço, pagamento, finalizar **EM PROCESSAMENTO** (RF0033–37); consulta de transações / pedidos (RF0025) | Principalmente em [cenarios-felizes.md](./cenarios-felizes.md) e [cenarios-falhas.md](./cenarios-falhas.md) (`POST /vendas`, pagamentos, `GET /minhas-vendas`, entrega). |
| **Administrador** | Despachar / **EM TRÂNSITO** (RF0038), confirmar **ENTREGUE** (RF0039), trocas (RF0041–44), listagem de clientes (RF0024) | **[cenarios-admin-felizes.md](./cenarios-admin-felizes.md)** e **[cenarios-admin-falhas.md](./cenarios-admin-falhas.md)** — cada RF traz **(requisito doc)** e **(implementação atual)**; ENTREGUE e trocas estão marcados onde a API ainda não expõe rota. Detalhes em [alinhamento-doc-requisitos.md](./alinhamento-doc-requisitos.md). |

---

## Arquivos de cenários

- **[Cenários de sucesso (felizes)](./cenarios-felizes.md)** — fluxos 2xx (venda, pagamento, entrega, histórico) — **lado cliente**.
- **[Cenários de falha](./cenarios-falhas.md)** — 4xx (validações; alguns dependem de RN ainda não aplicadas na API) — **lado cliente**.
- **[Cenários admin – sucesso](./cenarios-admin-felizes.md)** — RF0038–RF0039, RF0041–RF0044, apoio `GET /clientes` (RF0024).
- **[Cenários admin – falhas](./cenarios-admin-falhas.md)** — acesso negado a rotas administrativas, erros de entrega, especificação futura para trocas/ENTREGUE.

## Endpoints usados no BDD (backend)

**Cliente / fluxo de compra**

- `POST /vendas`
- `GET /vendas/:uuid`
- `POST /pagamentos/selecionar`
- `POST /pagamentos/:uuid/processar` (quando aplicável)
- `POST /entregas`
- `GET /entregas`, `GET /entregas/:uuid`
- `GET /minhas-vendas`

**Administrador (vendas / apoio)**

- `GET /clientes` (RF0024 — também em `bdd/admin/`)
- `POST /entregas`, `GET /entregas` (RF0038 — na API atual qualquer usuário autenticado pode acionar; ver nota em [cenarios-admin-felizes.md](./cenarios-admin-felizes.md))
