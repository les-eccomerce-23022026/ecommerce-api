# Cenários BDD – Vendas, Pagamentos e Entrega

Os cenários estão separados em:

- **[Cenários de sucesso (felizes)](./cenarios-felizes.md)** – fluxos que retornam 2xx (Criação de venda, Pagamento aprovado, Entrega cadastrada)
- **[Cenários de falha](./cenarios-falhas.md)** – fluxos que retornam 4xx/5xx (Falta de estoque, Cupons inválidos, Split de pagamento abaixo do mínimo)

Endpoints Principais:
- `POST /vendas`
- `POST /pagamentos/selecionar`
- `POST /entregas`
- `GET /minhas-vendas`
