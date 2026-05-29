import { AdapterLangChainGemini } from '../../infrastructure/config/AdapterLangChainGemini';
import {
  IntencaoRecomendacao,
  ContextoInterpretacaoIntencao,
} from '../../domain/entities/IntencaoRecomendacao.entity';
import { ajustarPrecisaEsclarecer } from '../../domain/services/ajustarIntencaoRecomendacao';
import { MensagemChatDTO } from '../dtos/IRecomendacaoDTO';
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

  private intencaoHeuristica(mensagem: string): IntencaoRecomendacao {
    const texto = mensagem.toLowerCase();
    const precoMatch = texto.match(/(?:até|max|máximo)\s*r?\$?\s*(\d+)/);
    const paginasMatch = texto.match(/(\d+)\s*p[aá]ginas?/);
    const quantidadeMatch = texto.match(/(\d+)\s+livros?/);

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

    const ambiguo =
      texto.includes('presente') &&
      !texto.match(/\d+\s*anos?/) &&
      !texto.includes('filho') &&
      !texto.includes('mãe') &&
      !texto.includes('pai');

    return {
      tipo: ambiguo ? 'esclarecimento' : 'recomendacao',
      generos,
      precoMax: precoMatch ? Number(precoMatch[1]) : undefined,
      paginasMax: paginasMatch ? Number(paginasMatch[1]) : undefined,
      quantidadeLivros: quantidadeMatch ? Math.min(Number(quantidadeMatch[1]), 5) : 1,
      precisaEsclarecer: ambiguo,
      perguntasEsclarecimento: ambiguo
        ? ['Para quem é o presente e qual a faixa etária do destinatário?']
        : undefined,
      queryBusca: mensagem,
      confianca: 0.4,
    };
  }
}
