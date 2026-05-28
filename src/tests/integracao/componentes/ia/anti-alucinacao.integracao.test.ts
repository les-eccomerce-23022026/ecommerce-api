/**
 * Testes de Integração — Anti-Alucinação da IA (RN-IA-002)
 *
 * Verifica que a IA nunca retorna produtos inventados. Todos os UUIDs
 * presentes na resposta devem corresponder a embeddings indexados no
 * ChromaDB, que por sua vez refletem o catálogo real de produtos.
 *
 * RN-IA-002: Produtos retornados pela IA devem existir no catálogo.
 */

// Funções mock declaradas ANTES dos jest.mock (prefixo 'mock' isenta do hoisting)
const mockGerarEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
const mockGerarEmbeddingsLote = jest.fn().mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5]]);
const mockGerarRespostaChat = jest.fn().mockResolvedValue(
  'Com base no catálogo da nossa livraria, recomendo os seguintes títulos disponíveis em estoque.'
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

describe('[RN-IA-002] Integração - Anti-Alucinação da IA', () => {
  const contexto = configurarTesteIntegracao();

  describe('Recomendação com Lista Vazia do ChromaDB', () => {
    it('[RN-IA-002] deve retornar lista de produtos vazia quando ChromaDB não tem resultados', async () => {
      // Arrange: ChromaDB não encontra nenhum produto similar
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'assunto sem nenhum livro no catálogo' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtos).toHaveLength(0);
      expect(resposta.body.dados.totalEncontrados).toBe(0);
    });

    it('[RN-IA-002] deve retornar totalValidos zero quando nenhum produto é encontrado', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'temática com ausência no catálogo' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.totalValidos).toBe(0);
    });
  });

  describe('Recomendação com Produtos Indexados no ChromaDB', () => {
    it('[RN-IA-002] deve retornar somente os produtoUuids presentes no índice semântico', async () => {
      // Arrange: 2 produtos indexados com metadados completos
      const uuidProduto1 = 'aab11111-0000-0000-0000-000000000001';
      const uuidProduto2 = 'aab22222-0000-0000-0000-000000000002';

      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: uuidProduto1,
          similaridade: 0.97,
          metadados: {
            titulo: 'Design Patterns',
            autor: 'Gang of Four',
            categoria: 'Tecnologia',
            isbn: '978-0201633610',
            preco: 120.00,
          },
        },
        {
          produtoUuid: uuidProduto2,
          similaridade: 0.91,
          metadados: {
            titulo: 'Refactoring',
            autor: 'Martin Fowler',
            categoria: 'Tecnologia',
            isbn: '978-0201485677',
            preco: 95.00,
          },
        },
      ]);

      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'padrões de projeto e refatoração de software' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.totalEncontrados).toBe(2);

      const uuidsRetornados = resposta.body.dados.produtos.map(
        (p: { produtoUuid: string }) => p.produtoUuid
      );
      // Todos os UUIDs retornados devem estar no conjunto indexado
      uuidsRetornados.forEach((uuid: string) => {
        expect([uuidProduto1, uuidProduto2]).toContain(uuid);
      });
    });

    it('[RN-IA-002] deve incluir similaridade nos metadados de cada produto retornado', async () => {
      const uuid = 'cc333333-0000-0000-0000-000000000003';

      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: uuid,
          similaridade: 0.88,
          metadados: {
            titulo: 'Código Limpo',
            autor: 'Robert C. Martin',
            categoria: 'Tecnologia',
            isbn: '978-8576082675',
            preco: 79.90,
          },
        },
      ]);

      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'boas práticas de codificação' });

      expect(resposta.status).toBe(200);
      if (resposta.body.dados.produtos.length > 0) {
        const produto = resposta.body.dados.produtos[0];
        expect(produto).toHaveProperty('produtoUuid');
        expect(produto).toHaveProperty('similaridade');
        expect(typeof produto.similaridade).toBe('number');
        expect(produto.similaridade).toBeGreaterThanOrEqual(0);
        expect(produto.similaridade).toBeLessThanOrEqual(1);
      }
    });

    it('[RN-IA-002] deve respeitar o limite informado ao truncar os resultados do ChromaDB', async () => {
      const produtosMockados = Array.from({ length: 10 }, (_, i) => ({
        produtoUuid: `dd${String(i).padStart(6, '0')}-0000-0000-0000-${String(i).padStart(12, '0')}`,
        similaridade: 0.9 - i * 0.02,
        metadados: {
          titulo: `Livro Indexado ${i + 1}`,
          autor: `Autor ${i + 1}`,
          categoria: 'Geral',
          isbn: `978-000000000${i}`,
          preco: 50.00 + i,
        },
      }));

      mockBuscarSimilares.mockResolvedValueOnce(produtosMockados);

      const limiteInformado = 3;
      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'qualquer busca', limite: limiteInformado });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtos.length).toBeLessThanOrEqual(limiteInformado);
    });
  });

  describe('Chat com Produtos do Catálogo', () => {
    it('[RN-IA-002] deve incluir apenas produtos existentes no índice na resposta do chat', async () => {
      const uuidProdutoCatalogo = 'ee444444-0000-0000-0000-000000000004';

      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: uuidProdutoCatalogo,
          similaridade: 0.93,
          metadados: {
            titulo: 'O Alquimista',
            autor: 'Paulo Coelho',
            categoria: 'Literatura Brasileira',
            isbn: '978-8585920050',
            preco: 39.90,
          },
        },
      ]);

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Indique um livro de Paulo Coelho disponível' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados).toHaveProperty('produtosRecomendados');
      expect(Array.isArray(resposta.body.dados.produtosRecomendados)).toBe(true);

      // Nenhum produto invented — todos devem ter sido retornados pelo ChromaDB
      const uuidsRelacionados = resposta.body.dados.produtosRecomendados.map(
        (p: { produtoUuid: string }) => p.produtoUuid
      );
      uuidsRelacionados.forEach((uuid: string) => {
        expect(uuid).toBe(uuidProdutoCatalogo);
      });
    });

    it('[RN-IA-002] deve retornar produtosRelacionados vazio quando ChromaDB não encontra similares', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Existe algum livro sobre culinária molecular?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosRecomendados).toHaveLength(0);
    });
  });

  describe('Consistência Entre Campos de Contagem', () => {
    it('[RN-IA-002] totalEncontrados deve refletir o número real de resultados do ChromaDB', async () => {
      const quantidadeIndexada = 4;

      mockBuscarSimilares.mockResolvedValueOnce(
        Array.from({ length: quantidadeIndexada }, (_, i) => ({
          produtoUuid: `ff${String(i).padStart(6, '0')}-0000-0000-0000-${String(i).padStart(12, '0')}`,
          similaridade: 0.85,
          metadados: {
            titulo: `Livro ${i + 1}`,
            autor: `Autor ${i + 1}`,
            categoria: 'Ficção',
            isbn: `978-111111111${i}`,
            preco: 45.00,
          },
        }))
      );

      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'ficção científica clássica' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.totalEncontrados).toBe(quantidadeIndexada);
    });

    it('[RN-IA-002] totalValidos não deve exceder totalEncontrados', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: 'aa000001-0000-0000-0000-000000000001',
          similaridade: 0.90,
          metadados: {
            titulo: 'Neuromancer',
            autor: 'William Gibson',
            categoria: 'Ficção Científica',
            isbn: '978-0441569595',
            preco: 59.90,
          },
        },
      ]);

      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'cyberpunk clássico' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.totalValidos).toBeLessThanOrEqual(
        resposta.body.dados.totalEncontrados
      );
    });
  });
});
