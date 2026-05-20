import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Clientes (Inativação)', () => {
  const contexto = configurarTesteIntegracao();

  describe('DELETE /api/clientes/perfil', () => {
    it('deve inativar conta com sucesso', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .delete('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.mensagem).toBe('Cadastro inativado com sucesso.');
    });

    it('deve falhar na inativação sem token', async () => {
      const resposta = await request(contexto.app).delete('/api/clientes/perfil');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve falhar na inativação de conta já inativa', async () => {
      const token = await obterTokenCliente(contexto.app);
      await request(contexto.app)
        .delete('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      const resposta = await request(contexto.app)
        .delete('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Conta já está inativa.');
    });
  });
});
