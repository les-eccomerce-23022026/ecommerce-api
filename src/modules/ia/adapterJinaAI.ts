import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';

/**
 * Adapter para embeddings usando Jina AI API
 * 
 * Vantagens:
 * - API rápida e confiável
 * - Suporta múltiplos idiomas
 * - Embeddings de alta qualidade
 * - Modelo jina-embeddings-v5-text-small: 512 dimensões
 * 
 * Documentação: https://jina.ai/embeddings
 */
export class AdapterJinaAI implements IAdapterEmbedding {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.jina.ai/v1/embeddings';
  private readonly cacheEmbedding = new Map<string, { embedding: number[]; expiraEm: number }>();
  private static readonly CACHE_EMBEDDING_TTL_MS = 10 * 60 * 1000;

  constructor() {
    this.apiKey = process.env.JINA_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('JINA_API_KEY não configurada no ambiente');
    }
    
    Logger.info('[AdapterJinaAI] Inicializado com API Key configurada');
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
    this.cacheEmbedding.set(texto, { embedding, expiraEm: Date.now() + AdapterJinaAI.CACHE_EMBEDDING_TTL_MS });
  }

  /**
   * Gera embedding para um texto usando Jina AI API
   */
  async gerarEmbedding(texto: string): Promise<number[]> {
    const cached = this.obterDoCacheEmbedding(texto);
    if (cached) {
      Logger.debug('[AdapterJinaAI] Cache hit embedding');
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
          model: 'jina-embeddings-v5-text-small',
          task: 'retrieval.query',
          normalized: true,
          input: [texto],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jina AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Resposta inválida da API Jina AI');
      }

      const embedding = data.data[0].embedding as number[];

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Embedding inválido retornado pela API Jina AI');
      }

      this.salvarNoCacheEmbedding(texto, embedding);
      Logger.debug(`[AdapterJinaAI] Embedding gerado (dimensão: ${embedding.length})`);
      return embedding;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterJinaAI] Erro ao gerar embedding: ${mensagem}`);
      throw new Error(`Falha ao gerar embedding Jina AI: ${mensagem}`);
    }
  }

  /**
   * Gera embeddings em lote usando Jina AI API
   * Limitado a 1 requisição por vez devido ao limite de concorrência da API (2/2)
   */
  async gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    try {
      const TAMANHO_LOTE = 1; // Limitado a 1 devido ao limite de concorrência da API Jina (2/2)
      const DELAY_ENTRE_REQUISICOES_MS = 500; // Delay entre requisições para evitar rate limiting
      
      Logger.info(`[AdapterJinaAI] Gerando ${textos.length} embeddings em lotes de ${TAMANHO_LOTE} com delay de ${DELAY_ENTRE_REQUISICOES_MS}ms...`);

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
            model: 'jina-embeddings-v5-text-small',
            task: 'retrieval.query',
            normalized: true,
            input: lote,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Jina AI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Resposta inválida da API Jina AI');
        }

        for (let j = 0; j < data.data.length; j++) {
          const embedding = data.data[j].embedding as number[];
          
          if (!Array.isArray(embedding) || embedding.length === 0) {
            Logger.error(`[AdapterJinaAI] Embedding vazio para texto ${i + j}`);
            throw new Error(`Embedding inválido para texto ${i + j}`);
          }
          
          resultados.push(embedding);
          this.salvarNoCacheEmbedding(lote[j], embedding);
          Logger.debug(`[AdapterJinaAI] Embedding ${i + j + 1}/${textos.length} gerado (tamanho: ${embedding.length})`);
        }

        Logger.info(`[AdapterJinaAI] Lote ${Math.floor(i / TAMANHO_LOTE) + 1}/${Math.ceil(textos.length / TAMANHO_LOTE)} processado`);

        // Delay entre requisições para evitar rate limiting
        if (i + TAMANHO_LOTE < textos.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_REQUISICOES_MS));
        }
      }

      if (resultados.length !== textos.length) {
        throw new Error('Quantidade de embeddings inválida');
      }

      Logger.info(`[AdapterJinaAI] ${resultados.length} embeddings gerados com sucesso`);
      return resultados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterJinaAI] Erro ao gerar embeddings em lote: ${mensagem}`);
      throw new Error(`Falha ao gerar embeddings em lote Jina AI: ${mensagem}`);
    }
  }

  /**
   * Valida se a API Jina AI está funcionando corretamente
   */
  async validarConexao(): Promise<boolean> {
    try {
      await this.gerarEmbedding('teste');
      Logger.info('[AdapterJinaAI] Validação de conexão bem-sucedida');
      return true;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterJinaAI] Falha na validação de conexão: ${mensagem}`);
      return false;
    }
  }

  /**
   * Retorna a dimensão do embedding (1024 para jina-embeddings-v5-text-small)
   */
  getDimensao(): number {
    return 1024;
  }
}
