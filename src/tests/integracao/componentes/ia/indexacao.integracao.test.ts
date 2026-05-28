/**
 * Testes de Integração — Endpoint de Reindexação (POST /api/ia/reindexar)
 *
 * Verifica o comportamento da operação de indexação do catálogo de produtos
 * no vetor semântico (ChromaDB). Cobre: autenticação, acionamento dos
 * serviços, tratamento de falhas e estrutura de resposta.
 *
 * RN-IA-003: Reindexação exige autenticação de administrador.
 */

// Funções mock declaradas ANTES dos jest.mock (prefixo 'mock' isenta do hoisting)
const mockGerarEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
const mockGerarEmbeddingsLote = jest.fn().mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5]]);
const mockGerarRespostaChat = jest.fn().mockResolvedValue('Resposta de chat simulada.');
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
import { obterTokenAdmin } from '@/tests/helpers/requisicoes-api.util';

describe('[RF-IA-03] Integração - Reindexação do Catálogo (POST /api/ia/reindexar)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenAdmin: string;

  beforeAll(async () => {
    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  describe('Controle de Acesso', () => {
    it('[RN-IA-003] deve retornar 401 quando requisição é feita sem autenticação', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-003] deve retornar 401 quando token de autenticação é inválido', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', ['token=token-invalido-qualquer']);

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-003] deve retornar 403 quando usuário autenticado não tem papel de administrador', async () => {
      // Registrar um cliente comum (sem papel admin)
      const cadastro = await request(contexto.app)
        .post('/api/auth/registrar')
        .send({
          nome: 'Cliente Comum Reindexar',
          email: 'cliente.reindexar@teste.com',
          senha: 'Senha@123',
          cpf: '111.222.333-96',
          dataNascimento: '1990-01-01',
        });

      const login = await request(contexto.app)
        .post('/api/auth/login')
        .send({ email: 'cliente.reindexar@teste.com', senha: 'Senha@123' });

      const cookiesCliente = login.headers['set-cookie'] as unknown as string[];

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', cookiesCliente);

      expect(resposta.status).toBe(403);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  describe('Execução com Sucesso (Administrador)', () => {
    it('[RN-IA-003] deve retornar 200 quando admin aciona reindexação', async () => {
      mockIndexarCatalogo.mockResolvedValueOnce(5);

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RN-IA-003] deve retornar estrutura completa com produtosIndexados', async () => {
      mockIndexarCatalogo.mockResolvedValueOnce(12);

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados).toHaveProperty('mensagem');
      expect(resposta.body.dados).toHaveProperty('produtosIndexados');
      expect(typeof resposta.body.dados.produtosIndexados).toBe('number');
      expect(resposta.body.dados.produtosIndexados).toBeGreaterThanOrEqual(0);
    });

    it('[RN-IA-003] deve retornar produtosIndexados refletindo o total indexado pelo serviço', async () => {
      const totalEsperado = 8;
      mockIndexarCatalogo.mockResolvedValueOnce(totalEsperado);

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosIndexados).toBe(totalEsperado);
    });

    it('[RN-IA-003] deve acionar o serviço de indexação ao receber requisição válida', async () => {
      await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(mockIndexarCatalogo).toHaveBeenCalled();
    });

    it('[RN-IA-003] deve retornar mensagem de sucesso indicando conclusão da operação', async () => {
      mockIndexarCatalogo.mockResolvedValueOnce(3);

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(resposta.status).toBe(200);
      expect(typeof resposta.body.dados.mensagem).toBe('string');
      expect(resposta.body.dados.mensagem.length).toBeGreaterThan(0);
    });
  });

  describe('Tratamento de Falha na Indexação', () => {
    it('[RN-IA-003] deve retornar 500 quando ChromaDB está indisponível durante a indexação', async () => {
      mockIndexarCatalogo.mockRejectedValueOnce(
        new Error('Falha de conexão com ChromaDB durante a indexação do catálogo')
      );

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-003] deve retornar 500 quando geração de embeddings em lote falha', async () => {
      mockGerarEmbeddingsLote.mockRejectedValueOnce(
        new Error('Quota de embeddings esgotada para indexação em lote')
      );

      mockIndexarCatalogo.mockRejectedValueOnce(
        new Error('Falha na geração de embeddings em lote')
      );

      const resposta = await request(contexto.app)
        .post('/api/ia/reindexar')
        .set('Cookie', [`token=${tokenAdmin}`]);

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  describe('Endpoint de Saúde', () => {
    it('[RN-IA-003] deve retornar 200 no endpoint de saúde sem autenticação', async () => {
      const resposta = await request(contexto.app)
        .get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RN-IA-003] deve retornar status de saúde com campo de serviço', async () => {
      const resposta = await request(contexto.app)
        .get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados).toBeDefined();
    });
  });
});
