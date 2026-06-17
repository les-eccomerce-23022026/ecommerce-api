import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';

/**
 * Adapter para embeddings usando OpenAI API
 * 
 * Vantagens:
 * - API rápida e confiável
 * - Suporta múltiplos idiomas
 * - Embeddings de alta qualidade
 * - Modelo text-embedding-3-small: 1536 dimensões
 * 
 * Documentação: https://platform.openai.com/docs/guides/embeddings
 */
export class AdapterOpenAI implements IAdapterEmbedding {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/embeddings';
  private readonly cacheEmbedding = new Map<string, { embedding: number[]; expiraEm: number }>();
  private static readonly CACHE_EMBEDDING_TTL_MS = 10 * 60 * 1000;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no ambiente');
    }
    
    Logger.info('[AdapterOpenAI] Inicializado com API Key configurada');
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
    this.cacheEmbedding.set(texto, { embedding, expiraEm: Date.now() + AdapterOpenAI.CACHE_EMBEDDING_TTL_MS });
  }

  /**
   * Gera embedding para um texto usando OpenAI API
   */
  async gerarEmbedding(texto: string): Promise<number[]> {
    const cached = this.obterDoCacheEmbedding(texto);
    if (cached) {
      Logger.debug('[AdapterOpenAI] Cache hit embedding');
      return cached;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: texto,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Resposta inválida da API OpenAI');
      }

      const embedding = data.data[0].embedding as number[];

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Embedding inválido retornado pela API OpenAI');
      }

      this.salvarNoCacheEmbedding(texto, embedding);
      Logger.debug(`[AdapterOpenAI] Embedding gerado (dimensão: ${embedding.length})`);
      return embedding;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterOpenAI] Erro ao gerar embedding: ${mensagem}`);
      throw new Error(`Falha ao gerar embedding OpenAI: ${mensagem}`);
    }
  }

  /**
   * Gera embeddings em lote usando OpenAI API
   */
  async gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    try {
      const TAMANHO_LOTE = 100; // OpenAI suporta até 2048 textos por requisição
      
      Logger.info(`[AdapterOpenAI] Gerando ${textos.length} embeddings em lotes de ${TAMANHO_LOTE}...`);

      const resultados: number[][] = [];

      for (let i = 0; i < textos.length; i += TAMANHO_LOTE) {
        const lote = textos.slice(i, i + TAMANHO_LOTE);
        
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: lote,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Resposta inválida da API OpenAI');
        }

        for (let j = 0; j < data.data.length; j++) {
          const embedding = data.data[j].embedding as number[];
          
          if (!Array.isArray(embedding) || embedding.length === 0) {
            Logger.error(`[AdapterOpenAI] Embedding vazio para texto ${i + j}`);
            throw new Error(`Embedding inválido para texto ${i + j}`);
          }
          
          resultados.push(embedding);
          this.salvarNoCacheEmbedding(lote[j], embedding);
          Logger.debug(`[AdapterOpenAI] Embedding ${i + j + 1}/${textos.length} gerado (tamanho: ${embedding.length})`);
        }

        Logger.info(`[AdapterOpenAI] Lote ${Math.floor(i / TAMANHO_LOTE) + 1}/${Math.ceil(textos.length / TAMANHO_LOTE)} processado`);
      }

      if (resultados.length !== textos.length) {
        throw new Error('Quantidade de embeddings inválida');
      }

      Logger.info(`[AdapterOpenAI] ${resultados.length} embeddings gerados com sucesso`);
      return resultados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterOpenAI] Erro ao gerar embeddings em lote: ${mensagem}`);
      throw new Error(`Falha ao gerar embeddings em lote OpenAI: ${mensagem}`);
    }
  }

  /**
   * Valida se a API OpenAI está funcionando corretamente
   */
  async validarConexao(): Promise<boolean> {
    try {
      await this.gerarEmbedding('teste');
      Logger.info('[AdapterOpenAI] Validação de conexão bem-sucedida');
      return true;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterOpenAI] Falha na validação de conexão: ${mensagem}`);
      return false;
    }
  }

  /**
   * Retorna a dimensão do embedding (1536 para text-embedding-3-small)
   */
  getDimensao(): number {
    return 1536;
  }
}
