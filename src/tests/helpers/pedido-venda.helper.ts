/**
 * Helpers para montagem de payloads de pedido (vendas) nos testes de integração.
 */

export const LIVRO_UUID_TESTE = '550e8400-e29b-41d4-a716-446655440000';

export function payloadPedidoValido(opcoes?: {
  precoUnitario?: number;
  quantidade?: number;
  valorFrete?: number;
}): Record<string, unknown> {
  const preco = opcoes?.precoUnitario ?? 50;
  const qtd = opcoes?.quantidade ?? 1;
  const frete = opcoes?.valorFrete ?? 10;
  const totalItens = preco * qtd;
  const total = totalItens + frete;

  return {
    itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: qtd, precoUnitario: preco }],
    valorTotalItens: totalItens,
    valorFrete: frete,
    valorTotal: total,
  };
}
