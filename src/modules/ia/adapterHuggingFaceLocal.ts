import { pipeline, env } from '@xenova/transformers';
import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';

/**
 * Configuração para usar embeddings locais sem baixar modelos automaticamente
 * Os modelos serão baixados apenas quando necessário
 */
env.allowLocalModels = false;
env.allowRemoteModels = true;

/**
 * Modelos de embedding locais disponíveis (HuggingFace)
 * 
 * Referência: https://huggingface.co/sentence-transformers
 * 
 * Modelos disponíveis:
 * - paraphrase-multilingual-MiniLM-L12-v2: Multilíngue (50+ idiomas), 384 dimensões, ~120MB, RECOMENDADO para português
 * - all-MiniLM-L6-v2: Inglês apenas, 384 dimensões, ~80MB, mais leve mas não suporta português bem
 * - paraphrase-multilingual-mpnet-base-v2: Multilíngue, 768 dimensões, ~470MB, melhor qualidade mas mais pesado
 */
const EMBEDDING_MODELS = {
  PARAPHRASE_MULTILINGUAL_MINILM_L12_V2: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', // RECOMENDADO - português + leve
  ALL_MINILM_L6_V2: 'Xenova/all-MiniLM-L6-v2', // Inglês apenas - mais leve
  PARAPHRASE_MULTILINGUAL_MPNET_BASE_V2: 'Xenova/paraphrase-multilingual-mpnet-base-v2', // Melhor qualidade - mais pesado
} as const;

/**
 * Adapter para embeddings locais do HuggingFace usando @xenova/transformers
 * 
 * Vantagens:
 * - 100% local e grátis (sem API key)
 * - Suporta português nativamente (modelo multilíngue)
 * - Muito leve: ~120MB vs API externas
 * - 384 dimensões (menor que Gemini de 768)
 * - Funciona offline após download inicial
 * 
 * Modelo padrão: paraphrase-multilingual-MiniLM-L12-v2
 * - 384 dimensões
 * - Suporta 50+ idiomas incluindo português
 * - ~120MB de tamanho
 * - Otimizado para recursos baixos
 */
export class AdapterHuggingFaceLocal implements IAdapterEmbedding {
  private featureExtractor: any = null;
  private modeloAtual: string | null = null;
  private readonly cacheEmbedding = new Map<string, { embedding: number[]; expiraEm: number }>();
  private static readonly CACHE_EMBEDDING_TTL_MS = 10 * 60 * 1000;
  private inicializando = false;

  constructor() {
    // Configurar modelo padrão
    this.modeloAtual = process.env.HUGGINGFACE_EMBEDDING_MODEL || EMBEDDING_MODELS.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2;
    Logger.info(`[AdapterHuggingFaceLocal] Configurado para usar modelo: ${this.modeloAtual}`);
  }

  /**
   * Inicializa o extractor de embeddings local
   * Baixa o modelo na primeira execução (~120MB)
   */
  private async inicializarExtractor(): Promise<any> {
    if (this.featureExtractor) {
      return this.featureExtractor;
    }

    if (this.inicializando) {
      // Aguardar inicialização em andamento
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.inicializarExtractor();
    }

    this.inicializando = true;

    try {
      Logger.info(`[AdapterHuggingFaceLocal] Baixando/inicializando modelo ${this.modeloAtual}...`);
      Logger.info('[AdapterHuggingFaceLocal] Isso pode levar alguns minutos na primeira execução (~120MB)');

      this.featureExtractor = await pipeline(
        'feature-extraction',
        this.modeloAtual!,
        {
          quantized: true, // Usa modelo quantizado para menor uso de memória
        }
      );

      Logger.info(`[AdapterHuggingFaceLocal] Modelo ${this.modeloAtual} inicializado com sucesso`);
      this.inicializando = false;
      return this.featureExtractor;
    } catch (erro) {
      this.inicializando = false;
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterHuggingFaceLocal] Erro ao inicializar modelo: ${mensagem}`);
      throw new Error(`Falha ao inicializar embedding local: ${mensagem}`);
    }
  }

  private obterDoCacheEmbedding(texto: string): number[] | null {
    const entrada = this.cacheEmbedding.get(texto);
    if (!entrada || Date.now() > entrada.expiraEm) {
      this.cacheEmbedding.delete(texto);
      return null;
    }
    return entrada.embedding;
  }

  private salvarNoCacheEmbedding(texto: string, embedding: number[]): void {
    if (this.cacheEmbedding.size > 1000) {
      const primeiraChave = this.cacheEmbedding.keys().next().value;
      if (primeiraChave) this.cacheEmbedding.delete(primeiraChave);
    }
    this.cacheEmbedding.set(texto, { embedding, expiraEm: Date.now() + AdapterHuggingFaceLocal.CACHE_EMBEDDING_TTL_MS });
  }

  /**
   * Gera embedding para um texto usando modelo local
   */
  async gerarEmbedding(texto: string): Promise<number[]> {
    const cached = this.obterDoCacheEmbedding(texto);
    if (cached) {
      Logger.debug('[AdapterHuggingFaceLocal] Cache hit embedding');
      return cached;
    }

    try {
      const extractor = await this.inicializarExtractor();
      const output = await extractor(texto, {
        pooling: 'mean',
        normalize: true,
      });

      // O output é um tensor, convertemos para array
      const embedding = Array.from(output.data) as number[];

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Embedding inválido retornado pelo modelo local');
      }

      this.salvarNoCacheEmbedding(texto, embedding);
      Logger.debug(`[AdapterHuggingFaceLocal] Embedding gerado (dimensão: ${embedding.length})`);
      return embedding;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterHuggingFaceLocal] Erro ao gerar embedding: ${mensagem}`);
      throw new Error(`Falha ao gerar embedding: ${mensagem}`);
    }
  }

  /**
   * Gera embeddings em lote usando modelo local
   * Processa em lotes para otimizar uso de memória
   */
  async gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    try {
      const extractor = await this.inicializarExtractor();
      const resultados: number[][] = [];
      const TAMANHO_LOTE = 10; // Processa em lotes de 10 para não sobrecarregar memória

      Logger.info(`[AdapterHuggingFaceLocal] Gerando ${textos.length} embeddings em lotes de ${TAMANHO_LOTE}...`);

      for (let i = 0; i < textos.length; i += TAMANHO_LOTE) {
        const lote = textos.slice(i, i + TAMANHO_LOTE);
        const saidas = await extractor(lote, {
          pooling: 'mean',
          normalize: true,
        });

        // Converter cada tensor do lote para array
        for (let j = 0; j < lote.length; j++) {
          const embedding = Array.from(saidas[j].data) as number[];
          
          if (!Array.isArray(embedding) || embedding.length === 0) {
            Logger.error(`[AdapterHuggingFaceLocal] Embedding vazio para texto ${i + j}: ${lote[j].substring(0, 50)}...`);
            throw new Error(`Embedding inválido para texto ${i + j}`);
          }
          
          resultados.push(embedding);
          Logger.debug(`[AdapterHuggingFaceLocal] Embedding ${i + j + 1}/${textos.length} gerado (tamanho: ${embedding.length})`);
        }

        Logger.info(`[AdapterHuggingFaceLocal] Lote ${Math.floor(i / TAMANHO_LOTE) + 1}/${Math.ceil(textos.length / TAMANHO_LOTE)} processado`);
      }

      if (resultados.length !== textos.length) {
        throw new Error('Quantidade de embeddings inválida');
      }

      Logger.info(`[AdapterHuggingFaceLocal] ${resultados.length} embeddings gerados com sucesso`);
      return resultados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterHuggingFaceLocal] Erro ao gerar embeddings em lote: ${mensagem}`);
      throw new Error(`Falha ao gerar embeddings em lote: ${mensagem}`);
    }
  }

  /**
   * Valida se o modelo está funcionando corretamente
   */
  async validarConexao(): Promise<boolean> {
    try {
      await this.gerarEmbedding('teste');
      Logger.info('[AdapterHuggingFaceLocal] Validação de conexão bem-sucedida');
      return true;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterHuggingFaceLocal] Falha na validação de conexão: ${mensagem}`);
      return false;
    }
  }

  /**
   * Retorna a dimensão do embedding (384 para o modelo padrão)
   */
  getDimensao(): number {
    return 384;
  }
}
