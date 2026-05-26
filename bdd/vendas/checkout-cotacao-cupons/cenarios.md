# Checkout com cotação de frete + cupons (`/pagamentos/selecionar`)

Fluxo alinhado à 4ª entrega (compra, formas de pagamento com cupons e múltiplos cartões, frete cotado).

## Documentação

- **[Cenários felizes](./cenarios-felizes.md)** — `POST /frete/cotar` → `POST /vendas` com `cotacaoUuid` → cupom promocional + cupom de troca + dois cartões → `processar` → `POST /entregas` → consultas.
- **[Cenários de falha](./cenarios-falhas.md)** — validações de cotação e de cupons na liquidação.

## Verificação automatizada

Suíte Jest: `src/tests/integracao/vendas/fluxo-cotacao-cupons.integracao.test.ts`  
Helpers: `src/tests/helpers/fluxo-cotacao-cupons.helper.ts`
