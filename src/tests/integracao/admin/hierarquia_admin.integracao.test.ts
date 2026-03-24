import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { realizarLogin, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Hierarquia Administrativa (Mestre vs Comum)', () => {
  const contexto = configurarTesteIntegracao();

  it('deve identificar o Administrador Mestre através do e-mail oficial no login', async () => {
    // admin@livraria.com.br é o e-mail do super usuário
    const resposta = await realizarLogin(contexto.app, 'admin@livraria.com.br', 'Admin@123');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.user.email).toBe('admin@livraria.com.br');
    expect(resposta.body.dados.user.eAdminMestre).toBe(true);
  });

  it('deve identificar um Administrador Comum como eAdminMestre: false', async () => {
    const tokenMestre = await obterTokenAdmin(contexto.app);
    const emailAdminComum = 'admin.comum@livraria.com.br';

    // 1. Cria um admin comum usando o token do mestre
    await request(contexto.app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenMestre}`)
      .send({
        nome: 'Admin Comum',
        email: emailAdminComum,
        cpf: '111.222.333-44',
        senha: 'SenhaAdminComum@123',
        confirmacaoSenha: 'SenhaAdminComum@123'
      });

    // 2. Faz login com o admin comum
    const respostaLogin = await realizarLogin(contexto.app, emailAdminComum, 'SenhaAdminComum@123');

    expect(respostaLogin.status).toBe(200);
    expect(respostaLogin.body.dados.user.eAdminMestre).toBe(false);
  });

  it('deve permitir que o Administrador Mestre acesse a gestão de admins', async () => {
    const tokenMestre = await obterTokenAdmin(contexto.app);

    const resposta = await request(contexto.app)
      .get('/api/admin/administradores')
      .set('Authorization', `Bearer ${tokenMestre}`);

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body.dados)).toBe(true);
  });

  it('deve proibir que um Administrador Comum acesse a gestão de admins', async () => {
    const tokenMestre = await obterTokenAdmin(contexto.app);
    const emailAdminComum = 'admin.comum.bloqueado@livraria.com.br';

    // 1. Cria um admin comum
    await request(contexto.app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenMestre}`)
      .send({
        nome: 'Admin Comum Bloqueado',
        email: emailAdminComum,
        cpf: '999.888.777-66',
        senha: 'SenhaBloqueada@123',
        confirmacaoSenha: 'SenhaBloqueada@123'
      });

    // 2. Obtém token do admin comum
    const respostaLogin = await realizarLogin(contexto.app, emailAdminComum, 'SenhaBloqueada@123');
    const tokenComum = respostaLogin.body.dados.token;

    // 3. Tenta acessar lista de admins
    const respostaAcesso = await request(contexto.app)
      .get('/api/admin/administradores')
      .set('Authorization', `Bearer ${tokenComum}`);

    expect(respostaAcesso.status).toBe(403);
    expect(respostaAcesso.body.mensagem).toContain('Esta rota é restrita');
  });

  it('deve retornar eAdminMestre via /auth/me para sessão persistente', async () => {
    const respostaLogin = await realizarLogin(contexto.app, 'admin@livraria.com.br', 'Admin@123');
    const token = respostaLogin.body.dados.token;

    const respostaMe = await request(contexto.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respostaMe.status).toBe(200);
    expect(respostaMe.body.dados.user.eAdminMestre).toBe(true);
  });
});
