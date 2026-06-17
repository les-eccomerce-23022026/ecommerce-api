import { AdapterLangChainGemini } from './adapterLangChainGemini';
import {
  IntencaoRecomendacao,
  ContextoInterpretacaoIntencao,
} from './IntencaoRecomendacao.entity';
import { ajustarPrecisaEsclarecer } from './ajustarIntencaoRecomendacao';
import { normalizarIntencaoRecomendacao } from './normalizarIntencaoRecomendacao';
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
      const resultado = ajustarPrecisaEsclarecer(normalizarIntencaoRecomendacao(intencao));
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
   * REMOVIDO: heurística hardcoded de R$50 para "barato" (não é requisito)
   */
  private extrairPrecoMaximo(texto: string, precoMaxMatch: RegExpMatchArray | null): number | undefined {
    if (precoMaxMatch) {
      return Number(precoMaxMatch[1]);
    }

    return undefined;
  }

  /**
   * Extrai preço mínimo da mensagem usando early returns
   */
  private extrairPrecoMinimo(texto: string, precoMinMatch: RegExpMatchArray | null): number | undefined {
    if (precoMinMatch) {
      return Number(precoMinMatch[1]);
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
  private static readonly REGEX_PRECO_MAX = /(?:até|max|máximo)\s*r?\$?\s*(\d+)/;
  private static readonly REGEX_PRECO_MIN = /(?:acima de|mínimo|min|mais de)\s*r?\$?\s*(\d+)/;
  private static readonly REGEX_PAGINAS = /(\d+)\s*p[aá]ginas?/;
  private static readonly REGEX_QUANTIDADE = /(\d+)\s+livros?/;
  // Faixa de ano: "entre 1950 e 2000", "de 1950 a 2000", "1950-2000".
  private static readonly REGEX_ANO_FAIXA = /\b(19\d{2}|20\d{2})\s*(?:e|a|até|-|–)\s*(19\d{2}|20\d{2})\b/;
  private static readonly REGEX_ANO_SIMPLES = /\b(19\d{2}|20\d{2})\b/;
  // Sinal de autor citado: keyword explícita ou nome próprio com 2+ palavras capitalizadas.
  private static readonly REGEX_AUTOR_SINAL = /\b(do autor|da autora|escrito por|autoria de)\b|\b[A-ZÀ-Ý][a-zà-ÿ]+\s+[A-ZÀ-Ý][a-zà-ÿ.]+/;
  private static readonly SINAIS_POSVENDA = /\b(pedido|entrega|rastreamento|prazo|cancelar|troca|devolucao|devolução|status|chegou|chegará|onde está)\b/;
  private static readonly SINAIS_TENDENCIAS = /\b(mais vendidos?|populares?|ranking|tendência|tendencia|lançamentos?)\b/;
  private static readonly SINAIS_FORA_ESCOPO = /\b(invente|crie|escreva|criar|escrever|inventar|faça|fazer um livro|faça uma história|imagine|desenvolva|produza|elabore|construa|redija|compose|draft|generate|create content|make up|dream up|fabricate|fabricar|imaginar|concebe|conceber)\b.*\b(livro|livros|história|historias|story|stories|narrativa|narrativas|conto|contos|tale|tales|romance|romances|novel|novels|poema|poemas|poem|poems|texto|textos|text)\b/i;
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
    ['ação', 'aventura'],
    ['acao', 'aventura'],
  ];

  private intencaoHeuristica(mensagem: string): IntencaoRecomendacao {
    const texto = mensagem.toLowerCase();

    // Sinalização de fora de escopo (criação/invenção) — confiança máxima, tipo determinístico
    if (ServicoInterpretacaoIntencao.SINAIS_FORA_ESCOPO.test(texto)) {
      return {
        tipo: 'fora_escopo',
        generos: [],
        quantidadeLivros: 0,
        precisaEsclarecer: false,
        queryBusca: mensagem,
        confianca: 0.95,
      };
    }

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

    const precoMaxMatch = ServicoInterpretacaoIntencao.REGEX_PRECO_MAX.exec(texto);
    const precoMinMatch = ServicoInterpretacaoIntencao.REGEX_PRECO_MIN.exec(texto);
    const paginasMatch = ServicoInterpretacaoIntencao.REGEX_PAGINAS.exec(texto);
    const quantidadeMatch = ServicoInterpretacaoIntencao.REGEX_QUANTIDADE.exec(texto);
    const precoMax = this.extrairPrecoMaximo(texto, precoMaxMatch);
    const precoMin = this.extrairPrecoMinimo(texto, precoMinMatch);

    const generos: string[] = [];
    for (const [termo, tag] of ServicoInterpretacaoIntencao.MAPA_GENEROS) {
      if (texto.includes(termo) && !generos.includes(tag)) {
        generos.push(tag);
      }
    }

    const ambiguo = this.verificarAmbiguidadePresente(texto);
    const quantidadeLivros = this.determinarQuantidadeLivros(texto, quantidadeMatch, generos.length);

    // Faixa de ano (extraível deterministicamente como backup do Gemini).
    const anoFaixa = ServicoInterpretacaoIntencao.REGEX_ANO_FAIXA.exec(texto);
    const anoMin = anoFaixa ? Number(anoFaixa[1]) : undefined;
    const anoMax = anoFaixa ? Number(anoFaixa[2]) : undefined;

    // Filtros estruturais de autor/ano exigem extração de autor (NL): o Gemini é mais
    // confiável que a heurística. Quando há sinal de autor citado ou restrição de ano,
    // não usamos o fast-path — deixamos o Gemini extrair autor/anoMin/anoMax.
    const temAutorSinal = ServicoInterpretacaoIntencao.REGEX_AUTOR_SINAL.test(mensagem);
    const temAno = ServicoInterpretacaoIntencao.REGEX_ANO_SIMPLES.test(texto);
    const exigeExtracaoEstruturada = temAutorSinal || temAno;

    // Busca curta por título/fragmento (ex.: "O Senhor", "Harry"): sem sinais de
    // pós-venda/tendência, é intenção legítima de busca no catálogo. Tratamos como
    // recomendação determinística para evitar que o Gemini a classifique erroneamente
    // (ex.: como pós-venda) em termos ambíguos.
    const totalPalavras = texto.trim().split(/\s+/).filter(Boolean).length;
    const buscaCurtaTitulo = !ambiguo && totalPalavras > 0 && totalPalavras <= 4;

    // Confiança alta: gênero explícito identificado sem ambiguidade, ou busca curta
    //   por título (sinal determinístico suficiente para resolver sem Gemini).
    // Confiança baixa: mensagem genérica sem sinal claro → Gemini decide.
    const confianca =
      !ambiguo && !exigeExtracaoEstruturada && (generos.length > 0 || buscaCurtaTitulo) ? 0.80 : 0.4;

    return {
      tipo: ambiguo ? 'esclarecimento' : 'recomendacao',
      generos,
      anoMin,
      anoMax,
      precoMax,
      precoMin,
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
