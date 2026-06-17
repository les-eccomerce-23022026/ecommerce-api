# Cenários BDD – Análise de Vendas com Gráfico de Linhas – Validação

## Endpoints

- `GET /admin/analise-vendas`
- `GET /admin/analise-vendas/metricas`

---

## Cenários de validação

### Validação de formato de data (YYYY-MM-DD)

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025/01/01&dataFim=2025/12/31` (formato com barras)
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Formato de data inválido. Use o formato YYYY-MM-DD"`

### Validação de data início obrigatória

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataFim=2025-12-31` (sem dataInicio)
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O parâmetro dataInicio é obrigatório"`

### Validação de data fim obrigatória

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01` (sem dataFim)
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O parâmetro dataFim é obrigatório"`

### Validação de parâmetro de categorias vazio

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31&categorias=`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O parâmetro categorias não pode estar vazio"`

### Validação de tipo de agregação inválido

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas/metricas?agregacao=hora&dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Tipo de agregação inválido. Use: dia, mes ou ano"`

### Validação de caracteres especiais em nome de categoria

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31&categorias=<script>alert('xss')</script>`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Nome de categoria contém caracteres inválidos"`

### Validação de número máximo de categorias selecionadas

- **Dado** que o administrador está autenticado
- **E** o sistema limita a seleção a 10 categorias por consulta
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31&categorias=cat1,cat2,cat3,cat4,cat5,cat6,cat7,cat8,cat9,cat10,cat11`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Não é possível selecionar mais de 10 categorias por consulta"`

### Validação de data com dia inválido (ex: 32 de janeiro)

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-32&dataFim=2025-12-31`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Data inválida: dia fora do range permitido"`

### Validação de data com mês inválido (ex: mês 13)

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-13-01&dataFim=2025-12-31`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Data inválida: mês fora do range permitido"`

### Validação de parâmetro ranking booleano

- **Dado** que o administrador está autenticado
- **Quando** é enviado `GET /admin/analise-vendas/metricas?ranking=nao&dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O parâmetro ranking deve ser um valor booleano (true ou false)"`

### Validação de tamanho máximo do período (performance)

- **Dado** que o administrador está autenticado
- **E** o sistema define um limite de 24 meses para consultas
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2020-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"O período de análise não pode exceder 24 meses para garantir performance"`

### Validação de token JWT expirado

- **Dado** que o token JWT do administrador expirou
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `401`
- **E** a mensagem de erro é `"Token expirado. Faça login novamente"`

### Validação de token JWT malformado

- **Dado** que o token JWT enviado está malformado
- **Quando** é enviado `GET /admin/analise-vendas?dataInicio=2025-01-01&dataFim=2025-12-31`
- **Então** a resposta tem status `401`
- **E** a mensagem de erro é `"Token inválido ou malformado"`
