import { IntencaoRecomendacao } from '../entities/IntencaoRecomendacao.entity';

/**
 * Evita bloquear o RAG quando o usuário já indicou gênero/tema (ex.: "livros de terror").
 */
export function ajustarPrecisaEsclarecer(intencao: IntencaoRecomendacao): IntencaoRecomendacao {
  if (!intencao.precisaEsclarecer || intencao.generos.length === 0) {
    return intencao;
  }

  return {
    ...intencao,
    precisaEsclarecer: false,
    perguntasEsclarecimento: undefined,
    tipo: intencao.tipo === 'esclarecimento' ? 'recomendacao' : intencao.tipo,
  };
}
