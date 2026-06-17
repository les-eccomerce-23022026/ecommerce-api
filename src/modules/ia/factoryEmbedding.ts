import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';
import { AdapterLangChainGemini } from './adapterLangChainGemini';
import { AdapterHuggingFaceLocal } from './adapterHuggingFaceLocal';
import { AdapterJinaAI } from './adapterJinaAI';
import { AdapterOpenAI } from './adapterOpenAI';
import { CacheEmbeddingDecorator } from './cacheEmbeddingDecorator';

/**
 * Fábrica para criar o adapter de embedding apropriado
 * baseado na variável de ambiente EMBEDDING_PROVIDER
 * 
 * Provedores disponíveis:
 * - gemini: Usa Google Generative AI (requer API key, 768 dimensões)
 * - huggingface_local: Usa modelo local do HuggingFace (grátis, sem API key, 384 dimensões)
 * - jina: Usa Jina AI API (requer API key, 1024 dimensões)
 * - openai: Usa OpenAI API (requer API key, 1536 dimensões)
 */
export class FactoryEmbedding {
  private static instancia: IAdapterEmbedding | null = null;
  private static provedorAtual: string | null = null;

  /**
   * Retorna a instância do adapter de embedding
   * Recria instância se o provedor mudou
   */
  static obterInstancia(): IAdapterEmbedding {
    const provedor = process.env.EMBEDDING_PROVIDER || 'huggingface_local';
    
    // Se o provedor mudou, recria a instância
    if (this.provedorAtual !== provedor) {
      Logger.info(`[FactoryEmbedding] Provedor mudou de ${this.provedorAtual} para ${provedor}, recriando instância`);
      this.instancia = null;
      this.provedorAtual = provedor;
    }
    
    if (this.instancia) {
      return this.instancia;
    }

    Logger.info(`[FactoryEmbedding] Inicializando provedor de embedding: ${provedor}`);

    let adapterBase: IAdapterEmbedding;
    switch (provedor) {
      case 'huggingface_local':
        Logger.info('[FactoryEmbedding] Usando embedding local do HuggingFace (grátis, sem API key, 384 dimensões)');
        adapterBase = new AdapterHuggingFaceLocal();
        break;

      case 'jina':
        Logger.info('[FactoryEmbedding] Usando embedding do Jina AI (requer API key, 1024 dimensões)');
        adapterBase = new AdapterJinaAI();
        break;

      case 'openai':
        Logger.info('[FactoryEmbedding] Usando embedding do OpenAI (requer API key, 1536 dimensões)');
        adapterBase = new AdapterOpenAI();
        break;

      case 'gemini':
      default:
        Logger.info('[FactoryEmbedding] Usando embedding do Gemini (requer API key, 768 dimensões)');
        adapterBase = new AdapterLangChainGemini();
        break;
    }

    // Cache universal de embeddings: qualquer provedor é embrulhado pelo decorator,
    // garantindo TTL/evicção únicos (evita cache duplicado por adapter). Task 1.
    this.instancia = new CacheEmbeddingDecorator(adapterBase);

    return this.instancia;
  }

  /**
   * Retorna a instância do adapter de chat LLM (sempre Gemini)
   * Usado para operações de chat que não são embeddings
   */
  static obterInstanciaChatLLM(): AdapterLangChainGemini {
    Logger.info('[FactoryEmbedding] Usando Gemini para chat LLM');
    return new AdapterLangChainGemini();
  }

  /**
   * Reseta a instância (útil para testes)
   */
  static resetarInstancia(): void {
    this.instancia = null;
    Logger.info('[FactoryEmbedding] Instância resetada');
  }
}
