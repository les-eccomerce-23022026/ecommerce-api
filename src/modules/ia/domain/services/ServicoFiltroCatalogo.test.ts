import { ServicoFiltroCatalogo } from './ServicoFiltroCatalogo';
import { ProdutoRecomendado } from './ServicoRecomendacaoRAG';

function produto(parcial: Partial<ProdutoRecomendado['metadados']>): ProdutoRecomendado {
  return {
    uuid: 'uuid-teste',
    similaridade: 0.9,
    metadados: {
      titulo: 'Título',
      autor: 'Autor',
      categoria: 'Geral',
      sinopse: '',
      isbn: '9780000000000',
      preco: 40,
      ...parcial,
    },
  };
}

describe('ServicoFiltroCatalogo', () => {
  const servico = new ServicoFiltroCatalogo();

  it('deve casar misterio da intenção com categoria Mistério no índice', () => {
    const resultado = servico.aplicar(
      [produto({ categoria: 'Mistério', tags: 'crime,classicos' })],
      { generos: ['misterio'] }
    );

    expect(resultado.produtos).toHaveLength(1);
  });

  it('deve casar ficcao_cientifica com Ficção Científica no catálogo', () => {
    const resultado = servico.aplicar(
      [produto({ categoria: 'Ficção Científica', tags: 'ficcao_cientifica,espaco' })],
      { generos: ['ficcao_cientifica'] }
    );

    expect(resultado.produtos).toHaveLength(1);
  });

  it('deve manter terror sem acento', () => {
    const resultado = servico.aplicar(
      [produto({ categoria: 'Terror', tags: 'terror,horror' })],
      { generos: ['terror'] }
    );

    expect(resultado.produtos).toHaveLength(1);
  });
});
