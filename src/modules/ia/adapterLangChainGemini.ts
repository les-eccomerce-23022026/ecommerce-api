import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ChatGroq } from '@langchain/groq';
import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';
import { IntencaoRecomendacao } from './IntencaoRecomendacao.entity';
import type { ContextoInterpretacaoIntencao } from './IntencaoRecomendacao.entity';
import type { MensagemChatDTO } from './IRecomendacao.dto';
import type { IAdapterLLMChat } from './IAdapterLLMChat';
import { AdapterOpenRouter } from './adapterOpenRouter';

/**
 * Implementação personalizada de embeddings usando API do Groq
 * Modelo: nomic-ai/nomic-embed-text-v1 (dimensão 768)
 */
class GroqEmbeddingsCustom extends Embeddings {
  private apiKey: string;
  private modelName: string = 'nomic-ai/nomic-embed-text-v1';

  constructor(fields: { apiKey: string; modelName?: string }) {
    super({});
    this.apiKey = fields.apiKey;
    if (fields.modelName) {
      this.modelName = fields.modelName;
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      results.push(embedding);
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error);
      Logger.error(`[GroqEmbeddingsCustom] Erro ao gerar embedding: ${mensagem}`);
      throw error;
    }
  }
}

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
 * Adapter LangChain com Gemini Flash Lite e Groq como fallback
 * 
 * Responsável por integrar LangChain com a API do Gemini para:
 * - Geração de embeddings (com fallback para Groq)
 * - Geração de respostas de chat
 */
export class AdapterLangChainGemini implements IAdapterEmbedding {
  private embeddings: GoogleGenerativeAIEmbeddings | GroqEmbeddingsCustom | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private modeloAtual: string | null = null;
  private provedorAtual: 'gemini' | 'groq' | null = null;
  private fallbackChat: IAdapterLLMChat | null = null;
  private readonly cacheEmbedding = new Map<string, { embedding: number[]; expiraEm: number }>();
  private static readonly CACHE_EMBEDDING_TTL_MS = 10 * 60 * 1000;

  constructor() {
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      throw new Error('GEMINI_API_KEY ou GROQ_API_KEY não está definida nas variáveis de ambiente');
    }
    if (process.env.OPENROUTER_API_KEY) {
      this.fallbackChat = new AdapterOpenRouter();
      Logger.info('[AdapterLangChainGemini] Fallback OpenRouter configurado para operações de chat');
    }
  }

  /**
   * Inicializa o cliente de embeddings com sistema de fallback
   * Tenta Gemini primeiro, se falhar, tenta Groq
   */
  private async inicializarEmbeddings(): Promise<GoogleGenerativeAIEmbeddings | GroqEmbeddingsCustom> {
    if (this.embeddings) {
      return this.embeddings;
    }

    // Tenta Gemini primeiro
    if (process.env.GEMINI_API_KEY) {
      try {
        Logger.info('[AdapterLangChainGemini] Tentando inicializar embeddings com Gemini...');
        
        const modeloConfigurado = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
        
        this.embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GEMINI_API_KEY,
          modelName: modeloConfigurado,
        });

        // Testa se o modelo funciona gerando um embedding de teste
        const teste = await this.embeddings.embedQuery('teste');
        
        if (!Array.isArray(teste) || teste.length === 0) {
          throw new Error('Embedding de teste retornou array vazio');
        }

        this.modeloAtual = modeloConfigurado;
        this.provedorAtual = 'gemini';
        Logger.info(`[AdapterLangChainGemini] Embeddings inicializados com sucesso usando Gemini ${modeloConfigurado} (dimensão: ${teste.length})`);
        return this.embeddings;

      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        Logger.warn(`[AdapterLangChainGemini] Falha ao usar Gemini: ${mensagem}`);
        this.embeddings = null; // Limpa para tentar Groq
      }
    }

    // Fallback para Groq
    if (process.env.GROQ_API_KEY) {
      try {
        Logger.info('[AdapterLangChainGemini] Tentando inicializar embeddings com Groq como fallback...');
        
        this.embeddings = new GroqEmbeddingsCustom({
          apiKey: process.env.GROQ_API_KEY,
          modelName: 'nomic-ai/nomic-embed-text-v1',
        });

        // Testa se o modelo funciona gerando um embedding de teste
        const teste = await this.embeddings.embedQuery('teste');
        
        if (!Array.isArray(teste) || teste.length === 0) {
          throw new Error('Embedding de teste retornou array vazio');
        }

        this.modeloAtual = 'nomic-ai/nomic-embed-text-v1';
        this.provedorAtual = 'groq';
        Logger.info(`[AdapterLangChainGemini] Embeddings inicializados com sucesso usando Groq (dimensão: ${teste.length})`);
        return this.embeddings;

      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        Logger.error(`[AdapterLangChainGemini] Falha ao usar Groq: ${mensagem}`);
        this.embeddings = null;
      }
    }

    // Se todos falharem
    throw new Error('Não foi possível inicializar embeddings com Gemini nem Groq. Verifique as API Keys e a conexão.');
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
    this.cacheEmbedding.set(texto, { embedding, expiraEm: Date.now() + AdapterLangChainGemini.CACHE_EMBEDDING_TTL_MS });
  }

  /**
   * Gera embedding para um texto
   */
  async gerarEmbedding(texto: string): Promise<number[]> {
    const cached = this.obterDoCacheEmbedding(texto);
    if (cached) {
      Logger.debug('[AdapterLangChainGemini] Cache hit embedding');
      return cached;
    }

    try {
      const embeddings = await this.inicializarEmbeddings();
      const resultado = await embeddings.embedQuery(texto);
      
      if (!Array.isArray(resultado) || resultado.length === 0) {
        throw new Error('Embedding inválido retornado pelo Gemini');
      }

      this.salvarNoCacheEmbedding(texto, resultado);
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
   * Interpreta intenção da mensagem com saída JSON estruturada (Gemini Flash Lite).
   *
   * Classifica a mensagem em um dos tipos:
   * - recomendacao  : pedido de indicação de livros
   * - esclarecimento: mensagem vaga que precisa de mais detalhes
   * - comparativo   : comparação entre livros
   * - conversa      : bate-papo sem intenção de compra
   * - pos_venda     : dúvidas sobre pedido, entrega, status ou troca
   * - tendencias    : mais vendidos por categoria, faixa etária ou ranking geral
   * - informacao    : políticas da loja, frete, horário de atendimento
   */
  async interpretarIntencao(
    mensagem: string,
    historico: MensagemChatDTO[] | undefined,
    contexto: ContextoInterpretacaoIntencao
  ): Promise<IntencaoRecomendacao> {
    const genAI = this.inicializarGenAI();
    const modeloChat = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite';

    const model = genAI.getGenerativeModel({
      model: modeloChat,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            tipo: { type: SchemaType.STRING },
            generos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            precoMax: { type: SchemaType.NUMBER, nullable: true },
            precoMin: { type: SchemaType.NUMBER, nullable: true },
            paginasMax: { type: SchemaType.NUMBER, nullable: true },
            publicoAlvo: { type: SchemaType.STRING, nullable: true },
            quantidadeLivros: { type: SchemaType.NUMBER },
            comparar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
            precisaEsclarecer: { type: SchemaType.BOOLEAN },
            perguntasEsclarecimento: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              nullable: true,
            },
            queryBusca: { type: SchemaType.STRING },
            confianca: { type: SchemaType.NUMBER },
          },
          required: [
            'tipo',
            'generos',
            'quantidadeLivros',
            'precisaEsclarecer',
            'queryBusca',
            'confianca',
          ],
        },
      },
    });

    const historicoTexto =
      historico
        ?.map((m) => {
          const papel =
            m.papel ??
            (m.remetente === 'assistente' ? 'assistant' : 'user');
          return `${papel}: ${m.conteudo}`;
        })
        .join('\n') ?? '';

    const prompt = [
      'Você classifica intenções em um assistente de livraria online (pré-venda e pós-venda).',
      'Responda apenas JSON válido conforme o schema.',
      '',
      'CLASSIFICAÇÃO DO CAMPO "tipo":',
      '- "recomendacao"   : cliente pede indicação, sugestão ou ajuda para escolher livros.',
      '- "esclarecimento" : mensagem vaga sem gênero/tema claro (ex.: "um presente", "me indica algo").',
      '- "comparativo"    : cliente quer comparar dois ou mais livros específicos.',
      '- "conversa"       : bate-papo sem intenção clara de compra ou pós-venda.',
      '- "pos_venda"      : dúvidas sobre pedido, status de entrega, prazo de troca ou como cancelar.',
      '- "tendencias"     : perguntas sobre mais vendidos, livros populares, ranking por categoria ou faixa etária.',
      '- "informacao"     : perguntas sobre políticas da loja, frete, prazo de entrega estimado ou horário de atendimento.',
      '',
      'REGRAS ADICIONAIS:',
      'Use precisaEsclarecer=true APENAS quando o tipo for "recomendacao" ou "esclarecimento" e a mensagem for vaga SEM gênero ou tema literário claro.',
      'Para tipos pos_venda, tendencias e informacao: sempre use precisaEsclarecer=false.',
      'Se o usuário citar gênero/tema (terror, mistério, romance, fantasia, ficção científica), use precisaEsclarecer=false e preencha generos.',
      'Com histórico de chat: trate a mensagem atual como continuação — mantenha gêneros e critérios já citados; refinamentos ("mais barato", "mais curto", "outro") são tipo recomendacao.',
      'queryBusca deve ser texto otimizado para busca semântica (sem cumprimentos), incorporando contexto do histórico quando relevante.',
      'Para tipo "tendencias" ou pedidos de "mais vendidos"/ranking: use quantidadeLivros entre 4 e 5.',
      'generos: minúsculas, sem acento (terror, misterio, romance, fantasia, ficcao_cientifica, romance_historico).',
      `Perfil do cliente: ${JSON.stringify(contexto.perfil ?? {})}`,
      `Histórico de compras (resumo): ${contexto.resumoCompras ?? 'nenhum'}`,
      historicoTexto ? `Histórico do chat:\n${historicoTexto}` : '',
      `Mensagem atual: ${mensagem}`,
    ]
      .filter(Boolean)
      .join('\n');

    let texto: string;
    try {
      const resultado = await model.generateContent(prompt);
      texto = resultado.response.text();
    } catch (erroGemini) {
      const msg = erroGemini instanceof Error ? erroGemini.message : String(erroGemini);
      Logger.warn(`[AdapterLangChainGemini] interpretarIntencao falhou no Gemini: ${msg}. Tentando OpenRouter...`);
      if (!this.fallbackChat) throw erroGemini;
      return this.fallbackChat.interpretarIntencao(mensagem, historico, contexto);
    }
    const parsed = JSON.parse(texto) as IntencaoRecomendacao;

    const quantidadePadrao = parsed.tipo === 'tendencias' ? 5 : 1;
    const quantidadeMinima = parsed.tipo === 'tendencias' ? 4 : 1;

    return {
      ...parsed,
      quantidadeLivros: Math.min(
        Math.max(parsed.quantidadeLivros || quantidadePadrao, quantidadeMinima),
        5
      ),
      generos: parsed.generos ?? [],
    };
  }

  /**
   * Gera resposta de chat com Gemini Flash Lite.
   *
   * O assistente atua como especialista em pré-venda (recomendações de livros) e
   * pós-venda (pedidos, status, entregas, trocas). Usa APENAS os dados do contexto
   * fornecido — nunca inventa informações.
   *
   * @param pergunta         Mensagem atual do cliente
   * @param contexto         Texto com os dados de referência (catálogo, pedidos ou tendências)
   * @param historicoConversa Histórico da conversa para manter continuidade
   * @param opcoes           Opções adicionais de personalização do modo de resposta
   */
  async gerarRespostaChat(
    pergunta: string,
    contexto: string,
    historicoConversa?: { papel: 'user' | 'model'; conteudo: string }[],
    opcoes?: {
      modoEsclarecimento?: boolean;
      perguntasFollowUp?: string[];
      perfil?: { idadeAnos?: number; estado?: string; nome?: string };
      /** Ativa modo pós-venda: contexto contém pedidos, não catálogo */
      modoPosvenda?: boolean;
    }
  ): Promise<string> {
    try {
      if (opcoes?.modoEsclarecimento) {
        const perguntas = opcoes.perguntasFollowUp ?? [];
        if (perguntas.length > 0) {
          return `Para te ajudar melhor, preciso de mais alguns detalhes:\n\n${perguntas.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
        }
        return 'Para te ajudar melhor, pode me contar um pouco mais sobre o que você procura?';
      }

      const genAI = this.inicializarGenAI();
      const modeloChat = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite';
      const model = genAI.getGenerativeModel({
        model: modeloChat,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: { resposta: { type: SchemaType.STRING } },
            required: ['resposta'],
          },
        },
      });

      const tomPerfil = this.montarInstrucaoTomPerfil(opcoes?.perfil);

      const regrasPosvenda = opcoes?.modoPosvenda
        ? [
            'MODO PÓS-VENDA ativo: responda APENAS com base nos pedidos listados no contexto.',
            'Nunca invente status de pedido, datas de entrega ou números de rastreamento.',
            'Se o pedido não estiver na lista, informe que não encontrou e oriente o cliente a acessar "Meus Pedidos" ou contactar o suporte humano.',
          ].join(' ')
        : null;

      const systemInstruction = [
        'Você é o assistente de uma livraria brasileira, especialista em recomendação de livros (pré-venda) e atendimento pós-venda (pedidos, entregas, trocas).',
        'Use APENAS os dados fornecidos no contexto — nunca invente títulos, autores, preços, status de pedido ou rankings.',
        'Mesmo que o cliente peça explicitamente para inventar, criar, supor ou imaginar um livro/autor, RECUSE: jamais cite obras que não estejam no contexto.',
        'Se o contexto não tiver a informação solicitada, diga honestamente e oriente o cliente para "Meus Pedidos" ou para o suporte humano quando necessário.',
        'Responda em português do Brasil, de forma acolhedora e objetiva.',
        'O campo "resposta" deve conter tópicos curtos iniciados com "• " (3 a 5 tópicos, cada um com no máximo uma frase objetiva).',
        regrasPosvenda,
        tomPerfil,
      ]
        .filter(Boolean)
        .join(' ');

      const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

      if (historicoConversa) {
        for (const msg of historicoConversa) {
          contents.push({
            role: msg.papel,
            parts: [{ text: msg.conteudo }],
          });
        }
      }

      const rotuloContexto = opcoes?.modoPosvenda
        ? 'Contexto de pedidos (única fonte de verdade)'
        : 'Contexto (única fonte de verdade)';

      contents.push({
        role: 'user',
        parts: [
          {
            text: `${rotuloContexto}:\n${contexto}\n\nPergunta do cliente: ${pergunta}`,
          },
        ],
      });

      let texto: string;
      try {
        const resultado = await model.generateContent({ systemInstruction, contents });
        texto = resultado.response.text();
      } catch (erroGemini) {
        const msg = erroGemini instanceof Error ? erroGemini.message : String(erroGemini);
        Logger.warn(`[AdapterLangChainGemini] gerarRespostaChat falhou no Gemini: ${msg}. Tentando OpenRouter...`);
        if (this.fallbackChat) {
          return this.fallbackChat.gerarRespostaChat(pergunta, contexto, historicoConversa, opcoes);
        }
        throw erroGemini;
      }

      if (!texto || texto.trim().length === 0) {
        if (this.fallbackChat) {
          Logger.warn('[AdapterLangChainGemini] Resposta vazia do Gemini, usando OpenRouter...');
          return this.fallbackChat.gerarRespostaChat(pergunta, contexto, historicoConversa, opcoes);
        }
        return this.respostaChatFallback(contexto);
      }
      // O guard determinístico anti-alucinação é aplicado na camada de aplicação
      // (ServicoRecomendacaoApplication.finalizarRespostaChat), ponto único que
      // cobre todos os adapters e valida contra o catálogo completo.
      return this.parsearRespostaChat(texto, contexto);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Erro ao gerar resposta de chat: ${mensagem}`);
      return this.respostaChatFallback(contexto);
    }
  }

  private parsearRespostaChat(json: string, contexto: string): string {
    try {
      const parsed = JSON.parse(json) as { resposta?: string };
      const resposta = parsed.resposta?.trim();
      if (!resposta) throw new Error('campo resposta vazio');
      return resposta;
    } catch {
      Logger.warn('[AdapterLangChainGemini] JSON inválido em gerarRespostaChat, usando texto bruto');
      const texto = json.trim();
      return texto || this.respostaChatFallback(contexto);
    }
  }

  private montarInstrucaoTomPerfil(perfil?: {
    idadeAnos?: number;
    estado?: string;
    nome?: string;
  }): string {
    if (!perfil) {
      return '';
    }
    const partes: string[] = [];
    if (perfil.nome) {
      partes.push(`Chame o cliente pelo primeiro nome (${perfil.nome.split(' ')[0]}) quando natural.`);
    }
    if (perfil.idadeAnos !== undefined && perfil.idadeAnos >= 55) {
      partes.push('Use tom respeitoso e um pouco mais contextual para leitores maduros.');
    } else if (perfil.idadeAnos !== undefined && perfil.idadeAnos < 25) {
      partes.push('Use tom direto e leve para leitores jovens.');
    }
    if (perfil.estado) {
      partes.push(
        `O cliente está em ${perfil.estado}; pode mencionar envio regional apenas se relevante.`
      );
    }
    return partes.join(' ');
  }

  private respostaChatFallback(contexto: string): string {
    const livrosEncontrados = this.extrairLivrosDoContexto(contexto);
    if (livrosEncontrados.length === 0) {
      return 'Não encontrei livros correspondentes à sua solicitação no momento.';
    }
    return `Com base no catálogo, sugiro:\n\n${livrosEncontrados
      .slice(0, 3)
      .map(
        (livro, i) =>
          `${i + 1}. "${livro.titulo}" de ${livro.autor} - R$ ${livro.preco.toFixed(2)}`
      )
      .join('\n')}`;
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
   * Valida coerência semântica usando LLM
   * Usado pelo ValidadorCoerenciaLLM para detectar incoerências sutis
   * 
   * @param prompt - Prompt de validação
   * @returns Resposta JSON do LLM
   */
  async validarCoerencia(prompt: string): Promise<string> {
    try {
      const genAI = this.inicializarGenAI();
      const modeloChat = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite';
      const model = genAI.getGenerativeModel({ model: modeloChat });

      const resultado = await model.generateContent(prompt);
      const texto = resultado.response.text();

      if (!texto || texto.trim().length === 0) {
        throw new Error('Resposta vazia do LLM');
      }

      return texto.trim();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[AdapterLangChainGemini] validarCoerencia falhou no Gemini: ${mensagem}. Tentando OpenRouter...`);
      if (this.fallbackChat) {
        return this.fallbackChat.validarCoerencia(prompt);
      }
      throw new Error(`Falha ao validar coerência: ${mensagem}`);
    }
  }

  /**
   * Valida se a API key está configurada corretamente
   * Adiciona timeout de 10 segundos para evitar travamento
   */
  async validarConexao(): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na validação de conexão')), 10000);
      });
      
      await Promise.race([
        this.gerarEmbedding('teste'),
        timeoutPromise
      ]);
      
      return true;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[AdapterLangChainGemini] Falha na validação de conexão: ${mensagem}`);
      return false;
    }
  }
}