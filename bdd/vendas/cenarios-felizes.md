# Cenários BDD – Vendas e Pagamentos – Sucesso

## Endpoints

- `POST /vendas`
- `GET /vendas/:uuid`
- `POST /pagamentos/selecionar`
- `POST /entregas`

---

## Cenários de sucesso

### Cadastro de uma nova venda com dados válidos

- **Dado** que o usuário está autenticado
- **E** existem itens disponíveis no estoque para os livros selecionados
- **Quando** é enviado `POST /vendas` com corpo contendo `itens` (uuid, quantidade, preco), `valorTotalItens`, `valorFrete` e `valorTotal`
- **Então** a resposta tem status `201`
- **E** o corpo é JSON contendo o `uuid` da venda criada e os dados confirmados
- **E** o status inicial da venda é `"EM PROCESSAMENTO"`

### Seleção de forma de pagamento com cartão de crédito

- **Dado** que uma venda foi criada anteriormente com UUID válido
- **Quando** é enviado `POST /pagamentos/selecionar` com `vendaUuid`, `valor`, `tipoPagamento: "cartao_credito"` e os dados do `cartao` (numero, nome, validade, bandeira)
- **Então** a resposta tem status `201`
- **E** o pagamento é registrado com status `"PENDENTE"`
- **E** o UUID do pagamento é retornado

### Aplicação de cupom promocional como pagamento

- **Dado** que o cupom promocional `"DESCONTO10"` é válido e ativo
- **Quando** é enviado `POST /pagamentos/selecionar` com `vendaUuid`, `valor`, `tipoPagamento: "cupom_promocional"` e `detalhesCupom: "DESCONTO10"`
- **Então** a resposta tem status `201`
- **E** o valor do desconto é aplicado ao total da venda

### Cadastro de dados de entrega e frete

- **Dado** que a venda foi criada e o pagamento está sendo processado
- **Quando** é enviado `POST /entregas` com `vendaUuid`, `tipoFrete`, `endereco` completo e `custo` do frete
- **Então** a resposta tem status `201`
- **E** o status da venda é atualizado para `"EM TRÂNSITO"` (conforme regra logísitca)

### Consulta de histórico de vendas do cliente

- **Dado** que o cliente possui vendas registradas
- **Quando** o cliente acessa `GET /minhas-vendas` com token JWT válido
- **Então** a resposta tem status `200`
- **E** retorna uma lista de todas as vendas vinculadas ao UUID do usuário autenticado
