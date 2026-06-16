import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';

interface EntradaCacheEmbedding {
  embedding: number[];
  expiraEm: number;
}

/**
 * Decorator (Decorator Pattern) que adiciona cache em memória a qualquer
 * implementação de IAdapterEmbedding.
 *
 * Centraliza o cache de embeddings que antes vivia apenas dentro do
 * AdapterLangChainGemini — agora qualquer provedor (huggingface_local, jina,
 * openai, gemini) embrulhado pela FactoryEmbedding ganha cache automático.
 *
 * Política:
 * - TTL de 10 minutos por entrada
 * - Máximo de 1000 entradas (evicção da chave mais antiga ao exceder)
 */
export class CacheEmbeddingDecorator implements IAdapterEmbedding {
  private readonly cache = new Map<string, EntradaCacheEmbedding>();
  private static readonly TTL_MS = 10 * 60 * 1000;
  private static readonly MAX_ENTRADAS = 1000;

  constructor(private readonly adapter: IAdapterEmbedding) {}

  private obterDoCache(texto: string): number[] | null {
    const entrada = this.cache.get(texto);
    if (!entrada || Date.now() > entrada.expiraEm) {
      if (entrada) {
        this.cache.delete(texto);
      }
      return null;
    }
    return entrada.embedding;
  }

  private salvarNoCache(texto: string, embedding: number[]): void {
    if (this.cache.size >= CacheEmbeddingDecorator.MAX_ENTRADAS) {
      const primeiraChave = this.cache.keys().next().value;
      if (primeiraChave !== undefined) {
        this.cache.delete(primeiraChave);
      }
    }
    this.cache.set(texto, {
      embedding,
      expiraEm: Date.now() + CacheEmbeddingDecorator.TTL_MS,
    });
  }

  async gerarEmbedding(texto: string): Promise<number[]> {
    const cached = this.obterDoCache(texto);
    if (cached) {
      Logger.debug('[CacheEmbeddingDecorator] Cache hit embedding');
      return cached;
    }

    const embedding = await this.adapter.gerarEmbedding(texto);
    this.salvarNoCache(texto, embedding);
    return embedding;
  }

  async gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    // Delega ao adapter subjacente; preenche o cache com cada par texto→embedding.
    // Se o adapter não suportar lote, processa individualmente (aproveitando cache).
    if (!this.adapter.gerarEmbeddingsLote) {
      const resultados: number[][] = [];
      for (const texto of textos) {
        resultados.push(await this.gerarEmbedding(texto));
      }
      return resultados;
    }

    const resultados = await this.adapter.gerarEmbeddingsLote(textos);
    textos.forEach((texto, i) => {
      if (resultados[i]) {
        this.salvarNoCache(texto, resultados[i]);
      }
    });
    return resultados;
  }
}
