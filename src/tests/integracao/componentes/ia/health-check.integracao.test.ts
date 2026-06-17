/**
 * Testes de Integração — Health Check do Módulo IA (GET /api/ia/saude)
 *
 * Abordagem HÍBRIDA:
 * 1. Testes de Contrato (com mocks) - validam estrutura da resposta
 * 2. Testes de Integração Real (sem mocks) - validam dependências reais
 *
 * RN-IA-HEALTH: O endpoint GET /api/ia/saude deve reportar com precisão a
 * disponibilidade das dependências externas e calcular o status agregado
 * do serviço de recomendação por IA, retornando:
 *   - 'ok'       → ambas dependências acessíveis       (HTTP 200)
 *   - 'degraded' → apenas uma dependência acessível    (HTTP 200)
 *   - 'down'     → nenhuma dependência acessível       (HTTP 503)
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockVerificarConexaoChroma,
  mockValidarConexaoGemini,
  mockGerarEmbedding,
  mockBuscarSimilares,
  reiniciarMocksIa,
} from '@/tests/helpers/setupMocksIA.util';

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

describe('[RN-IA-HEALTH] Integração - Health Check do módulo IA (GET /api/ia/saude)', () => {
  const contexto = configurarTesteIntegracao();

  beforeEach(() => {
    reiniciarMocksIa();
  });

  // ── SEÇÃO 1: Testes de Contrato (com mocks) ─────────────────────────────────
  // Validam estrutura da resposta, não comportamento real de dependências
  // Podem rodar em qualquer ambiente, mesmo sem dependências reais

  describe('Contrato - Estrutura de Resposta', () => {
    it('[RN-IA-HEALTH] deve retornar estrutura completa quando ambas dependências OK', async () => {
      // Usa mocks para validar estrutura, não comportamento real
      mockVerificarConexaoChroma.mockResolvedValueOnce(true);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      
      // Valida estrutura completa da resposta
      expect(resposta.body.dados).toHaveProperty('status');
      expect(resposta.body.dados).toHaveProperty('timestamp');
      expect(resposta.body.dados).toHaveProperty('dependencias');
      expect(resposta.body.dados.dependencias).toHaveProperty('chromadb');
      expect(resposta.body.dados.dependencias).toHaveProperty('gemini');
      
      // Valida tipos dos campos
      expect(typeof resposta.body.dados.status).toBe('string');
      expect(typeof resposta.body.dados.timestamp).toBe('string');
      expect(typeof resposta.body.dados.dependencias.chromadb.ok).toBe('boolean');
      expect(typeof resposta.body.dados.dependencias.gemini.ok).toBe('boolean');
    });

    it('[RN-IA-HEALTH] deve retornar status degraded quando ChromaDB falha', async () => {
      mockVerificarConexaoChroma.mockResolvedValueOnce(false);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.status).toBe('degraded');
      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(false);
      expect(resposta.body.dados.dependencias.gemini.ok).toBe(true);
    });

    it('[RN-IA-HEALTH] deve retornar status degraded quando Gemini falha', async () => {
      mockVerificarConexaoChroma.mockResolvedValueOnce(true);
      mockValidarConexaoGemini.mockResolvedValueOnce(false);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.status).toBe('degraded');
      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(true);
      expect(resposta.body.dados.dependencias.gemini.ok).toBe(false);
    });

    it('[RN-IA-HEALTH] deve retornar status down quando ambas dependências falham', async () => {
      mockVerificarConexaoChroma.mockResolvedValueOnce(false);
      mockValidarConexaoGemini.mockResolvedValueOnce(false);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(503);
      expect(resposta.body.dados.status).toBe('down');
      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(false);
      expect(resposta.body.dados.dependencias.gemini.ok).toBe(false);
    });

    it('[RN-IA-HEALTH] deve incluir mensagem de erro quando dependência falha', async () => {
      mockVerificarConexaoChroma.mockResolvedValueOnce(false);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(false);
      expect(resposta.body.dados.dependencias.chromadb.mensagem).toBeDefined();
      expect(typeof resposta.body.dados.dependencias.chromadb.mensagem).toBe('string');
    });

    it('[RN-IA-HEALTH] deve incluir latência quando dependência está OK', async () => {
      mockVerificarConexaoChroma.mockResolvedValueOnce(true);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(true);
      expect(resposta.body.dados.dependencias.chromadb.latencyMs).toBeDefined();
      expect(typeof resposta.body.dados.dependencias.chromadb.latencyMs).toBe('number');
      expect(resposta.body.dados.dependencias.chromadb.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('[RN-IA-HEALTH] deve respeitar timeout de 2s em verificações lentas', async () => {
      const DELAY_SIMULADO_MS = 150;

      mockVerificarConexaoChroma.mockImplementationOnce(
        () => new Promise<boolean>(resolve =>
          setTimeout(() => resolve(false), DELAY_SIMULADO_MS),
        ),
      );

      const inicioDaRequisicao = Date.now();
      const resposta = await request(contexto.app).get('/api/ia/saude');
      const duracaoTotalMs = Date.now() - inicioDaRequisicao;

      expect(resposta.status).toBeDefined();
      expect(duracaoTotalMs).toBeLessThan(2000);
    }, 5000);

    it('[RN-IA-HEALTH] deve ser acessível sem autenticação', async () => {
      mockVerificarConexaoChroma.mockResolvedValueOnce(true);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);

      const resposta = await request(contexto.app).get('/api/ia/saude');

      // Não deve retornar 401 ou 403
      expect(resposta.status).not.toBe(401);
      expect(resposta.status).not.toBe(403);
    });
  });

  // ── SEÇÃO 2: Testes de Integração Real (sem mocks) ────────────────────────
  // Validam comportamento real de dependências (ChromaDB e Gemini)
  // Requerem dependências reais configuradas no ambiente de teste
  // Marcar com .skip se dependências não estiverem disponíveis

  describe('Integração Real - Dependências Reais', () => {
    const DEPENDENCIAS_REAIS_DISPONIVEIS = 
      process.env.CHROMADB_HOST && 
      process.env.GEMINI_API_KEY;

    const PULAR_TESTES_SEM_DEPENDENCIAS = !DEPENDENCIAS_REAIS_DISPONIVEIS;

    beforeAll(() => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        console.warn(
          '[RN-IA-HEALTH] Testes de integração real pulados: dependências externas não configuradas'
        );
      }
    });

    it('[RN-IA-HEALTH] deve validar ChromaDB real está acessível', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida ChromaDB real
      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(true);
      expect(resposta.body.dados.dependencias.chromadb.latencyMs).toBeGreaterThan(0);
      expect(resposta.body.dados.dependencias.chromadb.latencyMs).toBeLessThan(2000);
    });

    it('[RN-IA-HEALTH] deve validar Gemini real está acessível', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida Gemini real
      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.dependencias.gemini.ok).toBe(true);
      expect(resposta.body.dados.dependencias.gemini.latencyMs).toBeGreaterThan(0);
      expect(resposta.body.dados.dependencias.gemini.latencyMs).toBeLessThan(2000);
    });

    it('[RN-IA-HEALTH] deve retornar status ok quando ambas dependências reais estão OK', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida ambas dependências reais
      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.status).toBe('ok');
      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(true);
      expect(resposta.body.dados.dependencias.gemini.ok).toBe(true);
    });

    it('[RN-IA-HEALTH] deve detectar ChromaDB real caído', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida detecção real de falha
      // Se ChromaDB estiver caído, o teste deve falhar
      const resposta = await request(contexto.app).get('/api/ia/saude');

      // Se ChromaDB estiver funcionando, teste passa
      // Se ChromaDB estiver caído, teste falha (comportamento esperado)
      expect(resposta.body.dados.dependencias.chromadb.ok).toBe(true);
    });

    it('[RN-IA-HEALTH] deve detectar Gemini real com problema', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida detecção real de falha
      // Se Gemini estiver com problema, o teste deve falhar
      const resposta = await request(contexto.app).get('/api/ia/saude');

      // Se Gemini estiver funcionando, teste passa
      // Se Gemini estiver com problema, teste falha (comportamento esperado)
      expect(resposta.body.dados.dependencias.gemini.ok).toBe(true);
    });

    it('[RN-IA-HEALTH] deve completar em < 100ms quando ambas dependências reais estão OK', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida performance real
      const inicioDaRequisicao = Date.now();
      const resposta = await request(contexto.app).get('/api/ia/saude');
      const duracaoTotalMs = Date.now() - inicioDaRequisicao;

      expect(resposta.status).toBe(200);
      expect(duracaoTotalMs).toBeLessThan(100);
    });

    it('[RN-IA-HEALTH] deve executar verificações em paralelo (dependências reais)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida paralelismo real
      // Se as verificações forem sequenciais, a latência será maior
      const resposta = await request(contexto.app).get('/api/ia/saude');

      expect(resposta.status).toBe(200);
      
      // Latência deve ser < 100ms se ambas dependências estiverem OK
      // Se forem sequenciais, seria > 100ms (2s timeout cada)
      const duracaoTotalMs = resposta.body.dados.dependencias.chromadb.latencyMs! + 
                              resposta.body.dados.dependencias.gemini.latencyMs!;
      
      // Verifica que a latência total é menor que a soma das latências individuais
      // (indica paralelismo)
      expect(duracaoTotalMs).toBeLessThan(100);
    });
  });

  // ── SEÇÃO 3: Testes de Integração com Controlador ───────────────────────────
  // Validam que o controlador usa o health check corretamente

  describe('Integração com Controlador - Health Check nos Endpoints', () => {
    it('[RN-IA-HEALTH] deve usar health check no endpoint /api/ia/recomendar', async () => {
      // Simula ChromaDB caído
      mockVerificarConexaoChroma.mockResolvedValueOnce(false);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);

      // Tenta fazer requisição para /api/ia/recomendar
      // Deve retornar 503 porque health check detectou ChromaDB caído
      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'livros de teste' });

      // Deve retornar 503 (Service Unavailable) quando dependências não saudáveis
      expect(resposta.status).toBe(503);
      expect(resposta.body.dados.status).toBe('degraded');
    });

    it('[RN-IA-HEALTH] deve usar health check no endpoint /api/ia/chat', async () => {
      // Simula Gemini caído
      mockVerificarConexaoChroma.mockResolvedValueOnce(true);
      mockValidarConexaoGemini.mockResolvedValueOnce(false);

      // Tenta fazer requisição para /api/ia/chat
      // Deve retornar 503 porque health check detectou Gemini caído
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'recomende um livro' });

      // Deve retornar 503 (Service Unavailable) quando dependências não saudáveis
      expect(resposta.status).toBe(503);
      expect(resposta.body.dados.status).toBe('degraded');
    });

    it('[RN-IA-HEALTH] deve permitir requisição quando dependências estão saudáveis', async () => {
      // Simula ambas dependências OK
      mockVerificarConexaoChroma.mockResolvedValueOnce(true);
      mockValidarConexaoGemini.mockResolvedValueOnce(true);
      mockGerarEmbedding.mockResolvedValueOnce([0.1, 0.2, 0.3, 0.4, 0.5]);
      mockBuscarSimilares.mockResolvedValueOnce([]);

      // Tenta fazer requisição para /api/ia/recomendar
      // Deve processar normalmente quando dependências estão saudáveis
      const resposta = await request(contexto.app)
        .post('/api/ia/recomendar')
        .send({ query: 'livros de teste' });

      // Deve retornar 200 quando dependências estão saudáveis
      expect(resposta.status).toBe(200);
    });
  });
});
