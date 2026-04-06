# Cenários BDD (especificação)

Os arquivos em subpastas (`auth/`, `admin/`, `clientes/`, `vendas/`, …) descrevem **comportamento esperado** em linguagem de negócio (feliz / falha).

- **Vendas × documento LES (RF/RN):** ver `bdd/vendas/alinhamento-doc-requisitos.md`, `bdd/vendas/cenarios.md`, e cenários **administrador** em `bdd/vendas/cenarios-admin-felizes.md` / `cenarios-admin-falhas.md`.

Eles **não são executados** automaticamente como steps Gherkin; a verificação fica na suíte **Jest**:

- Integração: `src/tests/integracao/**/*.integracao.test.ts` (organização sugerida por domínio)
  - `vendas/pedido-venda` — pedido do cliente (`POST/GET /vendas`, `minhas-vendas`)
  - `vendas/fluxo-cotacao-cupons` — `POST /frete/cotar` + `POST /vendas` com `cotacaoUuid` + cupons e dois cartões via `/pagamentos/selecionar` (BDD em `bdd/vendas/checkout-cotacao-cupons/`)
  - `vendas/vendas-admin-fluxo` — RF0024 (`GET /clientes`) e RF0038 (`POST/GET /entregas`) com token admin
  - `pagamentos/` — checkout e liquidação
  - `admin/admin-mestre-gestao` — mestre (lista admins, registro, inativar/ativar)
  - `admin/admin-comum-permissoes-listagens` — comum (`GET /clientes`) vs rotas só mestre
  - `entrega/`, `clientes/`, …
- Helpers reutilizáveis: `src/tests/helpers/`
- Unitários: `src/tests/unitarios/**/*.test.ts`

Para validação manual com HTTP, use também os scripts em `scripts/curl-*-bdd.sh`.

Ao alterar regras de negócio, atualize o `.md` correspondente **e** os testes automatizados que cobrem o mesmo fluxo.
