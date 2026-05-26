import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, registrarCliente } from '@/tests/helpers/requisicoes-api.util';

describe('Integração - Autenticação', () => {
  const contexto = configurarTesteIntegracao(true);

  describe('POST /api/auth/login', () => {
    it('[RF0038] deve autenticar cliente com credenciais válidas', async () => {
      // Registrar cliente para teste
      await registrarCliente(contexto.app, {
        nome: 'Cliente Auth Teste',
        cpf: '123.456.789-09',
        email: 'cliente.auth@email.com',
        senha: 'SenhaValida@123',
        confirmacaoSenha: 'SenhaValida@123',
        limparDados: true,
      });

      // Realizar login
      const res = await request(contexto.app).post('/api/auth/login').send({
        email: 'cliente.auth@email.com',
        senha: 'SenhaValida@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.dados.user.email).toBe('cliente.auth@email.com');
      expect(res.body.dados.user.nome).toBe('Cliente Auth Teste');
      expect(res.body.dados.user.role).toBe('cliente');
      expect(res.body.dados.token).toBeDefined();
      expect(typeof res.body.dados.token).toBe('string');
      expect(res.body.dados.token.length).toBeGreaterThan(0);
    });

    it('[RF0038] deve autenticar admin com credenciais válidas', async () => {
      await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app).post('/api/auth/login').send({
        email: 'admin@livraria.com.br',
        senha: 'Admin@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.dados.user.email).toBe('admin@livraria.com.br');
      expect(res.body.dados.user.role).toBe('admin_sistema');
      expect(res.body.dados.token).toBeDefined();
      expect(typeof res.body.dados.token).toBe('string');
      expect(res.body.dados.token.length).toBeGreaterThan(0);
    });

    it('[RNF0037] deve retornar 401 para credenciais inválidas', async () => {
      const res = await request(contexto.app).post('/api/auth/login').send({
        email: 'naoexiste@email.com',
        senha: 'senhaerrada',
      });

      expect(res.status).toBe(401);
    });

    it('[RNF0037] deve retornar 401 para senha incorreta', async () => {
      await registrarCliente(contexto.app, {
        nome: 'Cliente Senha Errada',
        cpf: '987.654.321-00',
        email: 'cliente.senha@email.com',
        senha: 'SenhaCorreta@123',
        confirmacaoSenha: 'SenhaCorreta@123',
        limparDados: true,
      });

      const res = await request(contexto.app).post('/api/auth/login').send({
        email: 'cliente.senha@email.com',
        senha: 'SenhaErrada@123',
      });

      expect(res.status).toBe(401);
    });

    it('[RNF0037] deve retornar 400 para campos obrigatórios ausentes', async () => {
      const res = await request(contexto.app).post('/api/auth/login').send({
        email: 'teste@email.com',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('[RF0038] deve encerrar sessão do cliente', async () => {
      // Registrar e fazer login
      await registrarCliente(contexto.app, {
        nome: 'Cliente Logout',
        cpf: '529.982.247-25',
        email: 'cliente.logout@email.com',
        senha: 'SenhaLogout@123',
        confirmacaoSenha: 'SenhaLogout@123',
        limparDados: true,
      });

      const loginRes = await request(contexto.app).post('/api/auth/login').send({
        email: 'cliente.logout@email.com',
        senha: 'SenhaLogout@123',
      });

      const token = loginRes.body.dados.token;

      // Logout
      const res = await request(contexto.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('[RF0038] deve retornar dados do usuário autenticado', async () => {
      // Registrar e fazer login
      await registrarCliente(contexto.app, {
        nome: 'Cliente Me',
        cpf: '123.456.789-09',
        email: 'cliente.me@email.com',
        senha: 'SenhaMe@123',
        confirmacaoSenha: 'SenhaMe@123',
        limparDados: true,
      });

      const loginRes = await request(contexto.app).post('/api/auth/login').send({
        email: 'cliente.me@email.com',
        senha: 'SenhaMe@123',
      });

      const token = loginRes.body.dados.token;

      // Obter dados do usuário
      const res = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.dados.user.email).toBe('cliente.me@email.com');
      expect(res.body.dados.user.nome).toBe('Cliente Me');
    });

    it('[RNF0037] deve retornar 401 sem token', async () => {
      const res = await request(contexto.app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('[RNF0037] deve retornar 401 com token inválido', async () => {
      const res = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
    });
  });
});
