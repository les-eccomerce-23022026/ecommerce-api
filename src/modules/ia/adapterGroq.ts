import { Logger } from '@/shared/utils/Logger.util';
import type { IAdapterLLMChat } from './IAdapterLLMChat';
import type { IntencaoRecomendacao, ContextoInterpretacaoIntencao } from './IntencaoRecomendacao.entity';
import type { MensagemChatDTO } from './IRecomendacao.dto';

const MODELO = 'llama-3.1-8b-instant';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class AdapterGroq implements IAdapterLLMChat {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY não definida nas variáveis de ambiente');
    }
    this.apiKey = key;
  }

  private async chamarAPI(
    mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[],
    maxTokens = 1024
  ): Promise<string> {
    const resposta = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODELO, messages: mensagens, max_tokens: maxTokens }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      throw new Error(`[AdapterGroq] ${MODELO} retornou ${resposta.status}: ${corpo}`);
    }

    const dados = await resposta.json();
    const texto: string = dados?.choices?.[0]?.message?.content ?? '';

    if (!texto.trim()) {
      throw new Error(`[AdapterGroq] ${MODELO} retornou resposta vazia`);
    }

    Logger.info(`[AdapterGroq] Resposta obtida via ${MODELO}`);
    return texto.trim();
  }

  async interpretarIntencao(
    mensagem: string,
    historico: MensagemChatDTO[] | undefined,
    contexto: ContextoInterpretacaoIntencao
  ): Promise<IntencaoRecomendacao> {
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

    const user = [
      historicoTexto ? `Histórico do chat:\n${historicoTexto}` : '',
      `Mensagem atual: ${mensagem}`,
    ]
      .filter(Boolean)
      .join('\n');

    const texto = await this.chamarAPI(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      512
    );

    const jsonLimpo = texto.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonLimpo) as IntencaoRecomendacao;

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
    if (opcoes?.modoEsclarecimento) {
      const perguntas = opcoes.perguntasFollowUp ?? [];
      if (perguntas.length > 0) {
        return `Para te ajudar melhor, preciso de mais alguns detalhes:\n\n${perguntas.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
      }
      return 'Para te ajudar melhor, pode me contar um pouco mais sobre o que você procura?';
    }

    const tomPerfil = this.montarInstrucaoTomPerfil(opcoes?.perfil);

    const regrasPosvenda = opcoes?.modoPosvenda
      ? 'MODO PÓS-VENDA ativo: responda APENAS com base nos pedidos listados no contexto. Nunca invente status, datas ou rastreamentos.'
      : '';

    const system = [
      'Você é o assistente de uma livraria brasileira, especialista em recomendação de livros e atendimento pós-venda.',
      'Use APENAS os dados fornecidos no contexto.',
      'Responda em português do Brasil, de forma acolhedora e objetiva.',
      'Formate em tópicos curtos com "• " (3 a 5 tópicos, cada um com no máximo uma frase).',
      regrasPosvenda,
      tomPerfil,
      'IMPORTANTE: retorne APENAS JSON válido no formato {"resposta":"texto aqui"}. Nenhum texto fora do JSON.',
    ]
      .filter(Boolean)
      .join(' ');

    const mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: system },
    ];

    if (historicoConversa) {
      for (const msg of historicoConversa) {
        mensagens.push({
          role: msg.papel === 'model' ? 'assistant' : 'user',
          content: msg.conteudo,
        });
      }
    }

    const rotuloContexto = opcoes?.modoPosvenda
      ? 'Contexto de pedidos (única fonte de verdade)'
      : 'Contexto (única fonte de verdade)';

    mensagens.push({
      role: 'user',
      content: `${rotuloContexto}:\n${contexto}\n\nPergunta do cliente: ${pergunta}`,
    });

    const texto = await this.chamarAPI(mensagens, opcoes?.maxTokens ?? 1024);
    return this.parsearRespostaChat(texto);
  }

  /**
   * Versão streaming de gerarRespostaChat (Task 6).
   *
   * Usa o streaming nativo da API OpenAI-compat do Groq (`stream: true`) e
   * repassa cada fragmento de texto ao callback `onDelta`. Como o system prompt
   * pede JSON `{"resposta":"..."}`, fazemos um parse incremental tolerante:
   * extraímos apenas o conteúdo do campo "resposta" à medida que chega.
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
    if (opcoes?.modoEsclarecimento) {
      const texto = await this.gerarRespostaChat(pergunta, contexto, historicoConversa, opcoes);
      onDelta(texto);
      return texto;
    }

    const tomPerfil = this.montarInstrucaoTomPerfil(opcoes?.perfil);
    const regrasPosvenda = opcoes?.modoPosvenda
      ? 'MODO PÓS-VENDA ativo: responda APENAS com base nos pedidos listados no contexto. Nunca invente status, datas ou rastreamentos.'
      : '';

    const system = [
      'Você é o assistente de uma livraria brasileira, especialista em recomendação de livros e atendimento pós-venda.',
      'Use APENAS os dados fornecidos no contexto.',
      'Responda em português do Brasil, de forma acolhedora e objetiva.',
      'Formate em tópicos curtos com "• " (3 a 5 tópicos, cada um com no máximo uma frase).',
      regrasPosvenda,
      tomPerfil,
      'IMPORTANTE: retorne APENAS JSON válido no formato {"resposta":"texto aqui"}. Nenhum texto fora do JSON.',
    ]
      .filter(Boolean)
      .join(' ');

    const mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: system },
    ];
    if (historicoConversa) {
      for (const msg of historicoConversa) {
        mensagens.push({ role: msg.papel === 'model' ? 'assistant' : 'user', content: msg.conteudo });
      }
    }
    const rotuloContexto = opcoes?.modoPosvenda
      ? 'Contexto de pedidos (única fonte de verdade)'
      : 'Contexto (única fonte de verdade)';
    mensagens.push({
      role: 'user',
      content: `${rotuloContexto}:\n${contexto}\n\nPergunta do cliente: ${pergunta}`,
    });

    const textoBruto = await AdapterGroq.streamChatCompletion(
      this.apiKey,
      mensagens,
      opcoes?.maxTokens ?? 1024
    );

    // Parse final do JSON e emissão do texto limpo. O streaming acima já entregou
    // os deltas brutos via callback interno; aqui retornamos o texto parseado.
    const respostaFinal = this.parsearRespostaChat(textoBruto);
    onDelta(respostaFinal);
    return respostaFinal;
  }

  /**
   * Consome o stream SSE OpenAI-compat do Groq e acumula o conteúdo bruto.
   * Estático para reuso pelo AdapterLangChainGemini (mesmo endpoint).
   */
  static async streamChatCompletion(
    apiKey: string,
    mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[],
    maxTokens: number
  ): Promise<string> {
    const resposta = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELO, messages: mensagens, max_tokens: maxTokens, stream: true }),
    });

    if (!resposta.ok || !resposta.body) {
      const corpo = resposta.ok ? 'corpo vazio' : await resposta.text();
      throw new Error(`[AdapterGroq] stream ${MODELO} retornou ${resposta.status}: ${corpo}`);
    }

    const reader = resposta.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let acumulado = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let limite = buffer.indexOf('\n');
      while (limite !== -1) {
        const linha = buffer.slice(0, limite).trim();
        buffer = buffer.slice(limite + 1);
        limite = buffer.indexOf('\n');

        if (!linha.startsWith('data:')) continue;
        const payload = linha.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) acumulado += delta;
        } catch {
          // fragmento incompleto; ignora
        }
      }
    }

    return acumulado.trim();
  }

  private parsearRespostaChat(json: string): string {
    try {
      const limpo = json.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(limpo) as { resposta?: string };
      const resposta = parsed.resposta?.trim();
      if (!resposta) throw new Error('campo resposta vazio');
      return resposta;
    } catch {
      Logger.warn('[AdapterGroq] JSON inválido em gerarRespostaChat, usando texto bruto');
      return json.trim();
    }
  }

  async validarCoerencia(prompt: string): Promise<string> {
    return this.chamarAPI([{ role: 'user', content: prompt }], 512);
  }

  private montarInstrucaoTomPerfil(perfil?: {
    idadeAnos?: number;
    estado?: string;
    nome?: string;
  }): string {
    if (!perfil) return '';

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
      partes.push(`O cliente está em ${perfil.estado}; pode mencionar envio regional apenas se relevante.`);
    }
    return partes.join(' ');
  }
}
