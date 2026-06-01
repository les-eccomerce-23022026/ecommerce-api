import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

/**
 * Helper centralizado para gestão de preços do catálogo em testes.
 * Elimina valores fixos e garante consistência com o banco de dados.
 */

export const LIVRO_UUID_TESTE = 'a1b2c3d4-e5f6-7890-1234-56789abcdef0';
export const PRECO_CATALOGO_PADRAO = 79.90;
export const FRETE_PADRAO = 10;

/**
 * Obtém o preço real do livro no catálogo.
 * Se não encontrar, retorna o preço padrão.
 */
export async function obterPrecoCatalogo(
  db: IConexaoBanco,
  livroUuid: string = LIVRO_UUID_TESTE,
): Promise<number> {
  const rows = await db.executar<{ preco: string }>(
    `SELECT e.etq_preco_venda::text AS preco
     FROM livraria_comercial.livros l
     INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
     WHERE l.liv_uuid = $1`,
    [livroUuid],
  );
  
  if (!rows.length) {
    console.warn(`⚠️ Livro ${livroUuid} não encontrado no catálogo. Usando preço padrão: R$ ${PRECO_CATALOGO_PADRAO}`);
    return PRECO_CATALOGO_PADRAO;
  }
  
  const preco = Number(rows[0].preco);
  console.log(`📚 Preço do livro ${livroUuid}: R$ ${preco}`);
  return preco;
}

/**
 * Calcula o total da venda com base no preço do catálogo.
 */
export async function calcularTotalVenda(
  db: IConexaoBanco,
  livroUuid: string = LIVRO_UUID_TESTE,
  quantidade: number = 1,
  valorFrete: number = FRETE_PADRAO,
): Promise<{ precoUnitario: number; valorTotalItens: number; valorTotal: number }> {
  const precoUnitario = await obterPrecoCatalogo(db, livroUuid);
  const valorTotalItens = precoUnitario * quantidade;
  const valorTotal = valorTotalItens + valorFrete;
  
  return {
    precoUnitario,
    valorTotalItens,
    valorTotal,
  };
}

/**
 * Gera payload de pedido com preços dinâmicos do catálogo.
 */
export async function gerarPayloadPedido(
  db: IConexaoBanco,
  livroUuid: string = LIVRO_UUID_TESTE,
  opcoes?: {
    quantidade?: number;
    valorFrete?: number;
    [key: string]: unknown;
  },
): Promise<Record<string, unknown>> {
  const { quantidade, valorFrete, ...extras } = opcoes || {};
  const qtd = quantidade ?? 1;
  const frete = valorFrete ?? FRETE_PADRAO;
  
  const { precoUnitario, valorTotalItens, valorTotal } = await calcularTotalVenda(
    db, 
    livroUuid, 
    qtd, 
    frete
  );

  return {
    itens: [{ livroUuid, quantidade: qtd, precoUnitario }],
    valorTotalItens,
    valorFrete: frete,
    valorTotal,
    ...extras,
  };
}

/**
 * Calcula divisão de pagamento para múltiplos cartões.
 * Garante que a soma dos valores seja exatamente o total.
 */
export function calcularDivisaoPagamento(
  valorTotal: number,
  numeroCartoes: number = 2,
): number[] {
  const valorPorCartao = Number((valorTotal / numeroCartoes).toFixed(2));
  const valores = Array(numeroCartoes - 1).fill(valorPorCartao);
  
  // Último cartão recebe o valor restante para evitar diferenças de arredondamento
  const valorUltimoCartao = Number((valorTotal - valorPorCartao * (numeroCartoes - 1)).toFixed(2));
  valores.push(valorUltimoCartao);
  
  console.log(`💳 Divisão pagamento ${numeroCartoes} cartões:`, valores);
  return valores;
}

/**
 * Gera payload para pagamento com múltiplos cartões.
 */
export async function gerarPayloadPagamentoMultiplo(
  db: IConexaoBanco,
  livroUuid: string = LIVRO_UUID_TESTE,
  opcoes?: {
    quantidade?: number;
    valorFrete?: number;
    numeroCartoes?: number;
    [key: string]: unknown;
  },
): Promise<{
  vendaPayload: Record<string, unknown>;
  pagamentoPayload: {
    pagamentosCartao: Array<{ valor: number; parcelasCartao: number }>;
  };
}> {
  const { numeroCartoes = 2, ...demaisOpcoes } = opcoes || {};
  
  const vendaPayload = await gerarPayloadPedido(db, livroUuid, demaisOpcoes);
  const valoresDivididos = calcularDivisaoPagamento(
    vendaPayload.valorTotal as number,
    numeroCartoes,
  );
  
  const pagamentoPayload = {
    pagamentosCartao: valoresDivididos.map((valor, index) => ({
      valor,
      parcelasCartao: index + 1, // 1, 2, 3...
    })),
  };
  
  return { vendaPayload, pagamentoPayload };
}

/**
 * Valida se os valores dos testes estão consistentes com o catálogo.
 */
export async function validarConsistenciaPrecos(
  db: IConexaoBanco,
  livroUuid: string = LIVRO_UUID_TESTE,
): Promise<boolean> {
  const precoCatalogo = await obterPrecoCatalogo(db, livroUuid);
  const precoEsperado = PRECO_CATALOGO_PADRAO;
  
  const consistente = Math.abs(precoCatalogo - precoEsperado) < 0.01;
  
  if (!consistente) {
    console.warn(`⚠️ Inconsistência de preços detectada:`);
    console.warn(`   Catálogo: R$ ${precoCatalogo}`);
    console.warn(`   Esperado: R$ ${precoEsperado}`);
  } else {
    console.log(`✅ Preços consistentes: R$ ${precoCatalogo}`);
  }
  
  return consistente;
}