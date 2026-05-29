import { ajustarPrecisaEsclarecer } from './ajustarIntencaoRecomendacao';
import { IntencaoRecomendacao } from '../entities/IntencaoRecomendacao.entity';

const intencaoBase: IntencaoRecomendacao = {
  tipo: 'esclarecimento',
  generos: ['terror'],
  quantidadeLivros: 3,
  precisaEsclarecer: true,
  perguntasEsclarecimento: ['Qual o orçamento?'],
  queryBusca: 'livros de terror',
  confianca: 0.9,
};

describe('ajustarPrecisaEsclarecer', () => {
  it('deve liberar RAG quando há gênero explícito', () => {
    const ajustada = ajustarPrecisaEsclarecer(intencaoBase);

    expect(ajustada.precisaEsclarecer).toBe(false);
    expect(ajustada.tipo).toBe('recomendacao');
    expect(ajustada.perguntasEsclarecimento).toBeUndefined();
  });

  it('deve manter esclarecimento quando não há gênero', () => {
    const ajustada = ajustarPrecisaEsclarecer({
      ...intencaoBase,
      generos: [],
    });

    expect(ajustada.precisaEsclarecer).toBe(true);
  });
});
