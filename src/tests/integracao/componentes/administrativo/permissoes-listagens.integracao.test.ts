import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import {
  obterTokenAdmin,
  obterTokenCliente,
  realizarLogin,
} from '@/tests/helpers/requisicoes-api.util';
import { criarAdminComumObterToken } from '@/tests/helpers/admin-testes.helper';

/**
 * Administrador comum (não mestre): listagens permitidas vs rotas exclusivas do mestre.
 * GET /api/clientes é permitido a qualquer admin; gestão em /api/admin/* exige mestre.
 */
describe('Integração — Administrador comum (listagens e restrições)', () => {
  const contexto = configurarTesteIntegracao();

  describe('Autenticação e papel', () => {
    it('identifica administrador com papel admin no login', async () => {
      const res = await realizarLogin(contexto.app, 'admin@livraria.com.br', 'Admin@123');

      expect(res.status).toBe(200);
      expect(res.body.dados.user.role).toBe('admin');
      expect(res.body.dados.user.papeis).toContain('admin');
      expect(res.body.dados.user.papeis).toContain('cliente');
    });

    it('identifica administrador com papéis corretos', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const { token, email } = await criarAdminComumObterToken(contexto.app, tokenMestre);

      const me = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(me.status).toBe(200);
      expect(me.body.dados.user.role).toBe('admin');
      expect(me.body.dados.user.papeis).toContain('admin');
      expect(me.body.dados.user.papeis).toContain('cliente');
      expect(me.body.dados.user.email).toBe(email);
    });

    it('expõe papéis corretos em GET /api/auth/me para o administrador', async () => {
      const resLogin = await realizarLogin(contexto.app, 'admin@livraria.com.br', 'Admin@123');
      const token = resLogin.body.dados.token as string;

      const me = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(me.status).toBe(200);
      expect(me.body.dados.user.role).toBe('admin');
      expect(me.body.dados.user.papeis).toContain('admin');
      expect(me.body.dados.user.papeis).toContain('cliente');
    });
  });

  describe('GET /api/clientes (consulta administrativa — RF0024)', () => {
    it('permite listagem com token de administrador mestre', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .get('/api/clientes')
        .query({ pagina: 1, limite: 5 })
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados.clientes)).toBe(true);
      expect(typeof res.body.dados.total).toBe('number');
      expect(res.body.dados.pagina).toBe(1);
      expect(res.body.dados.limite).toBe(5);
    });

    it('permite listagem com token de administrador comum (somente leitura)', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const { token } = await criarAdminComumObterToken(contexto.app, tokenMestre);

      const res = await request(contexto.app)
        .get('/api/clientes')
        .query({ pagina: 1, limite: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.clientes).toBeDefined();
    });

    it('aceita filtro por nome', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .get('/api/clientes')
        .query({ nome: 'Cliente', pagina: 1, limite: 10 })
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
    });

    it('nega acesso a cliente (não admin)', async () => {
      const tokenCliente = await obterTokenCliente(contexto.app);

      const res = await request(contexto.app)
        .get('/api/clientes')
        .query({ pagina: 1, limite: 5 })
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(403);
      expect(res.body.mensagem).toMatch(/administrador/i);
    });
  });

  describe('Rotas exclusivas do administrador mestre (/api/admin/*)', () => {
    it('bloqueia GET /api/admin/administradores para admin comum', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const { token } = await criarAdminComumObterToken(contexto.app, tokenMestre);

      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.mensagem).toMatch(/Administrador Mestre/i);
    });

    it('bloqueia POST /api/admin/registro para admin comum', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const { token } = await criarAdminComumObterToken(contexto.app, tokenMestre);

      const res = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Tentativa',
          cpf: '666.777.888-99',
          email: `nao.pode.${Date.now()}@test.local`,
          senha: 'Senha@123',
          confirmacaoSenha: 'Senha@123',
        });

      expect(res.status).toBe(403);
      expect(res.body.mensagem).toMatch(/Administrador Mestre/i);
    });
  });

  describe('Tentativa de gestão com token de cliente', () => {
    it('retorna 403 ao cadastrar admin com token de cliente', async () => {
      const tokenCliente = await obterTokenCliente(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          nome: 'Admin Inválido',
          cpf: '987.654.321-00',
          email: 'admin.invalido.cliente@email.com',
          senha: 'SenhaForte@123',
          confirmacaoSenha: 'SenhaForte@123',
        });

      expect(res.status).toBe(403);
      expect(res.body.mensagem).toMatch(/administrador/i);
    });
  });
});
