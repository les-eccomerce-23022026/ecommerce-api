import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { registrarCliente, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';

describe('Integração - Clientes (Registro)', () => {
  const contexto = configurarTesteIntegracao();

  describe('POST /api/clientes/registro', () => {
    describe('cenários de sucesso', () => {
      it('deve registrar cliente com sucesso e persistir dados adicionais', async () => {
        const resposta = await registrarCliente(contexto.app, { 
          email: 'cliente.registro.sucesso@teste.com',
          limparDados: true 
        });

        expect(resposta.status).toBe(201);
        expect(resposta.body.sucesso).toBe(true);
        expect(typeof resposta.body.dados.uuid).toBe('string');
        expect(resposta.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(resposta.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(resposta.body.dados.nome).toBe('Cliente Teste');
      });
    });

    describe('cenários de falha - validação', () => {
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
    });

    describe('cenários de falha - duplicidade', () => {
      it('deve falhar no registro com email duplicado', async () => {
        const emailDuplicado = 'duplicado@email.com';
        const cpfUnico = gerarCpfValidoUnico();
        await registrarCliente(contexto.app, { email: emailDuplicado, cpf: cpfUnico, limparDados: true });
        const resposta = await registrarCliente(contexto.app, { email: emailDuplicado, cpf: gerarCpfValidoUnico() });

        expect(resposta.status).toBe(400);
        expect(resposta.body.sucesso).toBe(false);
        expect(resposta.body.mensagem).toContain('E-mail já cadastrado.');
      });

      it('deve falhar no registro com CPF duplicado', async () => {
        const cpfDuplicado = gerarCpfValidoUnico();
        await registrarCliente(contexto.app, { cpf: cpfDuplicado, email: 'primeiro@email.com', limparDados: true });
        const resposta = await registrarCliente(contexto.app, { cpf: cpfDuplicado, email: 'outro@email.com' });

        expect(resposta.status).toBe(400);
        expect(resposta.body.sucesso).toBe(false);
        expect(resposta.body.mensagem).toContain('CPF já cadastrado.');
      });
    });
  });
});
