import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { registrarCliente } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Clientes (Registro)', () => {
  const contexto = configurarTesteIntegracao();

  describe('POST /api/clientes/registro', () => {
    it('deve registrar cliente com sucesso e persistir dados adicionais', async () => {
      const resposta = await registrarCliente(contexto.app, { limparDados: true });

      expect(resposta.status).toBe(201);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.uuid).toBeDefined();
      expect(resposta.body.dados.nome).toBe('Cliente Teste');
      expect(resposta.body.dados.email).toBe('cliente.teste@email.com');
    });

    it('deve falhar no registro com campos obrigatórios ausentes', async () => {
      const resposta = await request(contexto.app).post('/api/clientes/registro').send({ nome: 'Cliente' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Campos obrigatórios ausentes');
    });

    it('deve falhar no registro quando senha e confirmação diferem', async () => {
      const resposta = await registrarCliente(contexto.app, {
        confirmacaoSenha: 'SenhaDiferente@123',
      });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Senha e confirmação não conferem.');
    });

    it('deve falhar no registro com senha fraca', async () => {
      const resposta = await registrarCliente(contexto.app, {
        senha: '123',
        confirmacaoSenha: '123',
      });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('Senha fraca');
    });

    it('deve falhar no registro com email duplicado', async () => {
      await registrarCliente(contexto.app, { email: 'duplicado@email.com', limparDados: true });
      const resposta = await registrarCliente(contexto.app, { email: 'duplicado@email.com', cpf: '222.333.444-55' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('E-mail já cadastrado.');
    });

    it('deve falhar no registro com CPF duplicado', async () => {
      await registrarCliente(contexto.app, { cpf: '111.222.333-44', limparDados: true });
      const resposta = await registrarCliente(contexto.app, { cpf: '111.222.333-44', email: 'outro@email.com' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toContain('CPF já cadastrado.');
    });
  });
});
