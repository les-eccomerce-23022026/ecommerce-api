/**
 * Testes de Integração — Endpoint de Recomendação de Produtos
 *
 * Verifica o comportamento do endpoint POST /api/ia/recomendar:
 * validação de entrada, estrutura de resposta e integração com
 * serviços externos (Gemini e ChromaDB mockados).
 *
 * RN-IA-001: Motor de recomendação deve retornar apenas produtos
 * existentes no catálogo.
 */

import '@/tests/helpers/setupMocksIA.util';
import { mockBuscarSimilares, mockGerarEmbedding } from '@/tests/helpers/setupMocksIA.util';

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenClienteParaIa, postIaRecomendar } from '@/tests/helpers/ia-integracao.helper';

describe('[RF-IA-01] Integração - Recomendação de Produtos (POST /api/ia/recomendar)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  beforeEach(async () => {
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
  });

  describe('Controle de Acesso', () => {
    it('[RN-IA-001] deve retornar 401 quando requisição é feita sem autenticação', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'livros de aventura' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  describe('Validação de Entrada', () => {
    it('[RN-IA-001] deve retornar 400 quando query não é fornecida no corpo', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/query/i);
    });

    it('[RN-IA-001] deve retornar 400 quando query é string vazia', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: '' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-001] deve retornar 400 quando query contém apenas espaços em branco', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: '   ' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-001] deve retornar 400 quando query não é do tipo string', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 12345 });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-001] deve retornar 400 quando limite é zero', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de ficção científica', limite: 0 });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/limite/i);
    });

    it('[RN-IA-001] deve retornar 400 quando limite é negativo', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de fantasia', limite: -5 });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-001] deve retornar 400 quando limite excede 20', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'romances clássicos', limite: 21 });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/limite/i);
    });

    it('[RN-IA-001] deve retornar 400 quando limite não é número', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'literatura brasileira', limite: 'cinco' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  describe('Retorno com Sucesso', () => {
    it('[RN-IA-001] deve retornar 200 com estrutura completa para query válida', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de programação em TypeScript' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados).toHaveProperty('query');
      expect(resposta.body.dados).toHaveProperty('produtos');
      expect(resposta.body.dados).toHaveProperty('contextoUsado');
      expect(resposta.body.dados).toHaveProperty('totalEncontrados');
      expect(resposta.body.dados).toHaveProperty('totalValidos');
      expect(resposta.body.dados).toHaveProperty('tempoRespostaMs');
      expect(Array.isArray(resposta.body.dados.produtos)).toBe(true);
    });

    it('[RN-IA-001] deve ecoar a query original na resposta', async () => {
      const queryOriginal = 'livros de JavaScript para iniciantes';

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: queryOriginal });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.query).toBe(queryOriginal);
    });

    it('[RN-IA-001] deve retornar contextoUsado como false quando clienteUuid não é fornecido', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'romances históricos' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.contextoUsado).toBe(false);
    });

    it('[RN-IA-001] deve aceitar limite válido igual a 1', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de ciências exatas', limite: 1 });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RN-IA-001] deve aceitar limite válido igual a 20', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'obras filosóficas', limite: 20 });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RN-IA-001] deve retornar tempoRespostaMs como número não-negativo', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'aventura e fantasia medieval' });

      expect(resposta.status).toBe(200);
      expect(typeof resposta.body.dados.tempoRespostaMs).toBe('number');
      expect(resposta.body.dados.tempoRespostaMs).toBeGreaterThanOrEqual(0);
    });

    it('[RN-IA-001] deve acionar a geração de embedding com a query informada', async () => {
      const queryInformada = 'livros de filosofia grega clássica';

      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: queryInformada });

      expect(mockGerarEmbedding).toHaveBeenCalledWith(queryInformada);
    });

    it('[RN-IA-001] deve consultar o repositório de embeddings ao processar recomendação', async () => {
      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'literatura brasileira contemporânea' });

      expect(mockBuscarSimilares).toHaveBeenCalled();
    });
  });

  describe('Interação com Catálogo de Produtos', () => {
    it('[RN-IA-001] deve retornar totalEncontrados igual ao número de produtos retornados pelo ChromaDB', async () => {
      // Arrange: simula 2 produtos encontrados no índice semântico
      const produtosMockChromaDB = [
        {
          produtoUuid: 'uuid-livro-clean-code',
          similaridade: 0.95,
          metadados: {
            titulo: 'Clean Code',
            autor: 'Robert C. Martin',
            categoria: 'Tecnologia',
            isbn: '978-0132350884',
            preco: 89.90,
          },
        },
        {
          produtoUuid: 'uuid-livro-pragmatic',
          similaridade: 0.87,
          metadados: {
            titulo: 'The Pragmatic Programmer',
            autor: 'David Thomas',
            categoria: 'Tecnologia',
            isbn: '978-0135957059',
            preco: 79.90,
          },
        },
      ];

      mockBuscarSimilares.mockResolvedValueOnce(produtosMockChromaDB);

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'clean code boas práticas de desenvolvimento' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.totalEncontrados).toBe(2);
    });

    it('[RN-IA-001] deve retornar contextoUsado false para clienteUuid sem histórico de compras', async () => {
      const uuidClienteSemHistorico = '00000000-0000-0000-0000-000000000099';

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de romance', clienteUuid: uuidClienteSemHistorico });

      expect(resposta.status).toBe(200);
      // Cliente sem histórico de compras → contexto de personalização não disponível
      expect(resposta.body.dados.contextoUsado).toBe(false);
    });

    it('[RN-IA-001] deve retornar totalValidos como número não-negativo', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'poesia brasileira moderna' });

      expect(resposta.status).toBe(200);
      expect(typeof resposta.body.dados.totalValidos).toBe('number');
      expect(resposta.body.dados.totalValidos).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tratamento de Falha nos Serviços Externos', () => {
    it('[RN-IA-001] deve retornar 500 quando serviço de embedding está indisponível', async () => {
      mockGerarEmbedding.mockRejectedValueOnce(
        new Error('Falha na conexão com o serviço de embedding')
      );

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de culinária italiana' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-001] deve retornar 500 quando repositório de embeddings falha na busca', async () => {
      mockBuscarSimilares.mockRejectedValueOnce(
        new Error('Falha na consulta ao ChromaDB')
      );

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'guias de viagem pela Europa' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });
  });
});
