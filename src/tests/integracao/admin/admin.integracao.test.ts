import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

// Testes de integração para rotas de administração (/api/admin),
// focados em validar o controle de acesso baseado em papéis (RBAC),
// garantindo que apenas admins possam acessar rotas restritas.
describe('Integração - Admin (rotas individuais)', () => {
  const contexto = configurarTesteIntegracao();

  it('deve falhar no cadastro de admin com token de cliente', async () => {
    // Obtém token de cliente comum e tenta cadastrar admin,
    // testando controle de acesso baseado em papéis de usuário.
    const tokenCliente = await obterTokenCliente(contexto.app);

    const resposta = await request(contexto.app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        nome: 'Admin Inválido',
        cpf: '987.654.321-00',
        email: 'admin.invalido@email.com',
        senha: 'SenhaForte@123',
        confirmacaoSenha: 'SenhaForte@123',
      });

    expect(resposta.status).toBe(403);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Acesso negado. Esta rota é restrita a administradores.');
  });
});
