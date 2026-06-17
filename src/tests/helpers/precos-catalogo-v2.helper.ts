import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { obterPrecoCatalogo, PRECO_CATALOGO_PADRAO, FRETE_PADRAO } from './precos-catalogo.helper';

/**
 * Helper estendido para gestão de múltiplos livros e preços em testes E2E.
 * Suporta carrinhos complexos com diferentes livros e preços variados.
 */

export interface ItemCarrinho {
  livroUuid: string;
  quantidade: number;
  precoUnitario?: number; // Opcional, será obtido do catálogo se não informado
}

export interface CarrinhoOpcoes {
  valorFrete?: number;
  cuponsAplicados?: Array<{
    uuid: string;
    codigo: string;
    tipo: 'troca' | 'promocional';
    valor: number;
  }>;
}

export interface CarrinhoCalculado {
  itens: Array<{
    livroUuid: string;
    quantidade: number;
    precoUnitario: number;
    valorTotal: number;
  }>;
  valorTotalItens: number;
  valorFrete: number;
  valorCupons: number;
  valorTotal: number;
}

export interface PayloadVendaMultiplos {
  itens: Array<{
    livroUuid: string;
    quantidade: number;
    precoUnitario: number;
  }>;
  valorTotalItens: number;
  valorFrete: number;
  valorTotal: number;
  cuponsAplicados?: Array<{
    uuid: string;
    codigo: string;
    tipo: string;
    valor: number;
  }>;
}

/**
 * Livros de teste com diferentes preços para cenários variados
 */
export const LIVROS_TESTE = {
  SENHOR_ANEIS: {
    uuid: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    titulo: 'O Senhor dos Anéis: A Sociedade do Anel',
    preco: 79.90
  },
  DOM_CASMURRO: {
    uuid: 'b2c3d4e5-f6g7-8901-2345-6789abcdef1',
    titulo: 'Dom Casmurro',
    preco: 29.90
  },
  DUNA: {
    uuid: 'c3d4e5f6-g7h8-9012-3456-789abcdef2',
    titulo: 'Duna',
    preco: 79.90
  },
  MIL_NOVECENTOS_E_QUATRO: {
    uuid: 'd4e5f6g7-h8i9-0123-4567-89abcdef3',
    titulo: '1984',
    preco: 39.90
  },
  O_HOBBIT: {
    uuid: 'e5f6g7h8-i9j0-1234-5678-9abcdef4',
    titulo: 'O Hobbit',
    preco: 49.90
  },
  SILMARILLION: {
    uuid: 'f6g7h8i9-j0k1-2345-6789-abcdef5',
    titulo: 'Silmarillion',
    preco: 59.90
  },
  REVOLUCAO_BICHOS: {
    uuid: 'g7h8i9j0-k1l2-3456-789a-bcdef6',
    titulo: 'A Revolução dos Bichos',
    preco: 34.90
  }
} as const;

export type LivroTesteKey = keyof typeof LIVROS_TESTE;

/**
 * Obtém preço de múltiplos livros do catálogo
 */
export async function obterPrecosMultiplosLivros(
  db: IConexaoBanco,
  livrosUuids: string[]
): Promise<Map<string, number>> {
  const precos = new Map<string, number>();
  
  console.log(`📚 Obtendo preços de ${livrosUuids.length} livros...`);
  
  for (const uuid of livrosUuids) {
    try {
      const preco = await obterPrecoCatalogo(db, uuid);
      precos.set(uuid, preco);
      console.log(`   📖 ${uuid}: R$ ${preco}`);
    } catch (error) {
      console.warn(`   ⚠️ Erro ao obter preço do livro ${uuid}:`, error);
      // Usar preço padrão como fallback
      precos.set(uuid, PRECO_CATALOGO_PADRAO);
    }
  }
  
  return precos;
}

/**
 * Calcula total de um carrinho com múltiplos itens
 */
export function calcularTotalCarrinho(
  itens: ItemCarrinho[],
  precos: Map<string, number>,
  opcoes: CarrinhoOpcoes = {}
): CarrinhoCalculado {
  const valorFrete = opcoes.valorFrete ?? FRETE_PADRAO;
  
  // Calcular valor dos itens
  const itensCalculados = itens.map(item => {
    const precoUnitario = item.precoUnitario ?? precos.get(item.livroUuid) ?? PRECO_CATALOGO_PADRAO;
    const valorTotal = precoUnitario * item.quantidade;
    
    return {
      livroUuid: item.livroUuid,
      quantidade: item.quantidade,
      precoUnitario,
      valorTotal
    };
  });
  
  const valorTotalItens = itensCalculados.reduce((sum, item) => sum + item.valorTotal, 0);
  
  // Calcular valor dos cupons
  const valorCupons = opcoes.cuponsAplicados?.reduce((sum, cupom) => sum + cupom.valor, 0) ?? 0;
  
  // Calcular total final
  const valorTotal = Math.max(0, valorTotalItens + valorFrete - valorCupons);
  
  console.log(`🛒 Carrinho calculado:`);
  console.log(`   📦 Itens: ${itens.length}`);
  console.log(`   💰 Total itens: R$ ${valorTotalItens}`);
  console.log(`   🚚 Frete: R$ ${valorFrete}`);
  console.log(`   🎫 Cupons: R$ ${valorCupons}`);
  console.log(`   🏁 Total final: R$ ${valorTotal}`);
  
  return {
    itens: itensCalculados,
    valorTotalItens,
    valorFrete,
    valorCupons,
    valorTotal
  };
}

/**
 * Gera payload para venda com múltiplos livros
 */
export async function gerarPayloadVendaMultiplos(
  db: IConexaoBanco,
  itens: ItemCarrinho[],
  opcoes: CarrinhoOpcoes = {}
): Promise<PayloadVendaMultiplos> {
  // Obter preços de todos os livros
  const livrosUuids = itens.map(item => item.livroUuid);
  const precos = await obterPrecosMultiplosLivros(db, livrosUuids);
  
  // Calcular carrinho
  const carrinho = calcularTotalCarrinho(itens, precos, opcoes);
  
  // Montar payload
  const payload: PayloadVendaMultiplos = {
    itens: carrinho.itens.map(item => ({
      livroUuid: item.livroUuid,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario
    })),
    valorTotalItens: carrinho.valorTotalItens,
    valorFrete: carrinho.valorFrete,
    valorTotal: carrinho.valorTotal
  };
  
  // Adicionar cupons se houver
  if (opcoes.cuponsAplicados && opcoes.cuponsAplicados.length > 0) {
    payload.cuponsAplicados = opcoes.cuponsAplicados;
  }
  
  return payload;
}

/**
 * Gera payload para carrinho simples (um livro específico)
 */
export async function gerarPayloadLivroEspecifico(
  db: IConexaoBanco,
  livroKey: LivroTesteKey,
  quantidade: number = 1,
  opcoes: CarrinhoOpcoes = {}
): Promise<PayloadVendaMultiplos> {
  const livro = LIVROS_TESTE[livroKey];
  
  return gerarPayloadVendaMultiplos(db, [{
    livroUuid: livro.uuid,
    quantidade,
    precoUnitario: livro.preco
  }], opcoes);
}

/**
 * Gera payload para carrinho com livros variados
 */
export async function gerarPayloadCarrinhoVariado(
  db: IConexaoBanco,
  opcoes: CarrinhoOpcoes = {}
): Promise<PayloadVendaMultiplos> {
  const itens: ItemCarrinho[] = [
    { livroUuid: LIVROS_TESTE.SENHOR_ANEIS.uuid, quantidade: 1 },
    { livroUuid: LIVROS_TESTE.DOM_CASMURRO.uuid, quantidade: 2 },
    { livroUuid: LIVROS_TESTE.DUNA.uuid, quantidade: 1 }
  ];
  
  return gerarPayloadVendaMultiplos(db, itens, opcoes);
}

/**
 * Gera payload para carrinho premium (livros mais caros)
 */
export async function gerarPayloadCarrinhoPremium(
  db: IConexaoBanco,
  opcoes: CarrinhoOpcoes = {}
): Promise<PayloadVendaMultiplos> {
  const itens: ItemCarrinho[] = [
    { livroUuid: LIVROS_TESTE.SENHOR_ANEIS.uuid, quantidade: 1 },
    { livroUuid: LIVROS_TESTE.DUNA.uuid, quantidade: 1 },
    { livroUuid: LIVROS_TESTE.SILMARILLION.uuid, quantidade: 1 }
  ];
  
  return gerarPayloadVendaMultiplos(db, itens, {
    ...opcoes,
    valorFrete: 15 // Frete maior para carrinho pesado
  });
}

/**
 * Calcula divisão de pagamento para múltiplos cartões com valores variados
 */
export function calcularDivisaoPagamentoVariado(
  valorTotal: number,
  distribuicao: number[] // Percentuais para cada cartão (ex: [50, 30, 20])
): number[] {
  const valores = distribuicao.map(percentual => {
    const valor = (valorTotal * percentual) / 100;
    return Number(valor.toFixed(2));
  });
  
  // Ajustar último valor para compensar arredondamento
  const somaCalculada = valores.reduce((sum, val) => sum + val, 0);
  valores[valores.length - 1] += valorTotal - somaCalculada;
  
  console.log(`💳 Divisão pagamento variada (${distribuicao}%):`, valores);
  
  return valores;
}

/**
 * Gera payload para pagamento com múltiplos cartões e valores variados
 */
export async function gerarPayloadPagamentoMultiplosVariado(
  db: IConexaoBanco,
  itens: ItemCarrinho[],
  opcoes: CarrinhoOpcoes & {
    distribuicaoCartoes?: number[];
    numeroCartoes?: number;
  } = {}
): Promise<{
  vendaPayload: PayloadVendaMultiplos;
  pagamentoPayload: {
    pagamentosCartao: Array<{ valor: number; parcelasCartao: number }>;
  };
}> {
  const vendaPayload = await gerarPayloadVendaMultiplos(db, itens, opcoes);
  
  let valoresDivididos: number[];
  
  if (opcoes.distribuicaoCartoes) {
    // Usar distribuição personalizada
    valoresDivididos = calcularDivisaoPagamentoVariado(
      vendaPayload.valorTotal,
      opcoes.distribuicaoCartoes
    );
  } else {
    // Usar divisão igual (padrão)
    const numeroCartoes = opcoes.numeroCartoes ?? 2;
    valoresDivididos = calcularDivisaoPagamentoIgual(vendaPayload.valorTotal, numeroCartoes);
  }
  
  const pagamentoPayload = {
    pagamentosCartao: valoresDivididos.map((valor, index) => ({
      valor,
      parcelasCartao: index + 1
    }))
  };
  
  return { vendaPayload, pagamentoPayload };
}

/**
 * Calcula divisão igual de pagamento (helper interno)
 */
function calcularDivisaoPagamentoIgual(valorTotal: number, numeroCartoes: number): number[] {
  const valorPorCartao = Number((valorTotal / numeroCartoes).toFixed(2));
  const valores = Array(numeroCartoes - 1).fill(valorPorCartao);
  const valorUltimoCartao = Number((valorTotal - valorPorCartao * (numeroCartoes - 1)).toFixed(2));
  valores.push(valorUltimoCartao);
  return valores;
}

/**
 * Valida consistência de preços para múltiplos livros
 */
export async function validarConsistenciaPrecosMultiplos(
  db: IConexaoBanco,
  livrosUuids: string[]
): Promise<{
  consistente: boolean;
  detalhes: Array<{
    livroUuid: string;
    precoBanco: number;
    precoEsperado: number;
    consistente: boolean;
  }>;
}> {
  console.log(`🔍 Validando consistência de ${livrosUuids.length} livros...`);
  
  const detalhes = [];
  let todosConsistentes = true;
  
  for (const uuid of livrosUuids) {
    try {
      const precoBanco = await obterPrecoCatalogo(db, uuid);
      
      // Verificar se é um livro de teste conhecido
      const livroTeste = Object.values(LIVROS_TESTE).find(livro => livro.uuid === uuid);
      const precoEsperado = livroTeste?.preco ?? PRECO_CATALOGO_PADRAO;
      
      const consistente = Math.abs(precoBanco - precoEsperado) < 0.01;
      
      detalhes.push({
        livroUuid: uuid,
        precoBanco,
        precoEsperado,
        consistente
      });
      
      if (consistente) {
        console.log(`   ✅ ${uuid}: R$ ${precoBanco} (consistente)`);
      } else {
        console.log(`   ❌ ${uuid}: R$ ${precoBanco} (esperado: R$ ${precoEsperado})`);
        todosConsistentes = false;
      }
    } catch (error) {
      console.log(`   ❌ ${uuid}: Erro - ${error}`);
      detalhes.push({
        livroUuid: uuid,
        precoBanco: 0,
        precoEsperado: PRECO_CATALOGO_PADRAO,
        consistente: false
      });
      todosConsistentes = false;
    }
  }
  
  const resultado = {
    consistente: todosConsistentes,
    detalhes
  };
  
  if (todosConsistentes) {
    console.log(`✅ Todos os ${livrosUuids.length} preços estão consistentes!`);
  } else {
    console.log(`❌ ${detalhes.filter(d => !d.consistente).length} preços inconsistentes encontrados.`);
  }
  
  return resultado;
}

/**
 * Obtém todos os livros de teste disponíveis
 */
export function getLivrosTesteDisponiveis(): Array<{ key: LivroTesteKey; uuid: string; titulo: string; preco: number }> {
  return Object.entries(LIVROS_TESTE).map(([key, livro]) => ({
    key: key as LivroTesteKey,
    uuid: livro.uuid,
    titulo: livro.titulo,
    preco: livro.preco
  }));
}

/**
 * Gera combinações de carrinhos para testes
 */
export function gerarCombinacoesCarrinho(): Array<{
  nome: string;
  itens: Array<{ livroKey: LivroTesteKey; quantidade: number }>;
  descricao: string;
}> {
  return [
    {
      nome: 'simples',
      itens: [{ livroKey: 'SENHOR_ANEIS', quantidade: 1 }],
      descricao: 'Carrinho simples com um livro'
    },
    {
      nome: 'duplo',
      itens: [
        { livroKey: 'SENHOR_ANEIS', quantidade: 1 },
        { livroKey: 'DOM_CASMURRO', quantidade: 1 }
      ],
      descricao: 'Carrinho com dois livros diferentes'
    },
    {
      nome: 'multiplo',
      itens: [
        { livroKey: 'DOM_CASMURRO', quantidade: 2 },
        { livroKey: 'MIL_NOVECENTOS_E_QUATRO', quantidade: 1 }
      ],
      descricao: 'Carrinho com múltiplas unidades'
    },
    {
      nome: 'premium',
      itens: [
        { livroKey: 'SENHOR_ANEIS', quantidade: 1 },
        { livroKey: 'SILMARILLION', quantidade: 1 },
        { livroKey: 'O_HOBBIT', quantidade: 1 }
      ],
      descricao: 'Carrinho premium com livros caros'
    },
    {
      nome: 'completo',
      itens: [
        { livroKey: 'SENHOR_ANEIS', quantidade: 1 },
        { livroKey: 'DOM_CASMURRO', quantidade: 1 },
        { livroKey: 'DUNA', quantidade: 1 },
        { livroKey: 'MIL_NOVECENTOS_E_QUATRO', quantidade: 1 }
      ],
      descricao: 'Carrinho completo com variedade'
    }
  ];
}