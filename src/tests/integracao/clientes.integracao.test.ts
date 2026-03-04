import request from 'supertest';
import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';
import { registrarCliente, obterTokenCliente, realizarLogin, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';

// Testes de integração para rotas de clientes (/api/clientes),
// cobrindo registro, validações de senha e segurança de acesso autenticado.
describe('Integração - Clientes', () => {
  let app: Application;
  let escopo: EscopoIsolamentoIntegracao;

  // Inicializa a aplicação Express uma vez, reutilizando-a
  // para eficiência, já que a configuração é estática.
  beforeAll(() => {
    app = criarAplicacao();
  });

  // Cria escopo isolado de banco antes de cada teste
  // para garantir independência e evitar estado compartilhado.
  beforeEach(async () => {
    escopo = await iniciarEscopoIsolamentoIntegracao();
  });

  // Limpa o escopo após cada teste para manter consistência.
  afterEach(async () => {
    await escopo.finalizar();
  });

  describe('POST /api/clientes/registro', () => {
    it('deve registrar cliente com sucesso e persistir dados adicionais', async () => {
      const resposta = await registrarCliente(app, {});

      expect(resposta.status).toBe(201);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.uuid).toBeDefined();
      expect(resposta.body.dados.nome).toBe('Cliente Teste');
      expect(resposta.body.dados.email).toBe('cliente.teste@email.com');
    });

    it('deve falhar no registro com campos obrigatórios ausentes', async () => {
      const resposta = await request(app).post('/api/clientes/registro').send({ nome: 'Cliente' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Campos obrigatórios ausentes');
    });

    it('deve falhar no registro quando senha e confirmação diferem', async () => {
      const resposta = await registrarCliente(app, {
        confirmacao_senha: 'SenhaDiferente@123',
      });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Senha e confirmação de senha não conferem.');
    });

    it('deve falhar no registro com senha fraca', async () => {
      const resposta = await registrarCliente(app, {
        senha: '123',
        confirmacao_senha: '123',
      });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Senha fraca');
    });

    it('deve falhar no registro com email duplicado', async () => {
      await registrarCliente(app, { email: 'duplicado@email.com' });
      const resposta = await registrarCliente(app, { email: 'duplicado@email.com', cpf: '222.333.444-55' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Já existe um usuário cadastrado com este e-mail');
    });

    it('deve falhar no registro com CPF duplicado', async () => {
      await registrarCliente(app, { cpf: '111.222.333-44' });
      const resposta = await registrarCliente(app, { cpf: '111.222.333-44', email: 'outro@email.com' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Já existe um usuário cadastrado com este CPF');
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve realizar login com sucesso e retornar JWT', async () => {
      await registrarCliente(app);
      const resposta = await realizarLogin(app, 'cliente.teste@email.com', 'SenhaForte@123');

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.token).toBeDefined();
      expect(resposta.body.dados.user).toBeDefined();
      expect(resposta.body.dados.user.email).toBe('cliente.teste@email.com');
    });

    it('deve falhar no login com credenciais inválidas', async () => {
      const resposta = await realizarLogin(app, 'invalido@email.com', 'senhaerrada');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Credenciais inválidas');
    });
  });

  describe('GET /api/clientes/perfil', () => {
    it('deve obter perfil do cliente com sucesso', async () => {
      const token = await obterTokenCliente(app);
      const resposta = await request(app)
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
      const resposta = await request(app).get('/api/clientes/perfil');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve falhar na obtenção do perfil com token de admin', async () => {
      const tokenAdmin = await obterTokenAdmin(app);
      const resposta = await request(app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resposta.status).toBe(403);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Acesso negado. Esta rota é restrita a clientes.');
    });
  });

  describe('PUT /api/clientes/perfil', () => {
    it('deve atualizar perfil do cliente com sucesso', async () => {
      const token = await obterTokenCliente(app);
      const resposta = await request(app)
        .put('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.nome).toBe('Nome Atualizado');
    });

    it('deve falhar na atualização sem token', async () => {
      const resposta = await request(app)
        .put('/api/clientes/perfil')
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve falhar na atualização com token de admin', async () => {
      // Assumindo que há função para obter token admin
      const tokenAdmin = await obterTokenAdmin(app);
      const resposta = await request(app)
        .put('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(403);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Acesso negado. Esta rota é restrita a clientes.');
    });
  });

  describe('PATCH /api/clientes/seguranca/alterar-senha', () => {
    it('deve alterar senha com sucesso', async () => {
      const token = await obterTokenCliente(app);
      const resposta = await request(app)
        .patch('/api/clientes/seguranca/alterar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senha_atual: 'SenhaForte@123',
          nova_senha: 'NovaSenha@123',
          confirmacao_senha: 'NovaSenha@123',
        });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.mensagem).toBe('Senha alterada com sucesso.');
    });

    it('deve falhar na alteração de senha sem token', async () => {
      const resposta = await request(app).patch('/api/clientes/seguranca/alterar-senha').send({
        senha_atual: 'SenhaForte@123',
        nova_senha: 'NovaSenha@123',
        confirmacao_senha: 'NovaSenha@123',
      });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve falhar na alteração de senha com senha atual inválida', async () => {
      const token = await obterTokenCliente(app);
      const resposta = await request(app)
        .patch('/api/clientes/seguranca/alterar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senha_atual: 'SenhaAtualErrada@123',
          nova_senha: 'NovaSenhaValida@123',
          confirmacao_senha: 'NovaSenhaValida@123',
        });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Senha atual incorreta.');
    });

    it('deve falhar na alteração de senha quando nova senha é igual à atual', async () => {
      const token = await obterTokenCliente(app);
      const resposta = await request(app)
        .patch('/api/clientes/seguranca/alterar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senha_atual: 'SenhaForte@123',
          nova_senha: 'SenhaForte@123',
          confirmacao_senha: 'SenhaForte@123',
        });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Nova senha deve ser diferente da senha atual.');
    });
  });

  describe('DELETE /api/clientes/perfil', () => {
    it('deve inativar conta com sucesso', async () => {
      const token = await obterTokenCliente(app);
      const resposta = await request(app)
        .delete('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.mensagem).toBe('Cadastro inativado com sucesso.');
    });

    it('deve falhar na inativação sem token', async () => {
      const resposta = await request(app).delete('/api/clientes/perfil');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve falhar na inativação de conta já inativa', async () => {
      const token = await obterTokenCliente(app);
      await request(app)
        .delete('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      const resposta = await request(app)
        .delete('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Conta já está inativa.');
    });
  });
});
