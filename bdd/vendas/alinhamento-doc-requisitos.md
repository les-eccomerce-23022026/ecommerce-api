# Alinhamento: BDD de vendas × documento de requisitos (LES)

Referência oficial (somente leitura):  
`documentacao-exigida/doc-requirement-ecommerce-NAO-ALTERAR-CONTEUDO.md` — seção **Gerenciar Vendas Eletrônicas** (RF0031–RF0044) e **Regras de Negócio** RN0031–RN0046.

Este arquivo resume **papel (cliente vs administrador)**, **o que o documento exige**, **o que o BDD descreve hoje** e **o que a API backend cobre na prática**.

---

## 1. Papéis no documento de requisitos

| Ator | RFs principais (vendas) | Foco |
|------|-------------------------|------|
| **Cliente** | RF0031–RF0037, RF0040 | Carrinho, compra, frete, endereço, pagamento, finalização **EM PROCESSAMENTO**; histórico/transações (RF0025); solicitar troca (RF0040). |
| **Administrador** | RF0038, RF0039, RF0041–RF0044 | Despachar (**EM TRÂNSITO**), confirmar entrega (**ENTREGUE**), autorizar/visualizar/confirmar trocas, gerar cupom de troca. |

---

## 2. Mapa documento → status de venda (termos)

| Fonte | Status / termo |
|-------|------------------|
| Doc RF0037 | Após finalizar: **EM PROCESSAMENTO**. |
| Doc RF0038 | Após despacho: **EM TRÂNSITO** (texto do doc). |
| Doc RN0039 | “EM TRANSPORTE” (sinônimo conceitual; na API costuma ser **EM TRÂNSITO**). |
| Doc RF0039 / RN0040 | **ENTREGUE** após confirmação do admin. |
| Doc RF0040–RF0044 | **EM TROCA**, **TROCA AUTORIZADA**, etc. |

---

## 3. O que o BDD atual cobre

| Tema | Onde está | Observação |
|------|-----------|------------|
| Cliente cria venda, status inicial | `cenarios-felizes` | Resposta da API usa **`id`** na venda; o BDD foi alinhado a isso onde aplicável. |
| Pagamento cartão PENDENTE | felizes | OK em relação ao fluxo simulado. |
| Cupom promocional DESCONTO10 | felizes | Serviço valida cupom de forma **simplificada**; não é “base de dados” completa como no texto RN0033. |
| Entrega → status **EM TRÂNSITO** | felizes | Coerente com `POST /entregas` + `ServicoEntrega`. |
| `GET /minhas-vendas` | felizes | Atende ideia de RF0025 / histórico do cliente. |
| Sem itens / valor pagamento / cartão obrigatório / venda inexistente | falhas | OK. |
| Estoque insuficiente (RN0031) | falhas | **Documentado no BDD**, mas a **API atual não valida estoque** em `ServicoVendas` — cenário aspiracional ou futura implementação. |
| Cupom inválido (mensagem específica) | falhas | Validação real pode diferir da string exata — conferir `ServicoPagamentos`. |
| Split mínimo R$ 10 (RN0034) | falhas | **Não aplicado** ao fluxo `POST /pagamentos/selecionar` atual — checkout simplificado pode ter regra diferente. |
| Admin: despacho **EM TRÂNSITO**, consulta entregas, **ENTREGUE**, trocas RF0041–44, `GET /clientes` | `cenarios-admin-felizes` / `cenarios-admin-falhas` | Cada RF traz **(requisito doc)** e **(implementação atual)**; ENTREGUE e trocas com tag **`pendente-de-api`** onde não há rota. |

---

## 4. Lacunas do BDD em relação ao documento (por ator)

### Cliente (a incluir ou marcar como “fora do escopo da API”)

- **RF0031–RF0032**: carrinho persistente e edição de quantidade — não há módulo de carrinho na API descrita; hoje a compra é **POST /vendas** direto.
- **RF0034–RF0035**: cálculo de frete e escolha de endereço no fluxo — parcialmente **simulado** em `GET /pagamento/info`, não é o fluxo completo do doc.
- **RF0036**: múltiplos meios (cupom + cartão) — parcial no serviço; RN0033–RN0036 (um cupom promocional, split mínimo, etc.) **não estão todos implementados**.
- **RF0040**: solicitar troca a partir do pedido — **sem rota dedicada** no backend mapeada aqui.

### Administrador (BDD em `cenarios-admin-*.md`; lacunas na API)

- **RF0038**: o doc fala em administrador selecionar vendas aprovadas; na API, **`POST /entregas`** (autenticado) coloca **EM TRÂNSITO** — **cliente ou admin** podem chamar; o BDD admin descreve o requisito e essa diferença.
- **RF0039**: **ENTREGUE** — `ServicoEntrega.confirmarRecebimento` existe no domínio, **sem rota HTTP**; o BDD marca **`pendente-de-api`**.
- **RF0041–RF0044**: trocas e cupom de troca — **especificados** no BDD admin com **`pendente-de-api`** até existirem endpoints.

---

## 5. Recomendações para manter o BDD alinhado (sem alterar o doc oficial)

1. **Manter** `doc-requirement-ecommerce-NAO-ALTERAR-CONTEUDO.md` como fonte de verdade dos RF/RN.
2. Ao expor novas rotas (**ENTREGUE**, trocas), **atualizar** `cenarios-admin-felizes.md` / `cenarios-admin-falhas.md` removendo ou ajustando tags **`pendente-de-api`** e documentando método HTTP e path.
3. **Manter** em `cenarios-falhas.md` a marcação **(depende de implementação)** para RN0031, RN0034, etc., onde a API ainda não aplica a regra.

---

## 6. Resumo em uma frase

O **documento LES** descreve um fluxo **completo** (carrinho → checkout → pagamento rico → admin despacha → entregue → trocas). O **BDD** cobre o **núcleo cliente** (venda, pagamento simulado, entrega **EM TRÂNSITO**, histórico) e, em arquivos dedicados, as **RFs de administrador** com distinção entre **requisito do doc** e **comportamento atual da API**; **ENTREGUE** e **trocas** dependem ainda de rotas ou regras não expostas. Regras como estoque (RN0031) e split mínimo (RN0034) podem estar **parciais ou ausentes** na API.
