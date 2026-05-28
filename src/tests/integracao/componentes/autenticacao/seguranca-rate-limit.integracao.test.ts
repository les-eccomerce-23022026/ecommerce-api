import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

/**
 * Testes de integração — rate limit no login (força bruta).
 * Usa chave isolada por cabeçalho para não afetar outros testes da suíte.
 */
describe('Integração - Rate Limit no Login', () => {
  const contexto = configurarTesteIntegracao();
  const chaveRateLimit = `rate-limit-test-${Date.now()}`;
  let valorAnteriorForcarRateLimit: string | undefined;

  beforeAll(() => {
    valorAnteriorForcarRateLimit = process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE;
    process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE = 'true';
  });

  afterAll(() => {
    if (valorAnteriorForcarRateLimit === undefined) {
      delete process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE;
    } else {
      process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE = valorAnteriorForcarRateLimit;
    }
  });

  it('[SEGURANÇA] deve retornar 429 após exceder o limite de tentativas de login falhas', async () => {
    const credenciais = { email: 'inexistente@rate.limit.test', senha: 'SenhaErrada@999' };

    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      // eslint-disable-next-line no-await-in-loop
      const resposta = await request(contexto.app)
        .post('/api/auth/login')
        .set('X-Test-Rate-Limit-Key', chaveRateLimit)
        .send(credenciais);

      expect(resposta.status).not.toBe(429);
    }

    const bloqueio = await request(contexto.app)
      .post('/api/auth/login')
      .set('X-Test-Rate-Limit-Key', chaveRateLimit)
      .send(credenciais);

    expect(bloqueio.status).toBe(429);
    expect(bloqueio.body.sucesso).toBe(false);
    expect(bloqueio.body.mensagem).toMatch(/muitas tentativas/i);
  });
});
