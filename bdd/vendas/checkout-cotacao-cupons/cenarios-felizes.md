# Cenários felizes — Cotação + cupons + cartões

## Endpoints

- `POST /frete/cotar`
- `POST /vendas` (com `cotacaoUuid` opcional)
- `POST /pagamentos/selecionar` (`cupom_promocional`, `cupom_troca`, `cartao_credito`)
- `POST /pagamentos/:uuid/processar`
- `POST /entregas`
- `GET /vendas/:uuid`, `GET /minhas-vendas`, `GET /entregas?vendaUuid=`

---

## Fluxo ponta a ponta

### Frete cotado e venda vinculada à cotação

- **Dado** um cliente autenticado
- **E** é obtida uma cotação PAC via `POST /frete/cotar` (CEP destino, peso, valor dos itens)
- **Quando** é enviado `POST /vendas` com itens, `valorTotalItens`, `valorFrete` e `valorTotal` coerentes com **itens + valor da cotação PAC** e o campo **`cotacaoUuid`** igual ao UUID retornado
- **Então** a resposta tem status `201`
- **E** o frete persistido na venda coincide com o valor da cotação
- **E** o status da venda é `EM PROCESSAMENTO`

### Pagamento com cupom promocional e cupom de troca via `selecionar`

- **Dado** uma venda criada com UUID válido
- **Quando** é enviado `POST /pagamentos/selecionar` com `tipoPagamento: "cupom_promocional"` e `detalhesCupom: "DESCONTO10"` e valor compatível com a regra
- **Então** a resposta tem status `201`
- **Quando** é enviado `POST /pagamentos/selecionar` com `tipoPagamento: "cupom_troca"` e `detalhesCupom: "TROCA50"` e valor ≤ 50
- **Então** a resposta tem status `201`

### Dois cartões de crédito (liquidação em partes)

- **Dado** o restante do total da venda após os cupons, particionado em duas parcelas ≥ R$ 10,00 cada
- **Quando** são enviados dois `POST /pagamentos/selecionar` com `cartao_credito` (bandeiras `Visa` e `Mastercard` conforme validação do domínio)
- **Então** ambos retornam `201` com status `PENDENTE`
- **Quando** é chamado `POST /pagamentos/:uuid/processar` para cada pagamento de cartão
- **Então** os pagamentos passam a `APROVADO` (provedor simulado)

### Entrega e consulta

- **Dado** pagamentos processados e o custo de entrega igual ao frete da venda
- **Quando** é enviado `POST /entregas` com `vendaUuid`, `tipoFrete`, `endereco` e `custo` igual ao frete da venda
- **Então** a resposta tem status `201`
- **E** `GET /vendas/:uuid` retorna status `EM TRÂNSITO`
- **E** `GET /minhas-vendas` inclui o pedido
- **E** `GET /entregas?vendaUuid=` lista a entrega criada
