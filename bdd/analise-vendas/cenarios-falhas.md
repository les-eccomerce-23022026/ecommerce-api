# Cenários BDD – Análise de Vendas com Gráfico de Linhas – Falhas

## Endpoints

- `GET /admin/analise-vendas`
- `GET /admin/analise-vendas/metricas`

---

## Cenários de falha

### Consulta com período inválido (data início posterior à data fim)

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2026-12-31&dataFim=2026-01-01`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"A data de início deve ser anterior à data de fim"`

### Consulta com data de início no futuro

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2027-01-01&dataFim=2027-12-31`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"A data de início não pode ser no futuro"`

### Consulta com formato de data inválido

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=31/01/2026&dataFim=31/12/2026`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Formato de data inválido. Use o formato YYYY-MM-DD"`

### Consulta sem período especificado

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas` sem parâmetros de data
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O período de análise (dataInicio e dataFim) é obrigatório"`

### Consulta com categoria inexistente

- **Dado** que o administrador está autenticado
- **E** a categoria "CategoriaInexistente" não está cadastrada no sistema
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31&categorias=CategoriaInexistente`
- **Então** a resposta tem status `404`
- **E** a mensagem de erro é `"Uma ou mais categorias selecionadas não foram encontradas"`

### Consulta por usuário não autenticado

- **Dado** que o usuário não está autenticado
- **Quando** é enviado `GET /admin/analise-vendas-categoria?dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `401`
- **E** a mensagem de erro é `"Autenticação necessária para acessar esta funcionalidade"`

### Consulta por usuário com perfil cliente (pap_id = 2)

- **Dado** que o usuário está autenticado com perfil 'cliente' (pap_id = 2)
- **Quando** é enviado `GET /admin/analise-vendas-categoria?dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `403`
- **E** a mensagem de erro é `"Acesso negado. Esta rota é restrita a administradores."`

### Consulta por usuário com perfil admin_sistema (pap_id = 3)

- **Dado** que o usuário está autenticado com perfil 'admin_sistema' (pap_id = 3)
- **Quando** é enviado `GET /admin/analise-vendas-categoria?dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `200`
- **E** os dados de análise são retornados corretamente
- **E** o perfil 'admin_sistema' tem acesso à rota (adminOnlyMiddleware aceita admin e admin_sistema)

### Consulta com período superior a 24 meses

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2020-01-01&dataFim=2025-12-31` (período de 60 meses)
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O período de análise não pode exceder 24 meses"`

### Consulta com período inferior a 1 dia

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2026-06-15&dataFim=2026-06-15T00:00:00` (mesmo timestamp)
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O período de análise deve ser de pelo menos 1 dia"`

### Consulta quando não há dados de vendas no período

- **Dado** que o administrador está autenticado
- **E** não existem vendas registradas no período de "01/01/2020" a "31/12/2020"
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2020-01-01&dataFim=2020-12-31`
- **Então** a resposta tem status `200`
- **E** o corpo contém um array vazio de dados
- **E** o sistema retorna mensagem informativa `"Não há dados de vendas para o período especificado"`
