/**
 * Testes de integração — interpretação de intenção, filtros e modo esclarecimento
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockBuscarSimilares,
  mockGerarEmbedding,
  mockGerarRespostaChat,
  mockInterpretarIntencao,
} from '@/tests/helpers/setupMocksIA.util';

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenClienteParaIa, postIaChat } from '@/tests/helpers/ia-integracao.helper';

describe('[RF-IA] Integração - Intenção, filtros e esclarecimento', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  const produtoMock = {
    produtoUuid: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    similaridade: 0.85,
    metadados: {
      titulo: 'Livro Teste',
      autor: 'Autor Teste',
      categoria: 'Romance',
      sinopse: 'Sinopse',
      isbn: '9780000000000',
      preco: 45,
      numeroPaginas: 200,
      tags: 'romance',
    },
  };

  beforeEach(async () => {
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
    mockBuscarSimilares.mockResolvedValue([produtoMock]);
  });

  it('deve acionar interpretação de intenção no fluxo de chat', async () => {
    await postIaChat(contexto.app, tokenCliente).send({
      mensagem: 'Quero um romance histórico até R$ 60',
    });

    expect(mockInterpretarIntencao).toHaveBeenCalled();
  });

  it('deve retornar modo esclarecimento sem produtos quando intenção pede esclarecimento', async () => {
    mockInterpretarIntencao.mockResolvedValueOnce({
      tipo: 'esclarecimento',
      generos: [],
      quantidadeLivros: 1,
      precisaEsclarecer: true,
      perguntasEsclarecimento: ['Para quem é o presente?'],
      queryBusca: 'presente livro',
      confianca: 0.8,
    });

    const resposta = await postIaChat(contexto.app, tokenCliente).send({
      mensagem: 'Preciso de um presente',
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.tipoResposta).toBe('esclarecimento');
    expect(resposta.body.dados.perguntasFollowUp).toEqual(['Para quem é o presente?']);
    expect(resposta.body.dados.produtosRecomendados).toEqual([]);
    expect(mockBuscarSimilares).not.toHaveBeenCalled();
    expect(mockGerarEmbedding).not.toHaveBeenCalled();
  });

  it('deve aplicar filtro de preço via intenção (produto caro excluído)', async () => {
    mockInterpretarIntencao.mockResolvedValueOnce({
      tipo: 'recomendacao',
      generos: ['romance'],
      precoMax: 40,
      quantidadeLivros: 1,
      precisaEsclarecer: false,
      queryBusca: 'romance barato',
      confianca: 0.9,
    });

    mockBuscarSimilares.mockResolvedValueOnce([
      {
        ...produtoMock,
        metadados: { ...produtoMock.metadados, preco: 35, titulo: 'Romance Acessível' },
      },
      {
        ...produtoMock,
        produtoUuid: 'b2c3d4e5-f6a7-8901-2345-6789abcdef01',
        metadados: { ...produtoMock.metadados, preco: 80, titulo: 'Livro Caro' },
      },
    ]);

    const resposta = await postIaChat(contexto.app, tokenCliente).send({
      mensagem: 'Romance até 40 reais',
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.tipoResposta).toBe('recomendacao');
    const precos = resposta.body.dados.produtosRecomendados.map(
      (p: { preco: number }) => p.preco
    );
    expect(precos.every((p: number) => p <= 40)).toBe(true);
  });

  it('deve seguir com RAG quando há gênero explícito mesmo com precisaEsclarecer do modelo', async () => {
    mockInterpretarIntencao.mockResolvedValueOnce({
      tipo: 'esclarecimento',
      generos: ['terror'],
      quantidadeLivros: 3,
      precisaEsclarecer: true,
      perguntasEsclarecimento: ['Qual o orçamento máximo?'],
      queryBusca: 'livros de terror',
      confianca: 0.85,
    });

    mockBuscarSimilares.mockResolvedValueOnce([
      {
        ...produtoMock,
        metadados: {
          ...produtoMock.metadados,
          categoria: 'Terror',
          tags: 'terror,horror',
          titulo: 'O Iluminado',
        },
      },
    ]);

    const resposta = await postIaChat(contexto.app, tokenCliente).send({
      mensagem: 'Quero livros de terror',
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.tipoResposta).toBe('recomendacao');
    expect(resposta.body.dados.produtosRecomendados.length).toBeGreaterThan(0);
    expect(mockBuscarSimilares).toHaveBeenCalled();
  });

  it('deve aceitar histórico com remetente usuario/assistente (frontend)', async () => {
    const resposta = await postIaChat(contexto.app, tokenCliente).send({
      mensagem: 'Mais opções de terror',
      historico: [
        { remetente: 'usuario', conteudo: 'Gosto de suspense' },
        { remetente: 'assistente', conteudo: 'Ótimo!' },
      ],
    });

    expect(resposta.status).toBe(200);
    expect(mockInterpretarIntencao).toHaveBeenCalled();
  });
});
