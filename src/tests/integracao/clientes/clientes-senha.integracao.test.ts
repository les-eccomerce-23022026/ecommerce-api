import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Clientes (Senha)', () => {
  const contexto = configurarTesteIntegracao();

  describe('PATCH /api/clientes/seguranca/alterar-senha', () => {
    it('deve alterar senha com sucesso', async () => {
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

    it('deve falhar na alteração de senha sem token', async () => {
      const resposta = await request(contexto.app).patch('/api/clientes/seguranca/alterar-senha').send({
        senhaAtual: 'SenhaForte@123',
        novaSenha: 'NovaSenha@123',
        confirmacaoNovaSenha: 'NovaSenha@123',
      });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve falhar na alteração de senha com senha atual inválida', async () => {
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

    it('deve falhar na alteração de senha quando nova senha é igual à atual', async () => {
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
