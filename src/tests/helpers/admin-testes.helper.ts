import request from 'supertest';
import { Application } from 'express';
import { realizarLogin } from '@/tests/utils/requisicoes-api.util';

const SENHA_ADMIN_COMUM = 'SenhaAdminComum@123';

/**
 * Cria um administrador não-mestre via API (token do mestre) e retorna token + e-mail.
 * CPF é variado para evitar colisão quando vários admins são criados na mesma suíte.
 */
export async function criarAdminComumObterToken(
  app: Application,
  tokenMestre: string,
): Promise<{ token: string; email: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = `admin.comum.${id}@test.integracao.local`;
  const parte = String(Math.floor(100 + Math.random() * 899)).padStart(3, '0');
  const cpf = `111.222.${parte}-44`;

  const res = await request(app)
    .post('/api/admin/registro')
    .set('Authorization', `Bearer ${tokenMestre}`)
    .send({
      nome: 'Admin Comum Integração',
      email,
      cpf,
      senha: SENHA_ADMIN_COMUM,
      confirmacaoSenha: SENHA_ADMIN_COMUM,
    });

  if (res.status !== 201) {
    throw new Error(`Falha ao criar admin comum: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const login = await realizarLogin(app, email, SENHA_ADMIN_COMUM);
  if (login.status !== 200 || !login.body?.dados?.token) {
    throw new Error(`Login admin comum falhou: ${login.status}`);
  }

  return { token: login.body.dados.token as string, email };
}
