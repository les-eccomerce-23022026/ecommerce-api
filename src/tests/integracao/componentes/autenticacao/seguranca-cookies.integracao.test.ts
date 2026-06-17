import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import {
  gerarCpfValidoUnico,
  realizarLogin,
  registrarCliente,
} from '@/tests/helpers/requisicoes-api.util';
import { obterNomeCookieAuth } from '@/shared/constants/auth-cookie';

/**
 * Testes de integração — autenticação via cookie HttpOnly (les_token).
 */
describe('Integração - Segurança de Cookies de Autenticação', () => {
  const contexto = configurarTesteIntegracao();
  const nomeCookie = obterNomeCookieAuth();

  describe('POST /api/auth/login', () => {
    it('[SEGURANÇA] deve emitir cookie les_token com HttpOnly e SameSite após login válido', async () => {
      const email = `cookie.login.${Date.now()}@teste.com`;
      await registrarCliente(contexto.app, {
        email,
        cpf: gerarCpfValidoUnico(),
      });

      const loginRes = await realizarLogin(contexto.app, email, 'SenhaForte@123');

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
      expect(cookieHeader).toMatch(new RegExp(`${nomeCookie}=`, 'i'));
      expect(cookieHeader.toLowerCase()).toContain('httponly');
      expect(cookieHeader.toLowerCase()).toMatch(/samesite=(strict|lax)/i);
    });

    it('[SEGURANÇA] deve permitir acesso autenticado ao perfil usando apenas o cookie les_token', async () => {
      const email = `cookie.perfil.${Date.now()}@teste.com`;
      await registrarCliente(contexto.app, {
        email,
        cpf: gerarCpfValidoUnico(),
      });

      const loginRes = await realizarLogin(contexto.app, email, 'SenhaForte@123');
      expect(loginRes.status).toBe(200);

      const resposta = await request(contexto.app)
        .get('/api/clientes/perfil')
        .set('Cookie', loginRes.headers['set-cookie']);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });
});
