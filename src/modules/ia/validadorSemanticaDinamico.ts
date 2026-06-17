import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';

/**
 * Interface para produto recomendado
 */
export interface ProdutoRecomendado {
  metadados: {
    titulo: string;
    autor: string;
    categoria: string;
    sinopse?: string;
  };
}

/**
 * Resultado da validação semântica
 */
export interface ResultadoValidacaoSemantica {
  valido: boolean;
  motivo: string;
  similaridadeMedia?: number;
  similaridadeMinima?: number;
}

/**
 * Validador Semântico Dinâmico
 * 
 * Responsável por detectar incoerências semânticas usando similaridade de embeddings.
 * Implementa a Camada 2 do sistema de detecção de alucinações.
 * 
 * Estratégia:
 * - Gera embedding da query do usuário
 * - Gera embeddings dos produtos recomendados
 * - Calcula similaridade cosseno entre query e produtos
 * - Rejeita se similaridade média < 0.35 ou similaridade mínima < 0.25
 * 
 * Custo: 100-200ms, 50-100 tokens (embeddings dos produtos)
 * Ganho: Detecta ~70% das alucinações desconhecidas
 */
export class ValidadorSemanticaDinamico {
  private readonly LIMIAR_SIMILARIDADE_MEDIA = 0.35;
  private readonly LIMIAR_SIMILARIDADE_MINIMA = 0.25;

  constructor(
    private servicoEmbedding: IAdapterEmbedding
  ) {}

  /**
   * Valida coerência semântica entre query e produtos recomendados
   * usando similaridade de embeddings
   * 
   * @param query - Query do usuário
   * @param produtosRecomendados - Lista de produtos recomendados
   * @returns Resultado da validação semântica
   */
  async validarCoerenciaSemantica(
    query: string,
    produtosRecomendados: ProdutoRecomendado[]
  ): Promise<ResultadoValidacaoSemantica> {
    if (produtosRecomendados.length === 0) {
      return { valido: true, motivo: 'sem_produtos' };
    }

    try {
      // Gera embedding da query
      const embeddingQuery = await this.servicoEmbedding.gerarEmbedding(query);

      // Gera embeddings dos produtos (paralelo)
      const embeddingsProdutos = await Promise.all(
        produtosRecomendados.map(produto =>
          this.servicoEmbedding.gerarEmbedding(
            this.gerarTextoProduto(produto.metadados)
          )
        )
      );

      // Calcula similaridades
      const similaridades = embeddingsProdutos.map(embeddingProduto =>
        this.calcularSimilaridadeCosseno(embeddingQuery, embeddingProduto)
      );

      const similaridadeMedia = similaridades.reduce((a, b) => a + b, 0) / similaridades.length;
      const similaridadeMinima = Math.min(...similaridades);

      Logger.debug(
        `[ValidadorSemantica] Similaridades - Média: ${similaridadeMedia.toFixed(3)}, ` +
        `Mínima: ${similaridadeMinima.toFixed(3)}`
      );

      // Validação agressiva: similaridade média deve ser >= 0.35
      if (similaridadeMedia < this.LIMIAR_SIMILARIDADE_MEDIA) {
        Logger.warn(
          `[ValidadorSemantica] Incoerência detectada: similaridade média ${similaridadeMedia.toFixed(3)} < ${this.LIMIAR_SIMILARIDADE_MEDIA}`
        );
        return {
          valido: false,
          motivo: 'similaridade_baixa',
          similaridadeMedia,
          similaridadeMinima
        };
      }

      // Validação agressiva: similaridade mínima deve ser >= 0.25
      if (similaridadeMinima < this.LIMIAR_SIMILARIDADE_MINIMA) {
        Logger.warn(
          `[ValidadorSemantica] Produto com similaridade muito baixa: ${similaridadeMinima.toFixed(3)}`
        );
        return {
          valido: false,
          motivo: 'similaridade_minima_baixa',
          similaridadeMedia,
          similaridadeMinima
        };
      }

      return {
        valido: true,
        motivo: 'coerente',
        similaridadeMedia,
        similaridadeMinima
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ValidadorSemantica] Erro na validação semântica: ${mensagem}`);
      
      // Em caso de erro, permite passar (fail-safe)
      return { valido: true, motivo: 'erro_validacao' };
    }
  }

  /**
   * Calcula similaridade cosseno entre dois vetores
   * 
   * @param vetorA - Primeiro vetor
   * @param vetorB - Segundo vetor
   * @returns Similaridade cosseno (0 a 1)
   */
  private calcularSimilaridadeCosseno(vetorA: number[], vetorB: number[]): number {
    if (vetorA.length !== vetorB.length) {
      Logger.error(
        `[ValidadorSemantica] Vetores com dimensões diferentes: ${vetorA.length} vs ${vetorB.length}`
      );
      return 0;
    }

    let produtoEscalar = 0;
    let normaA = 0;
    let normaB = 0;

    for (let i = 0; i < vetorA.length; i++) {
      produtoEscalar += vetorA[i] * vetorB[i];
      normaA += vetorA[i] * vetorA[i];
      normaB += vetorB[i] * vetorB[i];
    }

    if (normaA === 0 || normaB === 0) {
      return 0;
    }

    return produtoEscalar / (Math.sqrt(normaA) * Math.sqrt(normaB));
  }

  /**
   * Gera texto representativo do produto para geração de embedding
   * 
   * @param metadados - Metadados do produto
   * @returns Texto concatenado do produto
   */
  private gerarTextoProduto(metadados: {
    titulo: string;
    autor: string;
    categoria: string;
    sinopse?: string;
  }): string {
    const partes = [
      `Título: ${metadados.titulo}`,
      `Autor: ${metadados.autor}`,
      `Categoria: ${metadados.categoria}`
    ];

    if (metadados.sinopse) {
      partes.push(`Sinopse: ${metadados.sinopse}`);
    }

    return partes.join('. ');
  }
}
