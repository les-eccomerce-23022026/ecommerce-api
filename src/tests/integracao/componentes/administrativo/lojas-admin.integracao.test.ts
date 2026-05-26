import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin } from '@/tests/helpers/requisicoes-api.util';

/**
 * Testes de integração para o endpoint de lojas do administrador.
 * Verifica a obtenção de lojas associadas ao administrador autenticado.
 */
describe('Integração — Lojas do Administrador', () => {
  const contexto = configurarTesteIntegracao();

  describe('GET /api/admin/lojas/minhas-lojas', () => {
    describe('cenários de sucesso', () => {
      it('retorna 200 e lista de lojas do administrador autenticado', async () => {
        const tokenAdmin = await obterTokenAdmin(contexto.app);

        const res = await request(contexto.app)
          .get('/api/admin/lojas/minhas-lojas')
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(Array.isArray(res.body.dados)).toBe(true);
        
        // Validar estrutura de cada loja retornada
        if (res.body.dados.length > 0) {
          const loja = res.body.dados[0];
          expect(loja).toHaveProperty('uuid');
          expect(loja).toHaveProperty('nome');
          expect(loja).toHaveProperty('slug');
          expect(loja).toHaveProperty('cnpj');
          expect(loja).toHaveProperty('ativo');
          
          // Validar tipos
          expect(typeof loja.uuid).toBe('string');
          expect(typeof loja.nome).toBe('string');
          expect(typeof loja.slug).toBe('string');
          expect(typeof loja.cnpj).toBe('string');
          expect(typeof loja.ativo).toBe('boolean');
        }
      });
    });

    describe('cenários de falha (autenticação)', () => {
      it('retorna 401 quando não fornece token', async () => {
        const res = await request(contexto.app)
          .get('/api/admin/lojas/minhas-lojas');

        expect(res.status).toBe(401);
        expect(res.body.sucesso).toBe(false);
        expect(res.body.mensagem).toMatch(/token|autenticad/i);
      });

      it('retorna 401 quando fornece token inválido', async () => {
        const res = await request(contexto.app)
          .get('/api/admin/lojas/minhas-lojas')
          .set('Authorization', 'Bearer token_invalido_xyz');

        expect(res.status).toBe(401);
        expect(res.body.sucesso).toBe(false);
      });
    });
  });
});
