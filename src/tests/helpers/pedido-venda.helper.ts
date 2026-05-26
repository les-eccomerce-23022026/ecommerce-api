/**
 * Helpers para montagem de payloads de pedido (vendas) nos testes de integração.
 */

/**
 * UUID de livro usado para testes de integração.
 * Este UUID deve corresponder a um livro existente no banco de testes.
 */
export const LIVRO_UUID_TESTE = '00000000-0000-0000-0000-000000000001';

export function payloadPedidoValido(livroUuid: string, opcoes?: {
  precoUnitario?: number;
  quantidade?: number;
  valorFrete?: number;
  [key: string]: unknown;
}): Record<string, unknown> {
  const { precoUnitario, quantidade, valorFrete, ...extras } = opcoes || {};
  const preco = precoUnitario ?? 50;
  const qtd = quantidade ?? 1;
  const frete = valorFrete ?? 10;
  const totalItens = preco * qtd;
  const total = totalItens + frete;

  return {
    itens: [{ livroUuid, quantidade: qtd, precoUnitario: preco }],
    valorTotalItens: totalItens,
    valorFrete: frete,
    valorTotal: total,
    ...extras,
  };
}
