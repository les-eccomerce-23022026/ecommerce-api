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
import { AdapterGroq } from './adapterGroq';

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
  private modeloAtual: string | null = null;
  private provedorAtual: 'gemini' | 'groq' | null = null;
  // Cache de embedding removido: agora centralizado em CacheEmbeddingDecorator
  // (FactoryEmbedding) para evitar cache duplicado. Task 1.

  private provedorChat: 'groq' | 'gemini' | null = null;
  private verificacaoChatPromise: Promise<void> | null = null;

  constructor() {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('Nenhuma API key de LLM configurada. Defina GROQ_API_KEY ou GEMINI_API_KEY.');
    }
  }

  private async testarGroq(): Promise<boolean> {
    if (!process.env.GROQ_API_KEY) return false;
    try {
      const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ok' }], max_tokens: 1 }),
        signal: AbortSignal.timeout(5000),
      });
      return resposta.ok;
    } catch {
      return false;
    }
  }

  private async testarGemini(): Promise<boolean> {
    if (!process.env.GEMINI_API_KEY) return false;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelo = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      await modelo.generateContent({ contents: [{ role: 'user', parts: [{ text: 'ok' }] }], generationConfig: { maxOutputTokens: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Warm-up público do provedor de chat: dispara a seleção Groq/Gemini ainda no
   * boot do servidor, evitando que a primeira requisição real pague a latência
   * da verificação de disponibilidade. Idempotente. Task 2.
   */
  async prewarmChat(): Promise<void> {
    await this.verificarDisponibilidadeChat();
  }

  private async verificarDisponibilidadeChat(): Promise<void> {
    if (this.provedorChat) return;
    if (this.verificacaoChatPromise) return this.verificacaoChatPromise;

    this.verificacaoChatPromise = (async () => {
      Logger.info('[AdapterLangChainGemini] Verificando disponibilidade de provedores LLM em paralelo...');
      const [groqOk, geminiOk] = await Promise.all([this.testarGroq(), this.testarGemini()]);

      if (groqOk) {
        this.provedorChat = 'groq';
        Logger.info('[AdapterLangChainGemini] Provedor chat selecionado: Groq (llama-3.1-8b-instant)');
      } else if (geminiOk) {
        this.provedorChat = 'gemini';
        Logger.info('[AdapterLangChainGemini] Provedor chat selecionado: Gemini (gemini-2.5-flash)');
      } else {
        throw new Error('Nenhum provedor LLM disponível. Verifique GROQ_API_KEY e GEMINI_API_KEY.');
      }
    })();

    return this.verificacaoChatPromise;
  }

  private async chamarChatGroq(
    mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[],
    maxTokens = 1024
  ): Promise<string> {
    const adapterGroq = new AdapterGroq();
    // Reutiliza apenas o método interno via chamada direta à API
    const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY!}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: mensagens, max_tokens: maxTokens }),
    });
    if (!resposta.ok) throw new Error(`Groq: ${resposta.status} ${await resposta.text()}`);
    const dados = await resposta.json();
    const texto: string = dados?.choices?.[0]?.message?.content ?? '';
    if (!texto.trim()) throw new Error('Groq retornou resposta vazia');
    return texto.trim();
  }

  private async chamarChatGemini(
    systemPrompt: string,
    mensagens: { role: 'user' | 'model'; parts: { text: string }[] }[],
    maxTokens = 1024
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const modelo = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });
    const resultado = await modelo.generateContent({
      contents: mensagens,
      generationConfig: { maxOutputTokens: maxTokens },
    });
    return resultado.response.text().trim();
  }

  private async inicializarEmbeddings(): Promise<GoogleGenerativeAIEmbeddings> {
    if (this.embeddings) {
      return this.embeddings as GoogleGenerativeAIEmbeddings;
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('[AdapterLangChainGemini] GEMINI_API_KEY não definida. Para embeddings, use FactoryEmbedding (huggingface_local).');
    }

    const modeloConfigurado = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
    Logger.info(`[AdapterLangChainGemini] Inicializando embeddings Gemini (${modeloConfigurado})...`);

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: modeloConfigurado,
    });

    const teste = await (this.embeddings as GoogleGenerativeAIEmbeddings).embedQuery('teste');
    if (!Array.isArray(teste) || teste.length === 0) {
      throw new Error('[AdapterLangChainGemini] Gemini retornou embedding vazio no teste inicial.');
    }

    this.modeloAtual = modeloConfigurado;
    this.provedorAtual = 'gemini';
    Logger.info(`[AdapterLangChainGemini] Embeddings Gemini prontos (dimensão: ${teste.length})`);
    return this.embeddings as GoogleGenerativeAIEmbeddings;
  }

  /**
   * Gera embedding para um texto.
   *
   * O cache em memória foi movido para CacheEmbeddingDecorator (FactoryEmbedding).
   * Este método permanece simples — produz o embedding sem cache local. Task 1.
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
    await this.verificarDisponibilidadeChat();

    if (this.provedorChat === 'groq') {
      const adapterGroq = new AdapterGroq();
      return adapterGroq.interpretarIntencao(mensagem, historico, contexto);
    }

    const historicoTexto =
      historico
        ?.map((m) => {
          const papel = m.papel ?? (m.remetente === 'assistente' ? 'assistant' : 'user');
          return `${papel}: ${m.conteudo}`;
        })
        .join('\n') ?? '';

    const system = [
      'Você classifica intenções em um assistente de livraria online (pré-venda e pós-venda).',
      'Responda APENAS JSON válido com os campos: tipo, generos (array), precoMax, precoMin, paginasMax, publicoAlvo, quantidadeLivros, comparar, precisaEsclarecer, perguntasEsclarecimento, queryBusca, confianca.',
      'Tipos válidos: recomendacao, esclarecimento, comparativo, conversa, pos_venda, tendencias, informacao.',
      'generos: minúsculas, sem acento (terror, misterio, romance, fantasia, ficcao_cientifica, romance_historico).',
      'Use precisaEsclarecer=true apenas quando tipo for recomendacao ou esclarecimento e a mensagem for vaga.',
      'Para tendencias use quantidadeLivros entre 4 e 5.',
      `Perfil do cliente: ${JSON.stringify(contexto.perfil ?? {})}`,
      `Histórico de compras: ${contexto.resumoCompras ?? 'nenhum'}`,
    ].join(' ');

    const userText = [historicoTexto ? `Histórico do chat:\n${historicoTexto}` : '', `Mensagem atual: ${mensagem}`]
      .filter(Boolean)
      .join('\n');

    const texto = await this.chamarChatGemini(system, [{ role: 'user', parts: [{ text: userText }] }], 512);
    const jsonLimpo = texto.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonLimpo) as IntencaoRecomendacao;
    const quantidadePadrao = parsed.tipo === 'tendencias' ? 5 : 1;
    const quantidadeMinima = parsed.tipo === 'tendencias' ? 4 : 1;
    return {
      ...parsed,
      quantidadeLivros: Math.min(Math.max(parsed.quantidadeLivros || quantidadePadrao, quantidadeMinima), 5),
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
      modoPosvenda?: boolean;
      maxTokens?: number;
    }
  ): Promise<string> {
    await this.verificarDisponibilidadeChat();

    if (this.provedorChat === 'groq') {
      const adapterGroq = new AdapterGroq();
      return adapterGroq.gerarRespostaChat(pergunta, contexto, historicoConversa, opcoes);
    }

    if (opcoes?.modoEsclarecimento) {
      const perguntas = opcoes.perguntasFollowUp ?? [];
      if (perguntas.length > 0) {
        return `Para te ajudar melhor, preciso de mais alguns detalhes:\n\n${perguntas.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
      }
      return 'Para te ajudar melhor, pode me contar um pouco mais sobre o que você procura?';
    }

    const regrasPosvenda = opcoes?.modoPosvenda
      ? 'MODO PÓS-VENDA ativo: responda APENAS com base nos pedidos listados no contexto. Nunca invente status, datas ou rastreamentos.'
      : '';

    const system = [
      'Você é o assistente de uma livraria brasileira, especialista em recomendação de livros e atendimento pós-venda.',
      'Use APENAS os dados fornecidos no contexto.',
      'Responda em português do Brasil, de forma acolhedora e objetiva.',
      'Formate em tópicos curtos com "• " (3 a 5 tópicos, cada um com no máximo uma frase).',
      regrasPosvenda,
      'IMPORTANTE: retorne APENAS JSON válido no formato {"resposta":"texto aqui"}. Nenhum texto fora do JSON.',
    ]
      .filter(Boolean)
      .join(' ');

    const rotuloContexto = opcoes?.modoPosvenda ? 'Contexto de pedidos (única fonte de verdade)' : 'Contexto (única fonte de verdade)';
    const userText = `${rotuloContexto}:\n${contexto}\n\nPergunta do cliente: ${pergunta}`;

    const mensagensGemini: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    if (historicoConversa) {
      for (const msg of historicoConversa) {
        mensagensGemini.push({ role: msg.papel, parts: [{ text: msg.conteudo }] });
      }
    }
    mensagensGemini.push({ role: 'user', parts: [{ text: userText }] });

    const texto = await this.chamarChatGemini(system, mensagensGemini, opcoes?.maxTokens ?? 1024);
    try {
      const limpo = texto.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(limpo) as { resposta?: string };
      return parsed.resposta?.trim() ?? texto;
    } catch {
      return texto;
    }
  }

  /**
   * Versão streaming de gerarRespostaChat (Task 6).
   *
   * Repassa cada fragmento de texto ao callback `onDelta` usando o streaming
   * nativo do provedor selecionado:
   * - Groq: stream SSE OpenAI-compat (AdapterGroq.gerarRespostaChatStream).
   * - Gemini: generateContentStream.
   *
   * Em ambos os casos o system prompt pede JSON {"resposta":"..."}; aqui
   * acumulamos os deltas brutos, parseamos no fim e devolvemos o texto limpo.
   * Retorna o texto final completo.
   */
  async gerarRespostaChatStream(
    pergunta: string,
    contexto: string,
    onDelta: (delta: string) => void,
    historicoConversa?: { papel: 'user' | 'model'; conteudo: string }[],
    opcoes?: {
      modoEsclarecimento?: boolean;
      perguntasFollowUp?: string[];
      perfil?: { idadeAnos?: number; estado?: string; nome?: string };
      modoPosvenda?: boolean;
      maxTokens?: number;
    }
  ): Promise<string> {
    await this.verificarDisponibilidadeChat();

    if (this.provedorChat === 'groq') {
      const adapterGroq = new AdapterGroq();
      return adapterGroq.gerarRespostaChatStream(pergunta, contexto, onDelta, historicoConversa, opcoes);
    }

    if (opcoes?.modoEsclarecimento) {
      const texto = await this.gerarRespostaChat(pergunta, contexto, historicoConversa, opcoes);
      onDelta(texto);
      return texto;
    }

    const regrasPosvenda = opcoes?.modoPosvenda
      ? 'MODO PÓS-VENDA ativo: responda APENAS com base nos pedidos listados no contexto. Nunca invente status, datas ou rastreamentos.'
      : '';

    const system = [
      'Você é o assistente de uma livraria brasileira, especialista em recomendação de livros e atendimento pós-venda.',
      'Use APENAS os dados fornecidos no contexto.',
      'Responda em português do Brasil, de forma acolhedora e objetiva.',
      'Formate em tópicos curtos com "• " (3 a 5 tópicos, cada um com no máximo uma frase).',
      regrasPosvenda,
      'IMPORTANTE: retorne APENAS JSON válido no formato {"resposta":"texto aqui"}. Nenhum texto fora do JSON.',
    ]
      .filter(Boolean)
      .join(' ');

    const rotuloContexto = opcoes?.modoPosvenda ? 'Contexto de pedidos (única fonte de verdade)' : 'Contexto (única fonte de verdade)';
    const userText = `${rotuloContexto}:\n${contexto}\n\nPergunta do cliente: ${pergunta}`;

    const mensagensGemini: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    if (historicoConversa) {
      for (const msg of historicoConversa) {
        mensagensGemini.push({ role: msg.papel, parts: [{ text: msg.conteudo }] });
      }
    }
    mensagensGemini.push({ role: 'user', parts: [{ text: userText }] });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const modelo = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: system });
    const resultado = await modelo.generateContentStream({
      contents: mensagensGemini,
      generationConfig: { maxOutputTokens: opcoes?.maxTokens ?? 1024 },
    });

    let acumulado = '';
    for await (const chunk of resultado.stream) {
      const parte = chunk.text();
      if (parte) acumulado += parte;
    }

    const limpo = acumulado.replace(/```json\n?|\n?```/g, '').trim();
    let respostaFinal = limpo;
    try {
      const parsed = JSON.parse(limpo) as { resposta?: string };
      respostaFinal = parsed.resposta?.trim() ?? limpo;
    } catch {
      respostaFinal = acumulado.trim();
    }
    onDelta(respostaFinal);
    return respostaFinal;
  }

  /**
   * Valida coerência semântica usando LLM
   * Usado pelo ValidadorCoerenciaLLM para detectar incoerências sutis
   * 
   * @param prompt - Prompt de validação
   * @returns Resposta JSON do LLM
   */
  async validarCoerencia(prompt: string): Promise<string> {
    await this.verificarDisponibilidadeChat();

    if (this.provedorChat === 'groq') {
      const adapterGroq = new AdapterGroq();
      return adapterGroq.validarCoerencia(prompt);
    }

    return this.chamarChatGemini('', [{ role: 'user', parts: [{ text: prompt }] }], 512);
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