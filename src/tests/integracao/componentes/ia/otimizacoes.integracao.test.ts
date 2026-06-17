/**
 * Testes de Integração — Otimizações de Performance do Módulo IA
 *
 * Valida o comportamento observável das otimizações implementadas:
 *   1. Cache de produtos existentes (TTL 5 minutos) — RN-IA-001
 *   2. Cache de contexto de cliente (escopo da requisição)
 *   3. Validação antecipada de entrada (antes da geração de embedding)
 *   4. Multiplicador dinâmico de busca ChromaDB (2x com contexto / 3x sem)
 *
 * Abordagem: comportamento observável via HTTP + inspeção de mocks.
 * Não testa internals do cache (TTL, Map), apenas o contrato da API.
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockBuscarContexto,
  mockBuscarSimilares,
  mockGerarEmbedding,
  reiniciarMocksIa,
} from '@/tests/helpers/setupMocksIA.util';

import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import {
  obterTokenClienteParaIa,
  postIaChat,
  postIaRecomendar,
} from '@/tests/helpers/ia-integracao.helper';

describe('[RNF-IA-PERF] Integração - Otimizações de Performance do Módulo IA', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  beforeEach(async () => {
    reiniciarMocksIa();
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Cache de Produtos Existentes
  // ─────────────────────────────────────────────────────────────────────────

  describe('Cache de Produtos Existentes (TTL 5 minutos)', () => {
    it('[RN-IA-001] deve retornar 200 na primeira requisição (cache miss, carrega do BD)', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de ficção científica' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.produtos).toBeDefined();
    });

    it('[RN-IA-001] deve retornar 200 em requisições consecutivas (cache hit na segunda)', async () => {
      mockBuscarSimilares.mockResolvedValue([]);

      // Primeira requisição — popula o cache de produtos
      const respostaPrimeira = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de aventura' });

      // Segunda requisição — deve usar o cache (sem nova consulta ao catálogo)
      const respostaSegunda = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de fantasia' });

      expect(respostaPrimeira.status).toBe(200);
      expect(respostaSegunda.status).toBe(200);
      expect(respostaPrimeira.body.sucesso).toBe(true);
      expect(respostaSegunda.body.sucesso).toBe(true);
    });

    it('[RN-IA-001] deve retornar estrutura válida mesmo com catálogo sem resultados similares', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'tema incomum sem livros' });

      expect(resposta.status).toBe(200);
      expect(Array.isArray(resposta.body.dados.produtos)).toBe(true);
      expect(resposta.body.dados.totalEncontrados).toBe(0);
      expect(resposta.body.dados.totalValidos).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Cache de Contexto de Cliente (escopo da requisição)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Cache de Contexto de Cliente por Requisição', () => {
    it('[RNF-IA-PERF] deve consultar contexto do cliente exatamente uma vez por requisição de recomendação', async () => {
      mockBuscarContexto.mockResolvedValue(null);
      mockBuscarSimilares.mockResolvedValue([]);

      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de história clássica' });

      // O cache de requisição garante que o banco não seja consultado mais de uma vez
      // pelo mesmo clienteUuid dentro do mesmo fluxo de recomendação
      expect(mockBuscarContexto).toHaveBeenCalledTimes(1);
    });

    it('[RNF-IA-PERF] deve consultar contexto do cliente exatamente uma vez por requisição de chat', async () => {
      mockBuscarContexto.mockResolvedValue(null);
      mockBuscarSimilares.mockResolvedValue([]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quero um livro de romance histórico' });

      expect(mockBuscarContexto).toHaveBeenCalledTimes(1);
    });

    it('[RNF-IA-PERF] deve retornar contextoUsado=false quando cliente não tem histórico no BD', async () => {
      mockBuscarContexto.mockResolvedValue(null);
      mockBuscarSimilares.mockResolvedValue([]);

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de tecnologia' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.contextoUsado).toBe(false);
    });

    it('[RNF-IA-PERF] deve retornar contextoUsado=true quando cliente tem perfil com histórico', async () => {
      mockBuscarContexto.mockResolvedValue({
        clienteUuid: 'cliente-uuid-teste',
        historicoCompras: [
          {
            produtoUuid: 'prod-uuid-001',
            titulo: 'Clean Code',
            categoria: 'Tecnologia',
            dataCompra: new Date(),
          },
        ],
        preferencias: {
          categorias: ['Tecnologia'],
          autores: ['Robert C. Martin'],
          faixaPreco: { min: 0, max: 200 },
        },
      });
      mockBuscarSimilares.mockResolvedValue([]);

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de programação orientada a objetos' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.contextoUsado).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Validação Antecipada de Entrada (antes da geração de embedding)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Validação Antecipada — Endpoint POST /api/ia/recomendar', () => {
    it('[RNF-IA-PERF] deve retornar 400 quando query tem menos de 3 caracteres (tamanho mínimo)', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'ab' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/mínimo/i);
    });

    it('[RNF-IA-PERF] deve retornar 400 quando query tem exatamente 1 caractere', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'a' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RNF-IA-PERF] deve retornar 400 quando query contém apenas caracteres especiais', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: '!!!' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/alfanumérico/i);
    });

    it('[RNF-IA-PERF] deve retornar 400 quando query contém apenas pontuação e traços', async () => {
      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: '---' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RNF-IA-PERF] deve aceitar query com exatamente 3 caracteres alfanuméricos', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'abc' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RNF-IA-PERF] não deve chamar geração de embedding quando query é muito curta', async () => {
      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'ab' });

      // Validação antecipada bloqueia antes da chamada custosa ao modelo de embedding
      expect(mockGerarEmbedding).not.toHaveBeenCalled();
    });

    it('[RNF-IA-PERF] não deve chamar geração de embedding quando query tem apenas especiais', async () => {
      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: '????' });

      expect(mockGerarEmbedding).not.toHaveBeenCalled();
    });
  });

  describe('Validação Antecipada — Endpoint POST /api/ia/chat', () => {
    it('[RNF-IA-PERF] deve retornar 400 quando mensagem tem menos de 3 caracteres', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'oi' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/mínimo/i);
    });

    it('[RNF-IA-PERF] deve retornar 400 quando mensagem contém apenas caracteres especiais', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: '@@@' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/alfanumérico/i);
    });

    it('[RNF-IA-PERF] deve aceitar mensagem com exatamente 3 caracteres válidos', async () => {
      mockBuscarSimilares.mockResolvedValueOnce([]);

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'ola' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RNF-IA-PERF] não deve chamar geração de embedding quando mensagem de chat é inválida', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: '!!' });

      expect(mockGerarEmbedding).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Multiplicador Dinâmico de Busca ChromaDB
  // ─────────────────────────────────────────────────────────────────────────

  describe('Multiplicador Dinâmico de Busca ChromaDB', () => {
    it('[RNF-IA-PERF] deve chamar buscarSimilares com temContexto=false quando cliente não tem histórico', async () => {
      mockBuscarContexto.mockResolvedValue(null);
      mockBuscarSimilares.mockResolvedValue([]);

      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de suspense policial' });

      // Sem contexto → temContexto=false → multiplicador 3x (maior cobertura compensa incerteza)
      expect(mockBuscarSimilares).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Number),
        expect.objectContaining({ temContexto: false })
      );
    });

    it('[RNF-IA-PERF] deve chamar buscarSimilares com temContexto=true quando cliente tem histórico', async () => {
      mockBuscarContexto.mockResolvedValue({
        clienteUuid: 'cliente-com-historico',
        historicoCompras: [
          {
            produtoUuid: 'livro-uuid-001',
            titulo: 'O Senhor dos Anéis',
            categoria: 'Fantasia',
            dataCompra: new Date(),
          },
        ],
        preferencias: {
          categorias: ['Fantasia'],
          autores: ['J.R.R. Tolkien'],
          faixaPreco: { min: 0, max: 150 },
        },
      });
      mockBuscarSimilares.mockResolvedValue([]);

      await postIaRecomendar(contexto.app, tokenCliente)
        .send({ query: 'livros de fantasia medieval' });

      // Com contexto → temContexto=true → multiplicador 2x (sinal personalizado reduz incerteza)
      expect(mockBuscarSimilares).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Number),
        expect.objectContaining({ temContexto: true })
      );
    });

    it('[RNF-IA-PERF] deve chamar buscarSimilares com temContexto=false no chat sem histórico de cliente', async () => {
      mockBuscarContexto.mockResolvedValue(null);
      mockBuscarSimilares.mockResolvedValue([]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quero recomendações de livros de terror' });

      expect(mockBuscarSimilares).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Number),
        expect.objectContaining({ temContexto: false })
      );
    });

    it('[RNF-IA-PERF] deve chamar buscarSimilares com temContexto=true no chat com histórico de cliente', async () => {
      mockBuscarContexto.mockResolvedValue({
        clienteUuid: 'cliente-chat-historico',
        historicoCompras: [
          {
            produtoUuid: 'livro-uuid-002',
            titulo: 'Duna',
            categoria: 'Ficção Científica',
            dataCompra: new Date(),
          },
        ],
        preferencias: {
          categorias: ['Ficção Científica'],
          autores: ['Frank Herbert'],
          faixaPreco: { min: 0, max: 200 },
        },
      });
      mockBuscarSimilares.mockResolvedValue([]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quero mais ficção científica como Duna' });

      expect(mockBuscarSimilares).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Number),
        expect.objectContaining({ temContexto: true })
      );
    });
  });
});
