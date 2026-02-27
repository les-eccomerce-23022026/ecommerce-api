import request from 'supertest';
import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';
import { registrarCliente, realizarLogin } from '@/tests/utils/requisicoes-api.util';

// Testes de integração para rotas de autenticação (/api/auth),
// cobrindo validações de entrada, credenciais inválidas e acesso de conta inativada.
describe('Integração - Auth (rotas individuais)', () => {
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

  it('deve falhar no login sem email/senha', async () => {
    // Envia requisição de login sem campos obrigatórios,
    // testando validação de entrada e tratamento de dados ausentes.
    const resposta = await request(app).post('/api/auth/login').send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Email e senha são obrigatórios.');
  });

  it('deve falhar no login com credenciais inválidas', async () => {
    // Tenta login com email inexistente e senha incorreta,
    // validando que a API rejeita credenciais não cadastradas.
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'nao.existe@email.com',
      senha: 'SenhaInvalida@123',
    });

    expect(resposta.status).toBe(401);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Credenciais inválidas.');
  });

  it('deve falhar no login com usuário inativado', async () => {
    // Registra cliente, faz login, inativa a conta,
    // e tenta login novamente para validar desativação.
    await registrarCliente(app, {
      nome: 'Cliente Inativado',
      cpf: '555.444.333-22',
      email: 'cliente.inativado@email.com',
      senha: 'SenhaInativada@123',
      confirmacao_senha: 'SenhaInativada@123',
    });

    const respostaLoginInicial = await realizarLogin(
      app,
      'cliente.inativado@email.com',
      'SenhaInativada@123',
    );

    const token = respostaLoginInicial.body?.dados?.token as string;

    // Inativa a conta via endpoint de exclusão lógica.
    await request(app)
      .delete('/api/clientes/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send();

    // Confirma que após inativação o login é recusado.
    const respostaLoginAposInativacao = await realizarLogin(
      app,
      'cliente.inativado@email.com',
      'SenhaInativada@123',
    );

    expect(respostaLoginAposInativacao.status).toBe(401);
    expect(respostaLoginAposInativacao.body.sucesso).toBe(false);
    expect(respostaLoginAposInativacao.body.mensagem).toBe('Credenciais inválidas.');
  });
});
