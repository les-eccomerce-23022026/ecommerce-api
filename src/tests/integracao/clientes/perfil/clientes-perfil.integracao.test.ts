import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Clientes (Perfil)', () => {
  const contexto = configurarTesteIntegracao();

  describe('GET /api/clientes/perfil', () => {
    it('deve obter perfil do cliente com sucesso', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.uuid).toBeDefined();
      expect(resposta.body.dados.nome).toBe('Cliente Teste');
      expect(resposta.body.dados.email).toBe('cliente.teste@email.com');
      expect(resposta.body.dados.cpf).toBeDefined();
    });

    it('deve falhar na obtenção do perfil sem token', async () => {
      const resposta = await request(contexto.app).get('/api/clientes/perfil');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve permitir obtenção do perfil com token de admin (admin é considerado extensão de cliente)', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);
      const resposta = await request(contexto.app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });

  describe('PATCH /api/clientes/perfil', () => {
    it('deve atualizar perfil do cliente com sucesso', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.nome).toBe('Nome Atualizado');
    });

    it('deve falhar na atualização sem token', async () => {
      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve permitir atualização do perfil com token de admin', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);
      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });
});
