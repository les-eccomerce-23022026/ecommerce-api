import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenAdmin, realizarLogin } from '@/tests/utils/requisicoes-api.util';

/**
 * Administrador mestre: gestão de outros administradores (rotas /api/admin/* com adminMestreOnly).
 */
describe('Integração — Administrador mestre (gestão de admins)', () => {
  const contexto = configurarTesteIntegracao();

  describe('GET /api/admin/administradores', () => {
    it('retorna 200 e lista com ao menos o mestre', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
      expect(res.body.dados.some((a: { email?: string }) => a.email === 'admin@livraria.com.br')).toBe(true);
    });
  });

  describe('POST /api/admin/registro', () => {
    describe('cenários de falha (validação)', () => {
      it('retorna 400 quando faltam campos obrigatórios (nome)', async () => {
        const tokenMestre = await obterTokenAdmin(contexto.app);

        const res = await request(contexto.app)
          .post('/api/admin/registro')
          .set('Authorization', `Bearer ${tokenMestre}`)
          .send({
            cpf: '222.333.444-55',
            email: `sem.nome.${Date.now()}@test.local`,
            senha: 'SenhaAdmin@123',
            confirmacaoSenha: 'SenhaAdmin@123',
          });

        expect(res.status).toBe(400);
        expect(res.body.mensagem).toMatch(/nome/i);
      });

      it('retorna 400 ao duplicar e-mail de administrador existente', async () => {
        const tokenMestre = await obterTokenAdmin(contexto.app);
        const email = `admin.dup.${Date.now()}@test.local`;

        const primeiro = await request(contexto.app)
          .post('/api/admin/registro')
          .set('Authorization', `Bearer ${tokenMestre}`)
          .send({
            nome: 'Admin Dup A',
            cpf: '333.444.555-66',
            email,
            senha: 'SenhaAdmin@123',
            confirmacaoSenha: 'SenhaAdmin@123',
          });
        expect(primeiro.status).toBe(201);

        const segundo = await request(contexto.app)
          .post('/api/admin/registro')
          .set('Authorization', `Bearer ${tokenMestre}`)
          .send({
            nome: 'Admin Dup B',
            cpf: '444.555.666-77',
            email,
            senha: 'SenhaAdmin@123',
            confirmacaoSenha: 'SenhaAdmin@123',
          });

        expect(segundo.status).toBe(400);
        expect(segundo.body.mensagem).toMatch(/e-mail|administrador/i);
      });
    });
  });

  describe('PATCH inativar / ativar administrador', () => {
    it('retorna 403 ao tentar inativar o próprio usuário mestre', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const me = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenMestre}`);

      const uuidMestre = me.body.dados.user.uuid as string;

      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${uuidMestre}/inativar`)
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(res.status).toBe(403);
      expect(res.body.mensagem).toMatch(/inativar a si mesmo/i);
    });

    it('inativa outro admin, bloqueia login e reativa com sucesso', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const email = `admin.ciclo.${Date.now()}@test.local`;
      const senha = 'CicloAdmin@123';

      const reg = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Ciclo Vida',
          cpf: '555.666.777-88',
          email,
          senha,
          confirmacaoSenha: senha,
        });

      expect(reg.status).toBe(201);
      const uuidAlvo = reg.body.dados.uuid as string;

      const inat = await request(contexto.app)
        .patch(`/api/admin/administradores/${uuidAlvo}/inativar`)
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(inat.status).toBe(200);

      const loginInativo = await realizarLogin(contexto.app, email, senha);
      expect(loginInativo.status).toBe(401);

      const ativ = await request(contexto.app)
        .patch(`/api/admin/administradores/${uuidAlvo}/ativar`)
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(ativ.status).toBe(200);

      const loginAtivo = await realizarLogin(contexto.app, email, senha);
      expect(loginAtivo.status).toBe(200);
    });
  });
});
