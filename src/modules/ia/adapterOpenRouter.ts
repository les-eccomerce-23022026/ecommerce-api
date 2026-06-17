import { Logger } from '@/shared/utils/Logger.util';
import type { IAdapterLLMChat } from './IAdapterLLMChat';
import type { IntencaoRecomendacao, ContextoInterpretacaoIntencao } from './IntencaoRecomendacao.entity';
import type { MensagemChatDTO } from './IRecomendacao.dto';

const MODELOS_FALLBACK = [
  'groq/llama-3.3-70b-versatile', // Groq - API key funcionando
  'openai/gpt-3.5-turbo',         // Fallback mais barato
] as const;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class AdapterOpenRouter implements IAdapterLLMChat {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('OPENROUTER_API_KEY não definida nas variáveis de ambiente');
    }
    this.apiKey = key;
  }

  private async chamarAPI(
    mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[],
    maxTokens = 1024
  ): Promise<string> {
    for (const modelo of MODELOS_FALLBACK) {
      try {
        const resposta = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: modelo, messages: mensagens, max_tokens: maxTokens }),
        });

        if (!resposta.ok) {
          const corpo = await resposta.text();
          Logger.warn(`[AdapterOpenRouter] ${modelo} retornou ${resposta.status}: ${corpo}`);
          continue;
        }

        const dados = await resposta.json();
        const texto: string = dados?.choices?.[0]?.message?.content ?? '';

        if (!texto.trim()) {
          Logger.warn(`[AdapterOpenRouter] ${modelo} retornou resposta vazia`);
          continue;
        }

        Logger.info(`[AdapterOpenRouter] Resposta obtida via ${modelo}`);
        return texto.trim();
      } catch (erro) {
        const msg = erro instanceof Error ? erro.message : String(erro);
        Logger.warn(`[AdapterOpenRouter] Erro em ${modelo}: ${msg}`);
      }
    }

    throw new Error('Todos os modelos OpenRouter falharam');
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
      'Tipos válidos: recomendacao, esclarecimento, comparativo, conversa, pos_venda, tendencias, informacao, fora_escopo.',
      'Use tipo=fora_escopo APENAS quando o cliente pedir para CRIAR, INVENTAR, ESCREVER ou FABRICAR livros/histórias (ex: "invente um livro", "crie uma história", "escreva um romance"). NUNCA use fora_escopo para recomendações de catálogo.',
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

    const texto = await this.chamarAPI([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], 512);

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

    const texto = await this.chamarAPI(mensagens);
    return this.parsearRespostaChat(texto);
  }

  private parsearRespostaChat(json: string): string {
    try {
      const limpo = json.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(limpo) as { resposta?: string };
      const resposta = parsed.resposta?.trim();
      if (!resposta) throw new Error('campo resposta vazio');
      return resposta;
    } catch {
      Logger.warn('[AdapterOpenRouter] JSON inválido em gerarRespostaChat, usando texto bruto');
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
