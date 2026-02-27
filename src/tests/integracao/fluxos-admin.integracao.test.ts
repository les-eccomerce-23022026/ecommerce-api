import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';
import { realizarLogin, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';
import request from 'supertest';

// Testes de integração que simulam o fluxo completo do domínio admin,
// validando que um administrador existente pode cadastrar novos admins
// e que as credenciais e papel são atribuídos corretamente.
describe('Integração - Fluxos completos do administrador', () => {
  let app: Application;
  let escopo: EscopoIsolamentoIntegracao;

  // Inicializa a aplicação Express uma vez para todos os testes,
  // pois a configuração não muda entre eles.
  beforeAll(() => {
    app = criarAplicacao();
  });

  // Antes de cada teste, cria um escopo isolado de banco de dados
  // para evitar interferência entre testes e garantir consistência.
  beforeEach(async () => {
    escopo = await iniciarEscopoIsolamentoIntegracao();
  });

  // Após cada teste, finaliza o escopo isolado, limpando dados
  // para manter o ambiente limpo para o próximo teste.
  afterEach(async () => {
    await escopo.finalizar();
  });

  it('deve executar fluxo feliz administrativo', async () => {
    // Obtém token de admin para autorizar ações administrativas,
    // simulando um administrador logado no sistema.
    const tokenAdmin = await obterTokenAdmin(app);

    // Cadastra um novo administrador usando o token de admin existente,
    // testando a funcionalidade de criação de contas administrativas por admins.
    const respostaCadastroAdmin = await request(app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nome: 'Admin Fluxo',
        cpf: '111.111.111-11',
        email: 'admin.fluxo@email.com',
        senha: 'AdminFluxo@123',
        confirmacao_senha: 'AdminFluxo@123',
      });

    expect(respostaCadastroAdmin.status).toBe(201);

    // Verifica que o novo admin pode fazer login,
    // e confirma que o papel (role) atribuído é 'admin'.
    const respostaLoginNovoAdmin = await realizarLogin(app, 'admin.fluxo@email.com', 'AdminFluxo@123');
    expect(respostaLoginNovoAdmin.status).toBe(200);
    expect(respostaLoginNovoAdmin.body?.dados?.user?.role).toBe('admin');
  });
});
