import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente, realizarLogin } from '@/tests/utils/requisicoes-api.util';

/**
 * PATCH /api/clientes/seguranca/alterar-senha (RF0028).
 * Cenários felizes e de falha alinhados ao GestaoIdentidadeCliente.alterarSenha.
 */
describe('Integração - Clientes (alteração de senha)', () => {
  const contexto = configurarTesteIntegracao();

  describe('PATCH /api/clientes/seguranca/alterar-senha', () => {
    describe('cenários felizes', () => {
      it('altera senha e retorna mensagem de sucesso', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/seguranca/alterar-senha')
          .set('Authorization', `Bearer ${token}`)
          .send({
            senhaAtual: 'SenhaForte@123',
            novaSenha: 'NovaSenha@123',
            confirmacaoNovaSenha: 'NovaSenha@123',
          });

        expect(resposta.status).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(resposta.body.dados.mensagem).toBe('Senha alterada com sucesso.');
      });

      it('após trocar senha, login aceita a nova senha e rejeita a antiga', async () => {
        const token = await obterTokenCliente(contexto.app);
        const novaSenha = 'LoginPosTroca@456';

        const patch = await request(contexto.app)
          .patch('/api/clientes/seguranca/alterar-senha')
          .set('Authorization', `Bearer ${token}`)
          .send({
            senhaAtual: 'SenhaForte@123',
            novaSenha,
            confirmacaoNovaSenha: novaSenha,
          });

        expect(patch.status).toBe(200);

        const loginNovo = await realizarLogin(contexto.app, 'cliente.teste@email.com', novaSenha);
        expect(loginNovo.status).toBe(200);
        expect(loginNovo.body.dados.token).toBeDefined();

        const loginAntigo = await realizarLogin(contexto.app, 'cliente.teste@email.com', 'SenhaForte@123');
        expect(loginAntigo.status).toBe(401);
      });
    });

    describe('cenários de falha — autenticação', () => {
      it('retorna 401 sem token', async () => {
        const resposta = await request(contexto.app).patch('/api/clientes/seguranca/alterar-senha').send({
          senhaAtual: 'SenhaForte@123',
          novaSenha: 'NovaSenha@123',
          confirmacaoNovaSenha: 'NovaSenha@123',
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.sucesso).toBe(false);
        expect(resposta.body.mensagem).toBe('Token não fornecido.');
      });
    });

    describe('cenários de falha — regras de negócio', () => {
      it('rejeita senha atual incorreta', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/seguranca/alterar-senha')
          .set('Authorization', `Bearer ${token}`)
          .send({
            senhaAtual: 'SenhaAtualErrada@123',
            novaSenha: 'NovaSenhaValida@123',
            confirmacaoNovaSenha: 'NovaSenhaValida@123',
          });

        expect(resposta.status).toBe(400);
        expect(resposta.body.sucesso).toBe(false);
        expect(resposta.body.mensagem).toBe('Senha atual incorreta.');
      });

      it('rejeita quando nova senha e confirmação não conferem', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/seguranca/alterar-senha')
          .set('Authorization', `Bearer ${token}`)
          .send({
            senhaAtual: 'SenhaForte@123',
            novaSenha: 'PrimeiraNova@123',
            confirmacaoNovaSenha: 'SegundaNova@999',
          });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe('Nova senha e confirmação não conferem.');
      });

      it('rejeita nova senha fraca (sem critérios de complexidade)', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/seguranca/alterar-senha')
          .set('Authorization', `Bearer ${token}`)
          .send({
            senhaAtual: 'SenhaForte@123',
            novaSenha: 'fraca',
            confirmacaoNovaSenha: 'fraca',
          });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe('Nova senha muito fraca.');
      });

      it('rejeita quando nova senha é igual à senha atual', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/seguranca/alterar-senha')
          .set('Authorization', `Bearer ${token}`)
          .send({
            senhaAtual: 'SenhaForte@123',
            novaSenha: 'SenhaForte@123',
            confirmacaoNovaSenha: 'SenhaForte@123',
          });

        expect(resposta.status).toBe(400);
        expect(resposta.body.sucesso).toBe(false);
        expect(resposta.body.mensagem).toBe('Nova senha deve ser diferente da senha atual.');
      });
    });
  });
});
