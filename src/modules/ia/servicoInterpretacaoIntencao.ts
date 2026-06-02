import { AdapterLangChainGemini } from './adapterLangChainGemini';
import {
  IntencaoRecomendacao,
  ContextoInterpretacaoIntencao,
} from './IntencaoRecomendacao.entity';
import { ajustarPrecisaEsclarecer } from './ajustarIntencaoRecomendacao';
import { MensagemChatDTO } from './IRecomendacao.dto';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Extrai intenção estruturada da mensagem via Gemini (JSON).
 */
export class ServicoInterpretacaoIntencao {
  constructor(private adapterGemini: AdapterLangChainGemini) {}

  async interpretar(
    mensagem: string,
    historico: MensagemChatDTO[] | undefined,
    contexto: ContextoInterpretacaoIntencao
  ): Promise<IntencaoRecomendacao> {
    try {
      const intencao = await this.adapterGemini.interpretarIntencao(mensagem, historico, contexto);
      return ajustarPrecisaEsclarecer(intencao);
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[ServicoInterpretacaoIntencao] Fallback heurístico: ${msg}`);
      return ajustarPrecisaEsclarecer(this.intencaoHeuristica(mensagem));
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

  private intencaoHeuristica(mensagem: string): IntencaoRecomendacao {
    const texto = mensagem.toLowerCase();
    const precoMatch = texto.match(/(?:até|max|máximo)\s*r?\$?\s*(\d+)/);
    const paginasMatch = texto.match(/(\d+)\s*p[aá]ginas?/);
    const quantidadeMatch = texto.match(/(\d+)\s+livros?/);

    const precoMax = this.extrairPrecoMaximo(texto, precoMatch);

    const generos: string[] = [];
    const mapaGeneros: Record<string, string> = {
      romance: 'romance',
      terror: 'terror',
      suspense: 'suspense',
      fantasia: 'fantasia',
      'ficção científica': 'ficcao_cientifica',
      'ficcao cientifica': 'ficcao_cientifica',
      mistério: 'misterio',
      misterio: 'misterio',
      humor: 'humor',
      distopia: 'distopia',
    };

    for (const [termo, tag] of Object.entries(mapaGeneros)) {
      if (texto.includes(termo)) {
        generos.push(tag);
      }
    }

    const ambiguo = this.verificarAmbiguidadePresente(texto);
    const quantidadeLivros = this.determinarQuantidadeLivros(texto, quantidadeMatch, generos.length);

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
      confianca: 0.4,
    };
  }
}
