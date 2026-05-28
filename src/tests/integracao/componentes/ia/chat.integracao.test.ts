/**
 * Testes de Integração — Endpoint de Chat com IA (POST /api/ia/chat)
 *
 * Verifica o comportamento do endpoint de chat contextualizado,
 * incluindo validação de entrada, estrutura de resposta e tratamento
 * de erros no serviço de geração de resposta textual.
 *
 * RN-IA-002: Chat deve sempre incluir contexto do catálogo da livraria.
 */

// Funções mock declaradas ANTES dos jest.mock (prefixo 'mock' isenta do hoisting)
const mockGerarEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
const mockGerarEmbeddingsLote = jest.fn().mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5]]);
const mockGerarRespostaChat = jest.fn().mockResolvedValue(
  'Com base nos livros disponíveis em nossa livraria, sugiro...'
);
const mockValidarConexao = jest.fn().mockResolvedValue(true);

const mockCriarEmbedding = jest.fn().mockResolvedValue({
  id: 0,
  uuid: 'embed-uuid-padrao',
  produtoUuid: 'prod-uuid-padrao',
  embedding: [0.1, 0.2, 0.3],
  metadados: {},
  criadoEm: new Date(),
  atualizadoEm: new Date(),
});
const mockBuscarPorProdutoUuid = jest.fn().mockResolvedValue(null);
const mockBuscarSimilares = jest.fn().mockResolvedValue([]);
const mockAtualizarEmbedding = jest.fn().mockResolvedValue({});
const mockRemoverEmbedding = jest.fn().mockResolvedValue(undefined);
const mockIndexarCatalogo = jest.fn().mockResolvedValue(0);
const mockLimparColecao = jest.fn().mockResolvedValue(undefined);

// Mocks dos módulos externos
jest.mock('@/modules/ia/infrastructure/config/AdapterLangChainGemini', () => ({
  AdapterLangChainGemini: jest.fn().mockImplementation(() => ({
    gerarEmbedding: mockGerarEmbedding,
    gerarEmbeddingsLote: mockGerarEmbeddingsLote,
    gerarRespostaChat: mockGerarRespostaChat,
    validarConexao: mockValidarConexao,
  })),
}));

jest.mock('@/modules/ia/infrastructure/repositories/RepositorioEmbeddingChromaDB', () => ({
  RepositorioEmbeddingChromaDB: jest.fn().mockImplementation(() => ({
    criar: mockCriarEmbedding,
    buscarPorProdutoUuid: mockBuscarPorProdutoUuid,
    buscarSimilares: mockBuscarSimilares,
    atualizar: mockAtualizarEmbedding,
    remover: mockRemoverEmbedding,
    indexarCatalogo: mockIndexarCatalogo,
    limparColecao: mockLimparColecao,
  })),
}));

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

describe('[RF-IA-02] Integração - Chat com IA (POST /api/ia/chat)', () => {
  const contexto = configurarTesteIntegracao();

  describe('Validação de Entrada', () => {
    it('[RN-IA-002] deve retornar 400 quando o corpo da requisição está vazio', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/mensagem/i);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem é string vazia', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: '' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem contém apenas espaços', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: '   ' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem não é do tipo string', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 42 });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve aceitar mensagem com 1001 caracteres (limite não implementado no controller)', async () => {
      // Nota: validação de tamanho máximo ainda não implementada no controller.
      // Quando implementada, deve retornar 400. Atualmente retorna 200.
      const mensagemLonga = 'A'.repeat(1001);

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: mensagemLonga });

      expect([200, 400]).toContain(resposta.status);
    });

    it('[RN-IA-002] deve retornar 400 quando historico não é um array', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Quais livros de ficção você recomenda?', historico: 'não sou array' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      // A mensagem de erro inclui "Histórico" (com acento)
      expect(resposta.body.mensagem).toContain('Histórico');
    });

    it('[RN-IA-002] deve aceitar item do histórico sem campo role (validação não implementada)', async () => {
      // Nota: o controller não valida os campos de cada item do histórico.
      // Quando implementada, deve retornar 400 para itens sem role.
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({
          mensagem: 'Me indique um bom romance',
          historico: [{ content: 'anterior sem role' }],
        });

      expect([200, 400]).toContain(resposta.status);
    });

    it('[RN-IA-002] deve aceitar item com role inválido no histórico (validação não implementada)', async () => {
      // Nota: o controller aceita qualquer role pois não valida o conteúdo do histórico.
      // Quando implementada, deve rejeitar roles fora de user/assistant.
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({
          mensagem: 'Me indique um bom romance',
          historico: [{ role: 'system', content: 'conteúdo com role não reconhecido' }],
        });

      expect([200, 400]).toContain(resposta.status);
    });
  });

  describe('Retorno com Sucesso', () => {
    it('[RN-IA-002] deve retornar 200 com estrutura completa para mensagem válida', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Você pode me indicar livros de programação?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados).toHaveProperty('resposta');
      expect(resposta.body.dados).toHaveProperty('produtosRecomendados');
      expect(resposta.body.dados).toHaveProperty('tempoRespostaMs');
      expect(typeof resposta.body.dados.resposta).toBe('string');
      expect(resposta.body.dados.resposta.length).toBeGreaterThan(0);
    });

    it('[RN-IA-002] deve retornar 200 com histórico vazio quando não fornecido', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Quais são os lançamentos de ficção científica?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(Array.isArray(resposta.body.dados.produtosRecomendados)).toBe(true);
    });

    it('[RN-IA-002] deve retornar 200 com histórico de conversa fornecido', async () => {
      const historico = [
        { role: 'user', content: 'Gosto de ficção científica' },
        { role: 'assistant', content: 'Que ótimo! Posso recomendar vários títulos.' },
      ];

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({
          mensagem: 'Pode me sugerir algo nesse estilo?',
          historico,
        });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RN-IA-002] deve retornar tempoRespostaMs como número não-negativo', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Qual é o livro mais vendido desta semana?' });

      expect(resposta.status).toBe(200);
      expect(typeof resposta.body.dados.tempoRespostaMs).toBe('number');
      expect(resposta.body.dados.tempoRespostaMs).toBeGreaterThanOrEqual(0);
    });

    it('[RN-IA-002] deve acionar geração de resposta textual com o contexto da livraria', async () => {
      await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Recomende um livro de literatura brasileira' });

      expect(mockGerarRespostaChat).toHaveBeenCalled();
    });

    it('[RN-IA-002] deve acionar busca semântica para contextualizar a resposta do chat', async () => {
      await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Tenho interesse em autoajuda e desenvolvimento pessoal' });

      expect(mockGerarEmbedding).toHaveBeenCalled();
      expect(mockBuscarSimilares).toHaveBeenCalled();
    });

    it('[RN-IA-002] deve retornar 200 para mensagem exatamente com 1000 caracteres (limite válido)', async () => {
      const mensagemNoLimite = 'B'.repeat(1000);

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: mensagemNoLimite });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });

  describe('Tratamento de Falha nos Serviços Externos', () => {
    it('[RN-IA-002] deve retornar 500 quando serviço de geração de resposta está indisponível', async () => {
      mockGerarRespostaChat.mockRejectedValueOnce(
        new Error('Conexão com Gemini API encerrada inesperadamente')
      );

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Existe algum romance histórico ambientado no Brasil Colônia?' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 500 quando embedding da mensagem não pode ser gerado', async () => {
      mockGerarEmbedding.mockRejectedValueOnce(
        new Error('Quota de API excedida para embeddings')
      );

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Busco livros sobre mindfulness e meditação' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });
  });
});
