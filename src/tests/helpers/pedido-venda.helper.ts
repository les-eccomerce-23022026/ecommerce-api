import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

/**
 * Helpers para montagem de payloads de pedido (vendas) nos testes de integração.
 */

/**
 * UUID de livro usado para testes de integração.
 * Este UUID deve corresponder a um livro existente no banco de testes.
 */
export const LIVRO_UUID_TESTE = '00000000-0000-0000-0000-000000000001';

/** Alinha o preço de venda do livro no catálogo para cenários que usam valor fixo nos testes. */
export async function alinharPrecoVendaLivroTeste(
  db: IConexaoBanco,
  livroUuid: string,
  precoVenda = 50,
): Promise<void> {
  await db.executar(
    `UPDATE livraria_comercial.estoques e
     SET etq_preco_venda = $2
     FROM livraria_comercial.livros l
     WHERE l.liv_id = e.liv_id AND l.liv_uuid = $1`,
    [livroUuid, precoVenda],
  );
}

export async function obterPrecoVendaLivroTeste(
  db: IConexaoBanco,
  livroUuid: string,
): Promise<number> {
  const rows = await db.executar<{ preco: string }>(
    `SELECT e.etq_preco_venda::text AS preco
     FROM livraria_comercial.livros l
     INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
     WHERE l.liv_uuid = $1`,
    [livroUuid],
  );
  if (!rows.length) {
    return 50;
  }
  return Number(rows[0].preco);
}

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
