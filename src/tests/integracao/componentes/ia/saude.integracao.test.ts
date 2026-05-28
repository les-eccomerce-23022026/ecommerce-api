/**
 * Testes de Integração — Health check do módulo IA (GET /api/ia/saude)
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockValidarConexaoGemini,
  mockVerificarConexaoChroma,
  reiniciarMocksIa,
} from '@/tests/helpers/setupMocksIA.util';

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

describe('[RF-IA] Integração - Saúde do módulo IA (GET /api/ia/saude)', () => {
  const contexto = configurarTesteIntegracao();

  beforeEach(() => {
    reiniciarMocksIa();
  });

  it('[RF-IA] deve retornar 200 quando ChromaDB e Gemini estão disponíveis', async () => {
    const resposta = await request(contexto.app).get('/api/ia/saude');

    expect(resposta.status).toBe(200);
    expect(resposta.body.sucesso).toBe(true);
  });

  it('[RF-IA] deve retornar status degradado quando ChromaDB está indisponível', async () => {
    mockVerificarConexaoChroma.mockResolvedValueOnce(false);

    const resposta = await request(contexto.app).get('/api/ia/saude');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados).toBeDefined();
  });

  it('[RF-IA] deve retornar status degradado quando Gemini está indisponível', async () => {
    mockValidarConexaoGemini.mockResolvedValueOnce(false);

    const resposta = await request(contexto.app).get('/api/ia/saude');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados).toBeDefined();
  });
});
