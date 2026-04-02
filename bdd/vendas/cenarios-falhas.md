# Cenários BDD – Vendas e Pagamentos – Falhas

## Endpoints

- `POST /vendas`
- `POST /pagamentos/selecionar`

---

## Cenários de falha

### Tentativa de venda sem itens no carrinho

- **Dado** que o carrinho está vazio
- **Quando** é enviado `POST /vendas` com `itens: []`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Venda deve possuir ao menos um item"`

### Tentativa de compra com item sem estoque disponível

- **Dado** que o livro "Dom Casmurro" possui apenas 2 unidades em estoque
- **Quando** o cliente tenta enviar uma venda com 5 unidades deste livro
- **Então** a resposta tem status `400`
- **E** a mensagem de erro informa "Quantidade solicitada superior ao estoque disponível" (RN0031)

### Registro de pagamento com valor inválido

- **Dado** uma venda com UUID válido
- **Quando** é enviado `POST /pagamentos/selecionar` com `valor: -10.00` ou `valor: 0`
- **Então** a resposta tem status `400`
- **E** o erro retornado indica que o valor do pagamento deve ser positivo

### Uso de cupom inválido ou expirado

- **Dado** o cupom `"CUPOM_INVALIDO"` que não existe na base de dados
- **Quando** é enviado `POST /pagamentos/selecionar` com `tipoPagamento: "cupom_promocional"` e `detalhesCupom: "CUPOM_INVALIDO"`
- **Então** a resposta tem status `400`
- **E** a mensagem de erro é `"Cupom promocional inválido ou expirado"`

### Pagamento com cartão faltando dados obrigatórios

- **Dado** o tipo de pagamento `"cartao_credito"` selecionado
- **Quando** o objeto `cartao` não é enviado ou está incompleto
- **Então** a resposta tem status `400`
- **E** a mensagem de erro informa que os dados do cartão são obrigatórios

### Tentativa de consulta de venda inexistente

- **Dado** que o UUID `"uuid-nao-existente"` não está cadastrado
- **Quando** é feito `GET /vendas/uuid-nao-existente`
- **Então** a resposta tem status `404`
- **E** a mensagem de erro informa que a venda não foi encontrada

### Violação de valor mínimo para split de pagamentos (Regra de Negócio)

- **Dado** uma compra com valor total de R$ 50,00
- **Quando** o sistema tenta enviar pagamentos parciais via API com valores inferiores a R$ 10,00 (Ex: `valor: 5.00`)
- **Então** a resposta tem status `400`
- **E** o erro informa que o valor mínimo por transação de cartão não foi atingido
