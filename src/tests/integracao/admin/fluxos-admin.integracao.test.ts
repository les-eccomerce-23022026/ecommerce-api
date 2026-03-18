import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { registrarCliente, realizarLogin, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';
import request from 'supertest';

// Testes de integração que simulam o fluxo completo do domínio admin,
// validando que um administrador existente pode cadastrar novos admins
// e que as credenciais e papel são atribuídos corretamente.
describe('Integração - Fluxos completos do administrador', () => {
  const contexto = configurarTesteIntegracao();

  it('deve executar fluxo feliz administrativo', async () => {
    // Obtém token de admin para autorizar ações administrativas,
    // simulando um administrador logado no sistema.
    const tokenAdmin = await obterTokenAdmin(contexto.app);

    // Cadastra um novo administrador usando o token de admin existente,
    // testando a funcionalidade de criação de contas administrativas por admins.
    const respostaCadastroAdmin = await request(contexto.app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nome: 'Admin Fluxo',
        cpf: '111.111.111-12',
        email: 'admin.fluxo@email.com',
        senha: 'AdminFluxo@123',
        confirmacaoSenha: 'AdminFluxo@123',
      });

    expect(respostaCadastroAdmin.status).toBe(201);

    // Verifica que o novo admin pode fazer login,
    // e confirma que o papel (role) atribuído é 'admin'.
    const respostaLoginNovoAdmin = await realizarLogin(contexto.app, 'admin.fluxo@email.com', 'AdminFluxo@123');
    expect(respostaLoginNovoAdmin.status).toBe(200);
    expect(respostaLoginNovoAdmin.body?.dados?.user?.role).toBe('admin');
  });

  it('deve promover um cliente existente para administrador com nova senha', async () => {
    await registrarCliente(contexto.app, {
      nome: 'Cliente Promovido',
      cpf: '321.654.987-00',
      email: 'cliente.promovido@email.com',
      senha: 'Cliente@123',
      confirmacaoSenha: 'Cliente@123',
    });

    const tokenAdmin = await obterTokenAdmin(contexto.app);

    const respostaCadastroAdmin = await request(contexto.app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nome: 'Cliente Promovido',
        cpf: '321.654.987-00',
        email: 'cliente.promovido@email.com',
        senha: 'AdminPromovido@123',
        confirmacaoSenha: 'AdminPromovido@123',
      });

    expect(respostaCadastroAdmin.status).toBe(201);
    expect(respostaCadastroAdmin.body?.dados?.role).toBe('admin');

    const respostaLoginPromovido = await realizarLogin(contexto.app, 'cliente.promovido@email.com', 'AdminPromovido@123');
    expect(respostaLoginPromovido.status).toBe(200);
    expect(respostaLoginPromovido.body?.dados?.user?.role).toBe('admin');
  });
});
