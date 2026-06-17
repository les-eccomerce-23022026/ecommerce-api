# BDD – Análise de Vendas com Gráfico de Linhas

> **Entrega 9 (08/06/2026):** Implementação de análise com gráfico de linhas para visualização do volume de livros vendidos em um determinado período.

## Documentação de Cenários

Os cenários BDD detalhados para esta funcionalidade estão organizados nos seguintes arquivos:

- **[cenarios-felizes.md](./cenarios-felizes.md)** — Cenários de sucesso (caminho feliz)
- **[cenarios-falhas.md](./cenarios-falhas.md)** — Cenários de falha (tratamento de erros)
- **[cenarios-validacao.md](./cenarios-validacao.md)** — Cenários de validação (validação de entrada)

## Endpoints

- `GET /admin/analise-vendas` — Consulta de métricas de vendas com filtros
- `GET /admin/analise-vendas/metricas` — Consulta de métricas agregadas

## Requisitos da Entrega 9

- **Uma linha por categoria de produto** — para comparar categorias no mesmo gráfico
- **Seleção de categorias** — filtro de categorias disponível para o usuário
- **Seleção do período de análise** — intervalo de datas configurável
- **Base de dados com 13 meses de histórico** — para demonstração na apresentação

## Critérios de Aceite

- [ ] Gráfico de linhas funcional na interface do e-commerce
- [ ] Exibição do volume de livros vendidos por período
- [ ] Uma linha por categoria de produto selecionada
- [ ] Filtro de categorias disponível para o usuário
- [ ] Filtro de período de análise disponível para o usuário
- [ ] Base de dados com pelo menos 13 meses de histórico de compras para demonstração

## Referência a Requisitos

- **RNF0043** — Gráfico de linhas para visualização de dados
- **Entrega 9** — Documentação completa em [`entregas/08062026/9-entrega-analise-grafico-linhas.md`](../../entregas/08062026/9-entrega-analise-grafico-linhas.md)
