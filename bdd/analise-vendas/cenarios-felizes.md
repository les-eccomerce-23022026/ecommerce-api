# Cenários BDD – Análise de Vendas com Gráfico de Linhas – Sucesso

## Endpoints

- `GET /admin/analise-vendas`
- `GET /admin/analise-vendas/metricas`

---

## Cenários de sucesso

### Consulta de métricas de vendas com período válido e categorias selecionadas

- **Dado** que o administrador está autenticado
- **E** existem dados de vendas registrados no período de "01/01/2025" a "31/12/2025"
- **E** o administrador seleciona as categorias "Literatura Nacional" e "Ficção Científica"
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31&categorias=Literatura%20Nacional,Ficcao%20Cientifica`
- **Então** a resposta tem status `200`
- **E** o corpo é JSON contendo dados de volume de vendas por dia para cada categoria selecionada
- **E** os dados estão formatados para renderização em gráfico de linhas (RNF0043)

### Consulta de métricas com período de 13 meses (requisito de demonstração)

- **Dado** que o administrador está autenticado
- **E** existem dados de vendas registrados nos últimos 13 meses
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-05-01&dataFim=2026-06-01`
- **Então** a resposta tem status `200`
- **E** o corpo contém dados de vendas para todo o período de 13 meses
- **E** os dados são suficientes para demonstrar a funcionalidade na apresentação

### Consulta de métricas agregadas por mês

- **Dado** que o administrador está autenticado
- **E** existem dados de vendas registrados
- **Quando** é enviado `GET /admin/analise-vendas/metricas?agregacao=mes&dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `200`
- **E** o corpo contém dados de vendas agregados por mês
- **E** cada mês possui o total de livros vendidos por categoria

### Consulta de métricas com todas as categorias disponíveis

- **Dado** que o administrador está autenticado
- **E** existem 5 categorias de livros cadastradas no sistema
- **E** existem dados de vendas para todas as categorias
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31&categorias=todas`
- **Então** a resposta tem status `200`
- **E** o corpo contém dados de vendas para todas as 5 categorias
- **E** cada categoria é representada como uma linha separada no gráfico

### Consulta de métricas com período de um único dia

- **Dado** que o administrador está autenticado
- **E** existem vendas registradas em "15/06/2026"
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2026-06-15&dataFim=2026-06-15`
- **Então** a resposta tem status `200`
- **E** o corpo contém dados de vendas apenas para o dia especificado
- **E** os dados podem ser visualizados no gráfico de linhas

### Consulta de ranking de categorias mais vendidas

- **Dado** que o administrador está autenticado
- **E** existem dados de vendas registrados no período
- **Quando** é enviado `GET /admin/analise-vendas/metricas?ranking=true&dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `200`
- **E** o corpo contém ranking de categorias ordenadas por volume de vendas
- **E** a categoria com maior volume aparece primeiro na lista
