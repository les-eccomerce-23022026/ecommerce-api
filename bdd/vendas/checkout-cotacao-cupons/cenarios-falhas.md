# Cenários de falha — Cotação na venda e cupons em `/pagamentos/selecionar`

## Endpoints

- `POST /vendas` (com `cotacaoUuid`)
- `POST /pagamentos/selecionar`

---

## Falhas na venda com `cotacaoUuid`

### Cotação inexistente

- **Quando** `POST /vendas` envia um `cotacaoUuid` que não existe no banco
- **Então** a resposta tem status `400`
- **E** a mensagem indica que a cotação de frete não foi encontrada

### Cotação já utilizada (consumida)

- **Dado** uma venda já criada com sucesso usando uma cotação PAC
- **Quando** uma segunda `POST /vendas` tenta usar o **mesmo** `cotacaoUuid`
- **Então** a resposta tem status `400`
- **E** a mensagem indica cotação inválida ou já utilizada

### Cotação expirada

- **Dado** uma cotação em estado utilizável cuja data de expiração já passou (ex.: persistida como `CRIADA` com `cfr_expira_em` no passado)
- **Quando** `POST /vendas` usa esse `cotacaoUuid`
- **Então** a resposta tem status `400`
- **E** a mensagem indica cotação expirada

### Total da venda incoerente com itens + frete da cotação

- **Dado** um `cotacaoUuid` válido e valores de itens corretos
- **Quando** `valorTotal` não fecha com `valorTotalItens` + valor do frete resolvido pela cotação (fora da tolerância)
- **Então** a resposta tem status `400`
- **E** a mensagem indica que o valor total não confere com itens + frete

---

## Falhas em cupons (`POST /pagamentos/selecionar`)

### Cupom promocional inválido

- **Quando** `tipoPagamento` é `cupom_promocional` e `detalhesCupom` não é aceito (ex.: `CUPOM_INVALIDO`)
- **Então** a resposta tem status `400`
- **E** a mensagem indica cupom promocional inválido ou expirado

### Cupom de troca com valor acima do permitido para `TROCA50`

- **Quando** `tipoPagamento` é `cupom_troca`, `detalhesCupom` é `TROCA50` e `valor` é superior ao limite aceito pela regra (ex.: 51)
- **Então** a resposta tem status `400`
- **E** a mensagem indica falha na validação do cupom de troca

### Cupom de troca com código inválido

- **Quando** `tipoPagamento` é `cupom_troca` e o código não é reconhecido (ex.: `TROCA99`)
- **Então** a resposta tem status `400`
- **E** a mensagem indica cupom de troca insuficiente ou inválido
