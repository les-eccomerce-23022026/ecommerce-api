import { IContextoRecomendacao } from './IContextoRecomendacao.entity';
import { IRepositorioEmbedding } from './IRepositorioEmbedding';
import { ServicoGeracaoEmbedding } from './servicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from './servicoValidacaoProdutos';
import { CONFIGURACAO_RECOMENDACAO } from './repositorioEmbeddingChromaDB';
import { MMRReranking, MMROption } from './MMRReranking';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Serviço de Domínio para Recomendação com RAG
 * 
 * Responsável por orquestrar o fluxo de recomendação usando RAG:
 * 1. Gera embedding da query do usuário
 * 2. Busca produtos similares no ChromaDB
 * 3. Valida se os produtos existem (anti-alucinação)
 * 4. Gera resposta personalizada com contexto do cliente
 */
export class ServicoRecomendacaoRAG {
  constructor(
    private repositorioEmbedding: IRepositorioEmbedding,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding,
    private servicoValidacaoProdutos: ServicoValidacaoProdutos
  ) {}

  /**
   * Gera recomendações baseadas na query do usuário e contexto do cliente
   */
  async gerarRecomendacao(
    query: string,
    queryEmbedding: number[],
    contextoCliente: IContextoRecomendacao | null,
    produtosExistentes: Set<string>,
    limite: number = CONFIGURACAO_RECOMENDACAO.quantidadeResultados,
    usarMMR: boolean = false
  ): Promise<RecomendacaoResultado> {
    // Busca produtos similares no ChromaDB
    // O repositório aplica CONFIGURACAO_RECOMENDACAO.multiplicadorBusca e CONFIGURACAO_RECOMENDACAO.limiarSimilaridade internamente
    const limiteBusca = Math.max(limite * 4, 30);
    const produtosSimilares = await this.repositorioEmbedding.buscarSimilares(
      queryEmbedding,
      limiteBusca
    );

    // Um livro pode ter vários chunks no Chroma — mantém o melhor score por produtoUuid
    const melhorPorProduto = new Map<
      string,
      { produtoUuid: string; similaridade: number; metadados: Record<string, unknown> }
    >();
    for (const candidato of produtosSimilares) {
      if (!candidato.produtoUuid) {
        continue;
      }
      const atual = melhorPorProduto.get(candidato.produtoUuid);
      if (!atual || candidato.similaridade > atual.similaridade) {
        melhorPorProduto.set(candidato.produtoUuid, candidato);
      }
    }

    const candidatosUnicos = Array.from(melhorPorProduto.values()).sort(
      (a, b) => b.similaridade - a.similaridade
    );

    // Aplica randomização leve para reduzir bias de popularidade
    // Se não há contexto de cliente, randomiza resultados com similaridade próxima
    if (!contextoCliente && candidatosUnicos.length > 1) {
      ServicoRecomendacaoRAG.randomizarResultadosSimilares(candidatosUnicos);
    }

    // Filtra apenas produtos que existem no BD (anti-alucinação), ignorando embeddings órfãos
    const produtosValidos = candidatosUnicos
      .filter((p) => produtosExistentes.has(p.produtoUuid))
      .map((p) => p.produtoUuid);

    Logger.debug(`[ServicoRecomendacaoRAG] Filtro anti-alucinação: ${candidatosUnicos.length} candidatos → ${produtosValidos.length} válidos`);
    
    if (produtosValidos.length === 0 && candidatosUnicos.length > 0) {
      this.logarDetalhesFiltroCompleto(candidatosUnicos, produtosExistentes);
    }

    // Personaliza baseado no contexto do cliente (antes do slice para MMR ter mais candidatos)
    const produtosPersonalizados = this.personalizarRecomendacao(
      produtosValidos,
      candidatosUnicos,
      contextoCliente
    );

    // Aplica MMR reranking se habilitado (quantidade > 1)
    const produtosFinaisMMR = usarMMR
      ? this.aplicarMMR(produtosPersonalizados, candidatosUnicos, limite)
      : produtosPersonalizados.slice(0, limite);

    return {
      query,
      produtos: produtosFinaisMMR,
      contextoUsado: contextoCliente !== null,
      totalEncontrados: produtosSimilares.length,
      totalValidos: produtosValidos.length,
      rerankingAplicado: usarMMR,
    };
  }

  /**
   * Loga detalhes quando todos os candidatos foram filtrados
   */
  private logarDetalhesFiltroCompleto(
    candidatosUnicos: { produtoUuid: string; similaridade: number; metadados: Record<string, unknown> }[],
    produtosExistentes: Set<string>
  ): void {
    Logger.warn(`[ServicoRecomendacaoRAG] Todos os candidatos foram filtrados. Primeiros 3 UUIDs dos embeddings: ${candidatosUnicos.slice(0, 3).map(p => p.produtoUuid).join(', ')}`);
    Logger.warn(`[ServicoRecomendacaoRAG] Total de produtos existentes no BD: ${produtosExistentes.size}`);
    Logger.warn(`[ServicoRecomendacaoRAG] Exemplo de 3 UUIDs do BD: ${Array.from(produtosExistentes).slice(0, 3).join(', ')}`);
    
    const primeirosEmbeddingUuids = candidatosUnicos.slice(0, 5).map(p => p.produtoUuid);
    const bdUuidsArray = Array.from(produtosExistentes).slice(0, 10);
    Logger.warn(`[ServicoRecomendacaoRAG] Comparação detalhada:`);
    Logger.warn(`[ServicoRecomendacaoRAG] Embeddings: ${JSON.stringify(primeirosEmbeddingUuids)}`);
    Logger.warn(`[ServicoRecomendacaoRAG] BD: ${JSON.stringify(bdUuidsArray)}`);
  }

  /**
   * Randomiza resultados com similaridade próxima para reduzir bias de popularidade
   * 
   * Aplica Fisher-Yates shuffle em grupos de produtos com similaridade dentro de um threshold (0.05)
   * Isso mantém a ordem geral por similaridade mas randomiza produtos muito similares entre si
   */
  private static randomizarResultadosSimilares(
    produtos: { produtoUuid: string; similaridade: number; metadados: Record<string, unknown> }[]
  ): void {
    const THRESHOLD_SIMILARIDADE = 0.05;
    let indiceAtual = 0;
    
    while (indiceAtual < produtos.length) {
      const grupo = [indiceAtual];
      let indiceProximo = indiceAtual + 1;
      
      // Encontra produtos com similaridade muito próxima
      while (
        indiceProximo < produtos.length &&
        Math.abs(produtos[indiceAtual].similaridade - produtos[indiceProximo].similaridade) <= THRESHOLD_SIMILARIDADE
      ) {
        grupo.push(indiceProximo);
        indiceProximo += 1;
      }
      
      // Se há mais de 1 produto no grupo, randomiza suas posições
      if (grupo.length > 1) {
        for (let k = grupo.length - 1; k > 0; k -= 1) {
          const indiceAleatorio = Math.floor(Math.random() * (k + 1));
          const temp = produtos[grupo[k]];
          produtos[grupo[k]] = produtos[grupo[indiceAleatorio]];
          produtos[grupo[indiceAleatorio]] = temp;
        }
      }
      
      // Avança para o próximo grupo
      indiceAtual += grupo.length;
    }
  }

  /**
   * Aplica reranking MMR para diversificar resultados
   */
  private aplicarMMR(
    produtos: ProdutoRecomendado[],
    produtosSimilares: { produtoUuid: string; similaridade: number; metadados: any }[],
    limite: number
  ): ProdutoRecomendado[] {
    // Converte para formato MMROption
    const mmrOptions: MMROption[] = produtos.map(p => {
      const similar = produtosSimilares.find(s => s.produtoUuid === p.uuid);
      return {
        produtoUuid: p.uuid,
        similaridade: p.similaridade,
        metadados: p.metadados,
        embedding: similar ? undefined : undefined, // Embeddings não disponíveis neste nível
      };
    });

    // Aplica MMR com lambda balanceado (0.5)
    const mmr = new MMRReranking({ lambda: 0.5 });
    const reranked = mmr.reranking(mmrOptions, limite);

    // Converte de volta para ProdutoRecomendado
    return reranked.map(r => ({
      uuid: r.produtoUuid,
      similaridade: r.similaridade,
      metadados: r.metadados,
      motivo: 'mmr_reranking',
    }));
  }

  /**
   * Personaliza recomendações baseado no histórico do cliente
   */
  private personalizarRecomendacao(
    produtosUuids: string[],
    produtosSimilares: { produtoUuid: string; similaridade: number; metadados: any }[],
    contextoCliente: IContextoRecomendacao | null
  ): ProdutoRecomendado[] {
    if (!contextoCliente) {
      return this.mapearProdutosSemContexto(produtosUuids, produtosSimilares);
    }

    return this.mapearProdutosComContexto(produtosUuids, produtosSimilares, contextoCliente);
  }

  /**
   * Mapeia produtos sem contexto de cliente usando early return
   */
  private mapearProdutosSemContexto(
    produtosUuids: string[],
    produtosSimilares: { produtoUuid: string; similaridade: number; metadados: any }[]
  ): ProdutoRecomendado[] {
    return produtosUuids
      .map((uuid) => {
        const produto = produtosSimilares.find((p) => p.produtoUuid === uuid);
        return {
          uuid,
          similaridade: produto?.similaridade || 0,
          metadados: produto?.metadados,
          motivo: 'similaridade_semantica',
        };
      })
      .sort((a, b) => b.similaridade - a.similaridade);
  }

  /**
   * Mapeia produtos com contexto de cliente usando early returns
   */
  private mapearProdutosComContexto(
    produtosUuids: string[],
    produtosSimilares: { produtoUuid: string; similaridade: number; metadados: any }[],
    contextoCliente: IContextoRecomendacao
  ): ProdutoRecomendado[] {
    const produtosComScore = produtosUuids.map((uuid) => {
      const produto = produtosSimilares.find((p) => p.produtoUuid === uuid);
      const similaridade = produto?.similaridade || 0;
      const metadados = produto?.metadados;

      const { scorePersonalizado, motivo } = this.calcularScorePersonalizado(
        similaridade,
        metadados,
        contextoCliente
      );

      return {
        uuid,
        similaridade,
        scorePersonalizado,
        metadados,
        motivo,
      };
    });

    return produtosComScore
      .sort((a, b) => b.scorePersonalizado - a.scorePersonalizado)
      .map(({ scorePersonalizado, ...rest }) => rest);
  }

  /**
   * Calcula score personalizado usando early returns
   */
  private calcularScorePersonalizado(
    similaridade: number,
    metadados: any,
    contextoCliente: IContextoRecomendacao
  ): { scorePersonalizado: number; motivo: string } {
    let scorePersonalizado = similaridade;
    let motivo = 'similaridade_semantica';

    if (contextoCliente.preferencias.categorias.includes(metadados?.categoria)) {
      scorePersonalizado *= CONFIGURACAO_RECOMENDACAO.personalizacao.boostCategoria;
      return { scorePersonalizado, motivo: 'categoria_preferida' };
    }

    if (contextoCliente.preferencias.autores.includes(metadados?.autor)) {
      scorePersonalizado *= CONFIGURACAO_RECOMENDACAO.personalizacao.boostAutor;
      return { scorePersonalizado, motivo: 'autor_preferido' };
    }

    const preco = metadados?.preco || 0;
    if (
      preco >= contextoCliente.preferencias.faixaPreco.min &&
      preco <= contextoCliente.preferencias.faixaPreco.max
    ) {
      scorePersonalizado *= CONFIGURACAO_RECOMENDACAO.personalizacao.boostPreco;
      return { scorePersonalizado, motivo: 'faixa_preco_compativel' };
    }

    return { scorePersonalizado, motivo };
  }
}

export interface RecomendacaoResultado {
  query: string;
  produtos: ProdutoRecomendado[];
  contextoUsado: boolean;
  totalEncontrados: number;
  totalValidos: number;
  rerankingAplicado?: boolean;
}

export interface ProdutoRecomendado {
  uuid: string;
  similaridade: number;
  metadados: any;
  motivo: string;
}