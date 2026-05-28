import { IContextoRecomendacao } from '../entities/IContextoRecomendacao.entity';
import { IRepositorioEmbedding } from '../repositories/IRepositorioEmbedding';
import { ServicoGeracaoEmbedding } from './ServicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from './ServicoValidacaoProdutos';
import { CONFIGURACAO_RECOMENDACAO } from '../../infrastructure/repositories/RepositorioEmbeddingChromaDB';
import { MMRReranking, MMROption } from '../../infrastructure/utils/MMRReranking';

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
    const produtosSimilares = await this.repositorioEmbedding.buscarSimilares(
      queryEmbedding,
      limite
    );

    // Filtra apenas produtos que existem no BD (anti-alucinação)
    const produtosValidos = this.servicoValidacaoProdutos.filtrarProdutosExistentes(
      produtosSimilares.map((p) => p.produtoUuid),
      produtosExistentes
    );

    // Limita ao número solicitado
    const produtosFinais = produtosValidos.slice(0, limite);

    // Personaliza baseado no contexto do cliente
    const produtosPersonalizados = this.personalizarRecomendacao(
      produtosFinais,
      produtosSimilares,
      contextoCliente
    );

    // Aplica MMR reranking se habilitado
    const produtosFinaisMMR = usarMMR 
      ? this.aplicarMMR(produtosPersonalizados, produtosSimilares, limite)
      : produtosPersonalizados;

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
      // Sem contexto, retorna produtos ordenados por similaridade
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

    // Com contexto, aplica personalização
    const produtosComScore = produtosUuids.map((uuid) => {
      const produto = produtosSimilares.find((p) => p.produtoUuid === uuid);
      const similaridade = produto?.similaridade || 0;
      const metadados = produto?.metadados;

      // Boost para categorias preferidas
      let scorePersonalizado = similaridade;
      let motivo = 'similaridade_semantica';

      if (contextoCliente.preferencias.categorias.includes(metadados?.categoria)) {
        scorePersonalizado *= CONFIGURACAO_RECOMENDACAO.personalizacao.boostCategoria;
        motivo = 'categoria_preferida';
      }

      // Boost para autores preferidos
      if (contextoCliente.preferencias.autores.includes(metadados?.autor)) {
        scorePersonalizado *= CONFIGURACAO_RECOMENDACAO.personalizacao.boostAutor;
        motivo = 'autor_preferido';
      }

      // Boost para faixa de preço
      const preco = metadados?.preco || 0;
      if (
        preco >= contextoCliente.preferencias.faixaPreco.min &&
        preco <= contextoCliente.preferencias.faixaPreco.max
      ) {
        scorePersonalizado *= CONFIGURACAO_RECOMENDACAO.personalizacao.boostPreco;
        motivo = 'faixa_preco_compativel';
      }

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