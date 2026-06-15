import { AdapterLangChainGemini } from './adapterLangChainGemini';
import {
  IntencaoRecomendacao,
  ContextoInterpretacaoIntencao,
} from './IntencaoRecomendacao.entity';
import { ajustarPrecisaEsclarecer } from './ajustarIntencaoRecomendacao';
import { MensagemChatDTO } from './IRecomendacao.dto';
import { Logger } from '@/shared/utils/Logger.util';

const CACHE_INTENCAO_TTL_MS = 10 * 60 * 1000;

interface EntradaCacheIntencao {
  intencao: IntencaoRecomendacao;
  expiraEm: number;
}

/**
 * Extrai intenção estruturada da mensagem via Gemini (JSON).
 */
export class ServicoInterpretacaoIntencao {
  private readonly cacheIntencao = new Map<string, EntradaCacheIntencao>();

  constructor(private adapterGemini: AdapterLangChainGemini) {}

  private chaveCache(mensagem: string, historico: MensagemChatDTO[] | undefined): string {
    const historicoResumo = historico?.slice(-2).map(m => `${m.remetente}:${m.conteudo.substring(0, 40)}`).join('|') ?? '';
    return `${mensagem.substring(0, 100)}||${historicoResumo}`;
  }

  private obterDoCache(chave: string): IntencaoRecomendacao | null {
    const entrada = this.cacheIntencao.get(chave);
    if (!entrada || Date.now() > entrada.expiraEm) {
      this.cacheIntencao.delete(chave);
      return null;
    }
    return entrada.intencao;
  }

  private salvarNoCache(chave: string, intencao: IntencaoRecomendacao): void {
    if (this.cacheIntencao.size > 500) {
      const primeiraChave = this.cacheIntencao.keys().next().value;
      if (primeiraChave) this.cacheIntencao.delete(primeiraChave);
    }
    this.cacheIntencao.set(chave, { intencao, expiraEm: Date.now() + CACHE_INTENCAO_TTL_MS });
  }

  async interpretar(
    mensagem: string,
    historico: MensagemChatDTO[] | undefined,
    contexto: ContextoInterpretacaoIntencao
  ): Promise<IntencaoRecomendacao> {
    // Fast-path heurístico: para mensagens simples sem histórico (primeiro turno)
    // e com sinal claro (gênero explícito, pós-venda óbvio), evita o round-trip
    // ao Gemini (~3-8s). Princípio: tiered classification — use o classificador
    // mais barato que resolve o caso. Confiança >= 0.75 indica sinal suficiente.
    const heuristica = this.intencaoHeuristica(mensagem);
    if (heuristica.confianca >= 0.75 && (historico?.length ?? 0) <= 1) {
      Logger.debug(
        `[ServicoInterpretacaoIntencao] Fast-path heurístico (confiança=${heuristica.confianca}, tipo=${heuristica.tipo}) — Gemini ignorado`
      );
      return ajustarPrecisaEsclarecer(heuristica);
    }

    const chave = this.chaveCache(mensagem, historico);
    const cached = this.obterDoCache(chave);
    if (cached) {
      Logger.debug(`[ServicoInterpretacaoIntencao] Cache hit — Gemini ignorado`);
      return cached;
    }

    try {
      const intencao = await this.adapterGemini.interpretarIntencao(mensagem, historico, contexto);
      const resultado = ajustarPrecisaEsclarecer(intencao);
      this.salvarNoCache(chave, resultado);
      return resultado;
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[ServicoInterpretacaoIntencao] Fallback heurístico: ${msg}`);
      return ajustarPrecisaEsclarecer(heuristica);
    }
  }

  /**
   * Extrai preço máximo da mensagem usando early returns
   * Prioridade: match explícito > termos de linguagem natural
   */
  private extrairPrecoMaximo(texto: string, precoMatch: RegExpMatchArray | null): number | undefined {
    if (precoMatch) {
      return Number(precoMatch[1]);
    }

    if (texto.includes('baratos') || texto.includes('barato') || texto.includes('economico') || texto.includes('econômico')) {
      return 50;
    }

    if (texto.includes('caros') || texto.includes('caro')) {
      return 1000;
    }

    return undefined;
  }

  /**
   * Verifica se a solicitação de presente é ambígua usando early returns
   */
  private verificarAmbiguidadePresente(texto: string): boolean {
    if (!texto.includes('presente')) {
      return false;
    }

    if (texto.match(/\d+\s*anos?/)) {
      return false;
    }

    if (texto.includes('filho') || texto.includes('mãe') || texto.includes('pai')) {
      return false;
    }

    return true;
  }

  /**
   * Determina quantidade de livros usando early returns
   * Prioridade: match explícito > termos populares > gêneros > padrão
   */
  private determinarQuantidadeLivros(texto: string, quantidadeMatch: RegExpMatchArray | null, quantidadeGeneros: number): number {
    if (quantidadeMatch) {
      return Math.min(Number(quantidadeMatch[1]), 5);
    }

    if (texto.includes('mais vendidos') || texto.includes('vendidos') || texto.includes('popular')) {
      return 4;
    }

    if (quantidadeGeneros > 0) {
      return 4;
    }

    return 1;
  }

  // Pré-compilados no nível de classe: compilar regex no hot path a cada call é
  // alocação desnecessária — aqui são constantes determinísticas (sem estado).
  private static readonly REGEX_PRECO = /(?:até|max|máximo)\s*r?\$?\s*(\d+)/;
  private static readonly REGEX_PAGINAS = /(\d+)\s*p[aá]ginas?/;
  private static readonly REGEX_QUANTIDADE = /(\d+)\s+livros?/;
  private static readonly SINAIS_POSVENDA = /\b(pedido|entrega|rastreamento|prazo|cancelar|troca|devolucao|devolução|status|chegou|chegará|onde está)\b/;
  private static readonly SINAIS_TENDENCIAS = /\b(mais vendidos?|populares?|ranking|tendência|tendencia|lançamentos?)\b/;
  private static readonly MAPA_GENEROS: ReadonlyArray<readonly [string, string]> = [
    ['ficção científica', 'ficcao_cientifica'],
    ['ficcao cientifica', 'ficcao_cientifica'],
    ['romance histórico', 'romance_historico'],
    ['romance historico', 'romance_historico'],
    ['romance', 'romance'],
    ['terror', 'terror'],
    ['suspense', 'suspense'],
    ['fantasia', 'fantasia'],
    ['mistério', 'misterio'],
    ['misterio', 'misterio'],
    ['humor', 'humor'],
    ['distopia', 'distopia'],
    ['infantil', 'infantil'],
    ['juvenil', 'juvenil'],
    ['tecnologia', 'tecnologia'],
    ['programação', 'programacao'],
    ['programacao', 'programacao'],
    ['python', 'programacao'],
    ['javascript', 'programacao'],
    ['typescript', 'programacao'],
    ['java', 'programacao'],
    ['desenvolvimento', 'programacao'],
    ['software', 'programacao'],
    ['aventura', 'aventura'],
    ['classico', 'classico'],
    ['clássico', 'classico'],
    ['biografia', 'biografia'],
    ['autoajuda', 'autoajuda'],
    ['auto-ajuda', 'autoajuda'],
    ['negócios', 'negocios'],
    ['negocios', 'negocios'],
    ['policial', 'policial'],
    ['historico', 'historico'],
    ['histórico', 'historico'],
    ['filosofia', 'filosofia'],
    ['psicologia', 'psicologia'],
  ];

  private intencaoHeuristica(mensagem: string): IntencaoRecomendacao {
    const texto = mensagem.toLowerCase();

    // Sinalização de pós-venda — confiança alta, tipo determinístico
    if (ServicoInterpretacaoIntencao.SINAIS_POSVENDA.test(texto)) {
      return {
        tipo: 'pos_venda',
        generos: [],
        quantidadeLivros: 1,
        precisaEsclarecer: false,
        queryBusca: mensagem,
        confianca: 0.85,
      };
    }

    // Sinalização de tendências — confiança alta
    if (ServicoInterpretacaoIntencao.SINAIS_TENDENCIAS.test(texto)) {
      return {
        tipo: 'tendencias',
        generos: [],
        quantidadeLivros: 5,
        precisaEsclarecer: false,
        queryBusca: mensagem,
        confianca: 0.80,
      };
    }

    const precoMatch = ServicoInterpretacaoIntencao.REGEX_PRECO.exec(texto);
    const paginasMatch = ServicoInterpretacaoIntencao.REGEX_PAGINAS.exec(texto);
    const quantidadeMatch = ServicoInterpretacaoIntencao.REGEX_QUANTIDADE.exec(texto);
    const precoMax = this.extrairPrecoMaximo(texto, precoMatch);

    const generos: string[] = [];
    for (const [termo, tag] of ServicoInterpretacaoIntencao.MAPA_GENEROS) {
      if (texto.includes(termo) && !generos.includes(tag)) {
        generos.push(tag);
      }
    }

    const ambiguo = this.verificarAmbiguidadePresente(texto);
    const quantidadeLivros = this.determinarQuantidadeLivros(texto, quantidadeMatch, generos.length);

    // Confiança alta: gênero explícito identificado sem ambiguidade
    // Confiança baixa: mensagem genérica sem sinal claro → Gemini decide
    const confianca = !ambiguo && generos.length > 0 ? 0.80 : 0.4;

    return {
      tipo: ambiguo ? 'esclarecimento' : 'recomendacao',
      generos,
      precoMax,
      paginasMax: paginasMatch ? Number(paginasMatch[1]) : undefined,
      quantidadeLivros,
      precisaEsclarecer: ambiguo,
      perguntasEsclarecimento: ambiguo
        ? ['Para quem é o presente e qual a faixa etária do destinatário?']
        : undefined,
      queryBusca: mensagem,
      confianca,
    };
  }
}
