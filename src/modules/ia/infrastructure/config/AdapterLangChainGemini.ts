import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from '../../domain/interfaces/IAdapterEmbedding';

/**
 * Modelos de embedding disponíveis no Google Generative AI
 * 
 * Referência: https://ai.google.dev/gemini-api/docs/models/gemini
 * 
 * Modelos disponíveis (2026):
 * - gemini-embedding-001: Recomendado (melhor custo-benefício), dimensão 768
 * - gemini-embedding-2: Para multimodal (texto + imagem), dimensão variável
 * - text-embedding-004: DESCONTINUADO (deprecated), não usar
 */
const EMBEDDING_MODELS = {
  GEMINI_EMBEDDING_001: 'gemini-embedding-001', // Recomendado - melhor custo-benefício
  GEMINI_EMBEDDING_2: 'gemini-embedding-2', // Multimodal - texto + imagem
  TEXT_EMBEDDING_004: 'text-embedding-004', // DESCONTINUADO - não usar
} as const;

/**
 * Lista de modelos para fallback em ordem de preferência
 */
const MODELS_FALLBACK = [
  'gemini-embedding-001', // Primeira opção
  'gemini-embedding-2', // Segunda opção (multimodal)
] as const;

/**
 * Adapter LangChain com Gemini Flash Lite
 * 
 * Responsável por integrar LangChain com a API do Gemini para:
 * - Geração de embeddings
 * - Geração de respostas de chat
 */
export class AdapterLangChainGemini implements IAdapterEmbedding {
  private embeddings: GoogleGenerativeAIEmbeddings | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private modeloAtual: string | null = null;

  constructor() {
    // Valida variável de ambiente obrigatória (regra U3)
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está definida nas variáveis de ambiente');
    }
  }

  /**
   * Inicializa o cliente de embeddings com sistema de fallback
   * Tenta o modelo configurado, se falhar, tenta os modelos de fallback
   */
  private async inicializarEmbeddings(): Promise<GoogleGenerativeAIEmbeddings> {
    if (this.embeddings) {
      return this.embeddings;
    }

    // Modelo configurado ou padrão (gemini-embedding-001)
    const modeloConfigurado = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
    
    // Lista de modelos para tentar (configurado + fallbacks)
    const modelosParaTentar = [modeloConfigurado, ...MODELS_FALLBACK];
    const modelosUnicos = Array.from(new Set(modelosParaTentar)); // Remove duplicatas

    Logger.info(`[AdapterLangChainGemini] Tentando inicializar embeddings. Modelos para tentar: ${modelosUnicos.join(', ')}`);

    for (const modelo of modelosUnicos) {
      try {
        Logger.info(`[AdapterLangChainGemini] Tentando modelo: ${modelo}`);
        
        this.embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GEMINI_API_KEY,
          modelName: modelo,
        });

        // Testa se o modelo funciona gerando um embedding de teste
        const teste = await this.embeddings.embedQuery('teste');
        
        if (!Array.isArray(teste) || teste.length === 0) {
          throw new Error('Embedding de teste retornou array vazio');
        }

        this.modeloAtual = modelo;
        Logger.info(`[AdapterLangChainGemini] Embeddings inicializados com sucesso usando modelo ${modelo} (dimensão: ${teste.length})`);
        return this.embeddings;

      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        Logger.warn(`[AdapterLangChainGemini] Falha ao usar modelo ${modelo}: ${mensagem}`);
        this.embeddings = null; // Limpa para tentar próximo modelo
      }
    }

    // Se todos os modelos falharem
    throw new Error('Não foi possível inicializar embeddings com nenhum dos modelos disponíveis. Verifique a API Key e a conexão com a Google.');
  }

  /**
   * Inicializa o cliente generativo do Gemini
   */
  private inicializarGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      Logger.info('[AdapterLangChainGemini] GenAI inicializado');
    }
    return this.genAI;
  }

  /**
   * Gera embedding para um texto
   */
  async gerarEmbedding(texto: string): Promise<number[]> {
    try {
      const embeddings = await this.inicializarEmbeddings();
      const resultado = await embeddings.embedQuery(texto);
      
      if (!Array.isArray(resultado) || resultado.length === 0) {
        throw new Error('Embedding inválido retornado pelo Gemini');
      }

      return resultado;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Erro ao gerar embedding: ${mensagem}`);
      throw new Error(`Falha ao gerar embedding: ${mensagem}`);
    }
  }

  /**
   * Gera embeddings em lote
   * NOTA: O método embedDocuments do LangChain pode ter problemas com Gemini,
   * então usamos embedQuery em loop para garantir compatibilidade.
   */
  async gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.inicializarEmbeddings();
      const resultados: number[][] = [];
      
      Logger.info(`[AdapterLangChainGemini] Gerando ${textos.length} embeddings individualmente com modelo ${this.modeloAtual}...`);
      
      for (let i = 0; i < textos.length; i++) {
        const embedding = await embeddings.embedQuery(textos[i]);
        
        if (!Array.isArray(embedding) || embedding.length === 0) {
          Logger.error(`[AdapterLangChainGemini] Embedding vazio para texto ${i}: ${textos[i].substring(0, 50)}...`);
          throw new Error(`Embedding inválido para texto ${i}`);
        }
        
        resultados.push(embedding);
        Logger.debug(`[AdapterLangChainGemini] Embedding ${i + 1}/${textos.length} gerado (tamanho: ${embedding.length})`);
      }
      
      if (resultados.length !== textos.length) {
        throw new Error('Quantidade de embeddings inválida');
      }

      Logger.info(`[AdapterLangChainGemini] ${resultados.length} embeddings gerados com sucesso`);
      return resultados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Erro ao gerar embeddings em lote: ${mensagem}`);
      throw new Error(`Falha ao gerar embeddings em lote: ${mensagem}`);
    }
  }

  /**
   * Gera resposta de chat com contexto
   * NOTA: Funcionalidade temporariamente desabilitada devido a limitações da API key
   * TODO: Reimplementar quando tivermos acesso a modelos de chat adequados
   */
  async gerarRespostaChat(
    pergunta: string,
    contexto: string,
    historicoConversa?: { papel: 'user' | 'model'; conteudo: string }[]
  ): Promise<string> {
    // Por enquanto, retorna uma resposta baseada no contexto sem usar IA
    try {
      Logger.warn('[AdapterLangChainGemini] Chat desabilitado temporariamente, usando resposta base');
      
      // Extrai informações dos livros do contexto
      const livrosEncontrados = this.extrairLivrosDoContexto(contexto);
      
      if (livrosEncontrados.length === 0) {
        return 'Não encontrei livros correspondentes à sua solicitação no momento.';
      }
      
      const resposta = `Com base no que você está procurando, recomendo os seguintes livros:\n\n${
        livrosEncontrados.slice(0, 3).map((livro, i) => 
          `${i + 1}. "${livro.titulo}" de ${livro.autor} - R$ ${livro.preco.toFixed(2)}`
        ).join('\n')
      }\n\nEssas recomendações são baseadas em análise semântica do seu pedido.`;
      
      return resposta;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Erro ao gerar resposta de chat: ${mensagem}`);
      throw new Error(`Falha ao gerar resposta de chat: ${mensagem}`);
    }
  }

  /**
   * Extrai informações de livros do contexto
   */
  private extrairLivrosDoContexto(contexto: string): Array<{ titulo: string; autor: string; preco: number }> {
    const livros: Array<{ titulo: string; autor: string; preco: number }> = [];
    
    // Padrão regex para extrair informações de livros do contexto
    const regex = /(\d+)\.\s*"([^"]+)"\s+de\s+([^()]+)\s+\([^)]+R\$\s+([\d.,]+)/g;
    
    let match;
    while ((match = regex.exec(contexto)) !== null) {
      livros.push({
        titulo: match[2],
        autor: match[3].trim(),
        preco: parseFloat(match[4].replace(',', '.')),
      });
    }
    
    return livros;
  }

  /**
   * Valida se a API key está configurada corretamente
   */
  async validarConexao(): Promise<boolean> {
    try {
      await this.gerarEmbedding('teste');
      return true;
    } catch (erro) {
      Logger.error('[AdapterLangChainGemini] Falha na validação de conexão');
      return false;
    }
  }
}