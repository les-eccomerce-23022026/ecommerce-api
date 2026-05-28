import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Adapter LangChain com Gemini Flash Lite
 * 
 * Responsável por integrar LangChain com a API do Gemini para:
 * - Geração de embeddings
 * - Geração de respostas de chat
 */
export class AdapterLangChainGemini {
  private embeddings: GoogleGenerativeAIEmbeddings | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private readonly modelName: string;

  constructor() {
    // Valida variável de ambiente obrigatória (regra U3)
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está definida nas variáveis de ambiente');
    }

    this.modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash-lite';
  }

  /**
   * Inicializa o cliente de embeddings
   */
  private inicializarEmbeddings(): GoogleGenerativeAIEmbeddings {
    if (!this.embeddings) {
      this.embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: this.modelName,
      });
      Logger.info('[AdapterLangChainGemini] Embeddings inicializados');
    }
    return this.embeddings;
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
      const embeddings = this.inicializarEmbeddings();
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
   */
  async gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    try {
      const embeddings = this.inicializarEmbeddings();
      const resultados = await embeddings.embedDocuments(textos);
      
      if (!Array.isArray(resultados) || resultados.length !== textos.length) {
        throw new Error('Quantidade de embeddings inválida');
      }

      return resultados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Erro ao gerar embeddings em lote: ${mensagem}`);
      throw new Error(`Falha ao gerar embeddings em lote: ${mensagem}`);
    }
  }

  /**
   * Gera resposta de chat com contexto
   */
  async gerarRespostaChat(
    pergunta: string,
    contexto: string,
    historicoConversa?: { papel: 'user' | 'model'; conteudo: string }[]
  ): Promise<string> {
    try {
      const genAI = this.inicializarGenAI();
      const modelo = genAI.getGenerativeModel({ model: this.modelName });

      // Constrói o prompt com contexto
      const promptSistema = `Você é um assistente de recomendação de livros especializado.
Use o contexto fornecido para responder às perguntas do usuário.
Contexto: ${contexto}

Regras:
- Recomende apenas livros que existem no contexto
- Se não encontrar informações relevantes, diga que não sabe
- Seja conciso e direto nas respostas
- Use linguagem natural e amigável`;

      const chat = modelo.startChat({
        history: historicoConversa?.map((msg) => ({
          role: msg.papel === 'user' ? 'user' : 'model',
          parts: [{ text: msg.conteudo }],
        })) || [],
        systemInstruction: promptSistema,
      });

      const resultado = await chat.sendMessage(pergunta);
      const resposta = resultado.response.text();

      return resposta;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Erro ao gerar resposta de chat: ${mensagem}`);
      throw new Error(`Falha ao gerar resposta de chat: ${mensagem}`);
    }
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