import request from 'supertest';
import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

// Testes de integração para rotas de administração (/api/admin),
// focados em validar o controle de acesso baseado em papéis (RBAC),
// garantindo que apenas admins possam acessar rotas restritas.
describe('Integração - Admin (rotas individuais)', () => {
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

  it('deve falhar no cadastro de admin com token de cliente', async () => {
    // Obtém token de cliente comum e tenta cadastrar admin,
    // testando controle de acesso baseado em papéis de usuário.
    const tokenCliente = await obterTokenCliente(app);

    const resposta = await request(app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        nome: 'Admin Inválido',
        cpf: '987.654.321-00',
        email: 'admin.invalido@email.com',
        senha: 'SenhaForte@123',
        confirmacao_senha: 'SenhaForte@123',
      });

    expect(resposta.status).toBe(403);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Acesso negado. Esta rota é restrita a administradores.');
  });
});
