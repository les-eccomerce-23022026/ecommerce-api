import { Logger } from '@/shared/utils/Logger.util';
import { IAdapterEmbedding } from './IAdapterEmbedding';
import { AdapterLangChainGemini } from './adapterLangChainGemini';
import { ServicoCachePadroesValidacaoIA } from './servicoCachePadroesValidacaoIA';
import {
  BLACKLIST_PADROES_ESTATICOS,
  PADROES_IMPOSSIVEIS_ESTATICOS,
} from './padroesValidacaoEstaticos';
import type { IClassificadorDominio } from './IClassificadorDominio';

export interface ResultadoValidacaoSeguranca {
  seguro: boolean;
  motivoRejeicao?: string;
  tipoRisco?: 'injecao_prompt' | 'solicitacao_impossivel' | 'comportamento_suspeito' | 'alucinacao_nao_mapeada';
}

const MENSAGENS_REJEICAO: Record<string, string> = {
  injecao_prompt: 'Não posso processar comandos de sistema. Posso ajudar a recomendar livros baseados em gênero, autor ou tema.',
  solicitacao_impossivel: 'Essa solicitação não é válida. Por favor, reformule com um gênero literário, autor ou tema específico.',
  comportamento_suspeito: 'Não entendi sua solicitação. Posso ajudar a encontrar livros reais em nosso catálogo.',
  alucinacao_nao_mapeada: 'Essa solicitação parece conter um contexto incompatível com recomendação de livros. Por favor, reformule sem mencionar atividades que impossibilitem a leitura.',
  default: 'Não posso atender essa solicitação. Posso ajudar a recomendar livros de nosso catálogo.',
};

/** Stop words removidas ao extrair padrão chave de uma query bloqueada pelo LLM. */
const STOP_WORDS = new Set([
  'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'que', 'para',
  'com', 'por', 'se', 'ao', 'os', 'as', 'me', 'nos', 'eu', 'ele', 'ela',
  'meu', 'minha', 'seu', 'sua', 'qual', 'quais', 'mais', 'como', 'não',
  'nao', 'ser', 'ter', 'isso', 'este', 'esta', 'esse', 'essa', 'isso',
]);

/**
 * Serviço de Validação de Segurança para IA
 *
 * Duas camadas sequenciais:
 * 1. Determinística — padrões carregados do banco (cache TTL 10min), com fallback estático
 * 2. Semântica LLM — classificador binário Gemini para alucinações desconhecidas.
 *    Ao bloquear, persiste o padrão aprendido no banco de forma assíncrona (fire-and-forget).
 */
export class ServicoValidacaoSegurancaIA {
  private readonly LIMIAR_SIMILARIDADE_DOMINIO = 0.40;

  private readonly CONTEXTOS_DOMINIO_LITERARIO = [
    'recomendação de livros',
    'sugestão de leitura',
    'livros de ficção científica',
    'livros de romance',
    'livros de terror e suspense',
    'livros de fantasia épica',
    'livros de distopia',
    'livros de clássicos da literatura',
    'livros de autoajuda e desenvolvimento pessoal',
    'livros infantis e juvenis',
    'livros de história e biografia',
    'livros de tecnologia e programação',
    'autor de best-seller',
    'gênero literário favorito',
    'obra literária',
    'título do livro',
    'quero ler um livro',
    'indique um livro para mim',
  ];

  constructor(
    private servicoEmbedding?: IAdapterEmbedding,
    private adapterLLM?: AdapterLangChainGemini,
    private cachePadroes?: ServicoCachePadroesValidacaoIA,
    private classificadorDominio?: IClassificadorDominio
  ) {}

  async validarEntrada(entrada: string): Promise<ResultadoValidacaoSeguranca> {
    const textoNormalizado = entrada.toLowerCase().trim();

    // Carrega padrões do banco (cache) ou usa fallback estático
    const padroes = this.cachePadroes
      ? await this.cachePadroes.obterPadroes()
      : { blacklist: [...BLACKLIST_PADROES_ESTATICOS], impossiveis: [...PADROES_IMPOSSIVEIS_ESTATICOS], usandoFallback: true };

    if (padroes.usandoFallback) {
      Logger.warn('[ServicoValidacaoSegurancaIA] Usando padrões estáticos (banco indisponível)');
    }

    // 1. Injeção de prompt
    const resultadoInjecao = this.verificarInjecaoPrompt(textoNormalizado, padroes.blacklist);
    if (!resultadoInjecao.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Injeção de prompt detectada: "${entrada}"`);
      return resultadoInjecao;
    }

    // 2. Solicitações impossíveis
    const resultadoImpossivel = this.verificarSolicitacaoImpossivel(textoNormalizado, padroes.impossiveis);
    if (!resultadoImpossivel.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Solicitação impossível detectada: "${entrada}"`);
      return resultadoImpossivel;
    }

    // 3. Coerência semântica (combinações contraditórias hardcoded — raramente mudam)
    const resultadoCoerencia = ServicoValidacaoSegurancaIA.verificarCoerenciaSemantica(textoNormalizado);
    if (!resultadoCoerencia.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Incoerência semântica detectada: "${entrada}"`);
      return resultadoCoerencia;
    }

    // 4. Comportamento suspeito
    const resultadoSuspeito = ServicoValidacaoSegurancaIA.verificarComportamentoSuspeito(textoNormalizado);
    if (!resultadoSuspeito.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Comportamento suspeito detectado: "${entrada}"`);
      return resultadoSuspeito;
    }

    // 5. Classificação LLM — cobre nonsense e alucinações desconhecidas não mapeadas nos padrões.
    //    Usa ClassificadorDominioIA (JSON estruturado) se disponível, senão cai no método legado.
    //    Retorna o bloqueio imediatamente; a persistência do padrão ocorre em background.
    if (this.classificadorDominio) {
      const resultado = await this.classificadorDominio.classificar(entrada);
      if (!resultado.valido) {
        Logger.warn(`[ServicoValidacaoSegurancaIA] Bloqueado pelo classificador JSON (confiança ${resultado.confianca.toFixed(2)}): "${entrada}" — ${resultado.motivo}`);
        this.persistirPadraoAprendido(entrada).catch((err) =>
          Logger.error('[ServicoValidacaoSegurancaIA] Erro ao persistir padrão aprendido', err)
        );
        return {
          seguro: false,
          motivoRejeicao: MENSAGENS_REJEICAO.alucinacao_nao_mapeada,
          tipoRisco: 'alucinacao_nao_mapeada',
        };
      }
    } else if (this.adapterLLM) {
      const resultadoLLM = await this.classificarDominioLLM(entrada);
      if (!resultadoLLM.seguro) {
        Logger.warn(`[ServicoValidacaoSegurancaIA] Alucinação desconhecida bloqueada via LLM legado: "${entrada}"`);
        this.persistirPadraoAprendido(entrada).catch((err) =>
          Logger.error('[ServicoValidacaoSegurancaIA] Erro ao persistir padrão aprendido', err)
        );
        return resultadoLLM;
      }
    } else if (this.servicoEmbedding) {
      const resultadoNaoMapeado = await this.verificarAlucinacaoNaoMapeada(entrada);
      if (!resultadoNaoMapeado.seguro) {
        Logger.warn(`[ServicoValidacaoSegurancaIA] Alucinação não mapeada detectada: "${entrada}"`);
        return resultadoNaoMapeado;
      }
    }

    return { seguro: true };
  }

  /**
   * Valida o conteúdo de cada mensagem do histórico usando apenas camadas determinísticas
   * (blacklist + padrões impossíveis). Sem chamada LLM extra — custo zero.
   *
   * Retorna o índice e papel da primeira mensagem bloqueada, ou null se tudo seguro.
   */
  async validarConteudoHistorico(
    historico: { papel?: string; remetente?: string; conteudo: string }[]
  ): Promise<ResultadoValidacaoSeguranca & { indice?: number; papel?: string }> {
    const padroes = this.cachePadroes
      ? await this.cachePadroes.obterPadroes()
      : { blacklist: [...BLACKLIST_PADROES_ESTATICOS], impossiveis: [...PADROES_IMPOSSIVEIS_ESTATICOS], usandoFallback: true };

    for (let i = 0; i < historico.length; i++) {
      const { papel, remetente, conteudo } = historico[i];
      const identificador = papel ?? remetente ?? 'desconhecido';
      if (!conteudo || typeof conteudo !== 'string') continue;

      const texto = conteudo.toLowerCase().trim();

      const injecao = this.verificarInjecaoPrompt(texto, padroes.blacklist);
      if (!injecao.seguro) {
        Logger.warn(`[ServicoValidacaoSegurancaIA] Injeção detectada no histórico[${i}] (${identificador}): "${conteudo.substring(0, 60)}"`);
        return { ...injecao, indice: i, papel: identificador };
      }

      const impossivel = this.verificarSolicitacaoImpossivel(texto, padroes.impossiveis);
      if (!impossivel.seguro) {
        Logger.warn(`[ServicoValidacaoSegurancaIA] Padrão impossível no histórico[${i}] (${identificador}): "${conteudo.substring(0, 60)}"`);
        return { ...impossivel, indice: i, papel: identificador };
      }
    }

    return { seguro: true };
  }

  // ── Camada determinística ─────────────────────────────────────────────────

  private verificarInjecaoPrompt(texto: string, blacklist: string[]): ResultadoValidacaoSeguranca {
    const padraoEncontrado = blacklist.find((p) => texto.includes(p));
    if (!padraoEncontrado) return { seguro: true };
    return {
      seguro: false,
      motivoRejeicao: `A solicitação contém padrão não permitido: "${padraoEncontrado}"`,
      tipoRisco: 'injecao_prompt',
    };
  }

  private verificarSolicitacaoImpossivel(texto: string, impossiveis: string[]): ResultadoValidacaoSeguranca {
    const padraoEncontrado = impossiveis.find((p) => texto.includes(p));
    if (padraoEncontrado) {
      return {
        seguro: false,
        motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel,
        tipoRisco: 'solicitacao_impossivel',
      };
    }
    return ServicoValidacaoSegurancaIA.verificarCombinacaoImpossivel(texto);
  }

  private static verificarCoerenciaSemantica(texto: string): ResultadoValidacaoSeguranca {
    const combinacoesContraditorias: Record<string, string[]> = {
      'culinária': ['não gosta de cozinhar', 'nao gosta de cozinhar', 'odeia cozinhar', 'detesta cozinhar'],
      'culinaria': ['não gosta de cozinhar', 'nao gosta de cozinhar', 'odeia cozinhar', 'detesta cozinhar'],
      'cozinha': ['não gosta', 'nao gosta', 'odeia', 'detesta'],
      'gastronomia': ['não gosta', 'nao gosta', 'odeia', 'detesta'],
    };
    const combinacoesSemRelacao: Record<string, string[]> = {
      'física quântica': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'fisica quantica': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'ficcao cientifica': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'ficção científica': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'matemática': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'matematica': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'programação': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
      'programacao': ['fazer pizza', 'cozinhar', 'receita', 'culinária', 'culinaria'],
    };

    for (const [tema, restricoes] of Object.entries(combinacoesContraditorias)) {
      if (texto.includes(tema) && restricoes.some((r) => texto.includes(r))) {
        return { seguro: false, motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel, tipoRisco: 'solicitacao_impossivel' };
      }
    }
    for (const [tema, objetivos] of Object.entries(combinacoesSemRelacao)) {
      if (texto.includes(tema) && objetivos.some((o) => texto.includes(o))) {
        return { seguro: false, motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel, tipoRisco: 'solicitacao_impossivel' };
      }
    }
    return { seguro: true };
  }

  private static verificarCombinacaoImpossivel(texto: string): ResultadoValidacaoSeguranca {
    const verbosAprendizado = ['aprender', 'ensinar', 'como', 'método', 'técnica', 'tecnica'];
    const objetosImpossiveis = [
      'voar', 'voo', 'invisibilidade', 'telepatia', 'telecinese',
      'levitação', 'levitacao', 'magia', 'super força', 'super forca',
      'imortalidade', 'vida eterna', 'parar tempo', 'congelar tempo',
      'viajar tempo', 'voltar tempo', 'ler mentes', 'prever futuro',
      'curar com', 'milagre', 'milagrosa', 'milagroso',
    ];
    if (verbosAprendizado.some((v) => texto.includes(v)) && objetosImpossiveis.some((o) => texto.includes(o))) {
      return { seguro: false, motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel, tipoRisco: 'solicitacao_impossivel' };
    }

    const verbosTransformacao = ['transformar', 'converter', 'mudar', 'virar', 'tornar'];
    const objetosTransformacao = ['gato em', 'animal em', 'pessoa em', 'dragão', 'dragao', 'monstro', 'pedra em', 'metal em', 'ouro', 'morto', 'cadáver', 'cadaver'];
    if (verbosTransformacao.some((v) => texto.includes(v)) && objetosTransformacao.some((o) => texto.includes(o))) {
      return { seguro: false, motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel, tipoRisco: 'solicitacao_impossivel' };
    }

    const verbosConstrucao = ['construir', 'fazer', 'criar', 'montar', 'fabricar'];
    const materiaisInadequados = ['com papel', 'com cola', 'de papel que', 'de cartas', 'de palitos', 'com papelão', 'com papelao', 'de isopor'];
    const objetosComplexos = ['nave espacial', 'avião', 'aviao', 'foguete', 'carro', 'casa'];
    if (verbosConstrucao.some((v) => texto.includes(v)) && materiaisInadequados.some((m) => texto.includes(m)) && objetosComplexos.some((o) => texto.includes(o))) {
      return { seguro: false, motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel, tipoRisco: 'solicitacao_impossivel' };
    }

    return { seguro: true };
  }

  private static verificarComportamentoSuspeito(texto: string): ResultadoValidacaoSeguranca {
    const palavrasComando = ['mostrar', 'listar', 'exibir', 'ver', 'buscar'];
    const termosSuspeitos = ['inventados', 'falsos', 'teste', 'hack', 'exploit'];
    if (palavrasComando.some((p) => texto.includes(p)) && termosSuspeitos.some((t) => texto.includes(t))) {
      return {
        seguro: false,
        motivoRejeicao: 'A solicitação parece tentar acessar funcionalidades não disponíveis. Posso ajudar a encontrar livros reais em nosso catálogo.',
        tipoRisco: 'comportamento_suspeito',
      };
    }
    return { seguro: true };
  }

  // ── Camada LLM ────────────────────────────────────────────────────────────

  private async classificarDominioLLM(entrada: string): Promise<ResultadoValidacaoSeguranca> {
    try {
      const prompt = `Você é um classificador binário para uma livraria online. Responda APENAS "SIM" ou "NAO".

Avalie se a query é uma solicitação legítima de recomendação de livros para um LEITOR HUMANO.

Uma solicitação é VÁLIDA (SIM) quando:
- Pede livros por gênero literário (ficção científica, romance, terror, fantasia, autoajuda, história, tecnologia...)
- Pede livros por autor ou obra específica
- Pede livros sobre um tema que um leitor humano queira aprender ou se entreter
- Exemplos SIM: "livro de terror", "romance histórico", "quero aprender programação", "livro sobre plantas medicinais", "ficção científica espacial", "bestseller 2024"

Uma solicitação é INVÁLIDA (NAO) quando:
- O leitor é um animal ou objeto não-humano ("para meu cachorro", "para minha planta", "para meu gato")
- O objetivo final é beneficiar um ser não-humano ("para planta crescer", "cachorro entender")
- A query não tem relação com escolha de livros (esporte, receita culinária, notícias, clima, finanças sem contexto de livro)
- A leitura é combinada com atividade física impossível ("enquanto nado", "enquanto corro maratona")
- Exemplos NAO: "livro para minha planta crescer", "livro que meu cachorro entenda", "melhores times de futebol", "receita de bolo", "previsão do tempo", "cotação do dólar"

Query: "${entrada}"

Resposta (SIM ou NAO):`;

      const resposta = await this.adapterLLM!.validarCoerencia(prompt);
      const respostaNormalizada = resposta.trim().toUpperCase();

      Logger.debug(`[ServicoValidacaoSegurancaIA] Classificação LLM para "${entrada}": ${respostaNormalizada}`);

      if (respostaNormalizada.startsWith('NAO') || respostaNormalizada.startsWith('NÃO')) {
        return {
          seguro: false,
          motivoRejeicao: MENSAGENS_REJEICAO.alucinacao_nao_mapeada,
          tipoRisco: 'alucinacao_nao_mapeada',
        };
      }
      return { seguro: true };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoValidacaoSegurancaIA] Erro na classificação LLM: ${mensagem}`);
      return { seguro: true };
    }
  }

  /**
   * Extrai 3-4 palavras significativas da query para usar como padrão persistido.
   * Remove stop words e normaliza para minúsculas.
   */
  private extrairPadraoSignificativo(entrada: string): string | null {
    const palavras = entrada
      .toLowerCase()
      .replace(/[^\w\sáéíóúàèìòùâêîôûãõç]/g, ' ')
      .split(/\s+/)
      .filter((p) => p.length > 2 && !STOP_WORDS.has(p));

    if (palavras.length < 2) return null;
    return palavras.slice(0, 4).join(' ');
  }

  /**
   * Persiste o padrão aprendido no banco de forma assíncrona.
   * Chamado em fire-and-forget após o LLM bloquear uma query.
   */
  private async persistirPadraoAprendido(entrada: string): Promise<void> {
    if (!this.cachePadroes) return;

    const padrao = this.extrairPadraoSignificativo(entrada);
    if (!padrao) return;

    await this.cachePadroes.persistirPadrao(padrao, 'impossivel', 'llm_aprendizado');
    Logger.info(`[ServicoValidacaoSegurancaIA] Padrão aprendido persistido: "${padrao}"`);
  }

  // ── Fallback de embedding (quando LLM não disponível) ─────────────────────

  private async verificarAlucinacaoNaoMapeada(entrada: string): Promise<ResultadoValidacaoSeguranca> {
    try {
      const embeddingQuery = await this.servicoEmbedding!.gerarEmbedding(entrada);
      const embeddingsDominio = await Promise.all(
        this.CONTEXTOS_DOMINIO_LITERARIO.map((a: string) => this.servicoEmbedding!.gerarEmbedding(a))
      );
      const maxSimilaridade = Math.max(
        ...embeddingsDominio.map((emb: number[]) => this.calcularSimilaridadeCosseno(embeddingQuery, emb))
      );
      Logger.debug(`[ServicoValidacaoSegurancaIA] Similaridade máxima domínio: ${maxSimilaridade.toFixed(3)}`);
      if (maxSimilaridade < this.LIMIAR_SIMILARIDADE_DOMINIO) {
        return { seguro: false, motivoRejeicao: MENSAGENS_REJEICAO.alucinacao_nao_mapeada, tipoRisco: 'alucinacao_nao_mapeada' };
      }
      return { seguro: true };
    } catch (erro) {
      Logger.error(`[ServicoValidacaoSegurancaIA] Erro na validação por embedding: ${erro instanceof Error ? erro.message : String(erro)}`);
      return { seguro: true };
    }
  }

  private calcularSimilaridadeCosseno(vetorA: number[], vetorB: number[]): number {
    if (vetorA.length !== vetorB.length) return 0;
    let produtoEscalar = 0, normaA = 0, normaB = 0;
    for (let i = 0; i < vetorA.length; i++) {
      produtoEscalar += vetorA[i] * vetorB[i];
      normaA += vetorA[i] * vetorA[i];
      normaB += vetorB[i] * vetorB[i];
    }
    if (normaA === 0 || normaB === 0) return 0;
    return produtoEscalar / (Math.sqrt(normaA) * Math.sqrt(normaB));
  }

  static gerarMensagemRejeicao(resultado: ResultadoValidacaoSeguranca): string {
    if (resultado.seguro) throw new Error('Não é possível gerar mensagem de rejeição para entrada segura');
    const tipoRisco = resultado.tipoRisco || 'default';
    if (tipoRisco === 'solicitacao_impossivel' || tipoRisco === 'comportamento_suspeito') {
      return resultado.motivoRejeicao || MENSAGENS_REJEICAO[tipoRisco];
    }
    return MENSAGENS_REJEICAO[tipoRisco] || MENSAGENS_REJEICAO.default;
  }
}
