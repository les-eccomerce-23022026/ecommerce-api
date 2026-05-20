import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Clientes (Perfil)', () => {
  const contexto = configurarTesteIntegracao();

  describe('GET /api/clientes/perfil', () => {
    it('deve obter perfil do cliente com sucesso', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.uuid).toBeDefined();
      expect(resposta.body.dados.nome).toBe('Cliente Teste');
      expect(resposta.body.dados.email).toBe('cliente.teste@email.com');
      expect(resposta.body.dados.cpf).toBeDefined();
    });

    it('deve falhar na obtenção do perfil sem token', async () => {
      const resposta = await request(contexto.app).get('/api/clientes/perfil');

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve permitir obtenção do perfil com token de admin (admin é considerado extensão de cliente)', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);
      const resposta = await request(contexto.app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });

  describe('PATCH /api/clientes/perfil', () => {
    it('deve atualizar apenas o nome do cliente', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.nome).toBe('Nome Atualizado');
    });

    it('deve atualizar múltiplos campos do cliente simultaneamente', async () => {
      const token = await obterTokenCliente(contexto.app);
      const novosDados = {
        nome: 'Novo Nome Completo',
        dataNascimento: '1990-05-15',
        genero: 'MASCULINO',
      };

      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send(novosDados);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.nome).toBe(novosDados.nome);
      expect(resposta.body.dados.genero).toBe(novosDados.genero);
    });

    it('deve falhar na atualização sem token', async () => {
      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve permitir atualização do perfil com token de admin', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);
      const resposta = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    describe('dados sensíveis (e-mail, telefone, CPF) — exigem senha de confirmação', () => {
      it('falha ao alterar e-mail sem senha de confirmação', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/perfil')
          .set('Authorization', `Bearer ${token}`)
          .send({ email: `novo.email.${Date.now()}@test.local` });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toMatch(/Senha de confirmação é obrigatória/i);
      });

      it('falha ao alterar telefone sem senha de confirmação', async () => {
        const token = await obterTokenCliente(contexto.app);
        const resposta = await request(contexto.app)
          .patch('/api/clientes/perfil')
          .set('Authorization', `Bearer ${token}`)
          .send({
            telefone: { tipo: 'Celular', ddd: '11', numero: '988887777' },
          });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toMatch(/Senha de confirmação é obrigatória/i);
      });

      it('atualiza e-mail quando informa senha de confirmação correta', async () => {
        const token = await obterTokenCliente(contexto.app);
        const novoEmail = `perfil.ok.${Date.now()}@test.local`;

        const resposta = await request(contexto.app)
          .patch('/api/clientes/perfil')
          .set('Authorization', `Bearer ${token}`)
          .send({
            email: novoEmail,
            senhaConfirmacao: 'SenhaForte@123',
          });

        expect(resposta.status).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(resposta.body.dados.email).toBe(novoEmail);
      });

      it('atualiza telefone e nome na mesma requisição com senha de confirmação', async () => {
        const token = await obterTokenCliente(contexto.app);

        const resposta = await request(contexto.app)
          .patch('/api/clientes/perfil')
          .set('Authorization', `Bearer ${token}`)
          .send({
            nome: 'Cliente Com Telefone Novo',
            telefone: { tipo: 'Celular', ddd: '21', numero: '977776666' },
            senhaConfirmacao: 'SenhaForte@123',
          });

        expect(resposta.status).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(resposta.body.dados.nome).toBe('Cliente Com Telefone Novo');
        expect(resposta.body.dados.telefone?.numero).toMatch(/77776666/);
      });
    });

    describe('PATCH com array enderecos (substitui todos os endereços do usuário)', () => {
      const enderecoCompleto = {
        apelido: 'Unico Via Patch Perfil',
        tipoResidencia: 'Casa',
        tipoLogradouro: 'Rua',
        logradouro: 'Rua Substituição Perfil',
        numero: '400',
        bairro: 'Centro',
        cep: '01000-000',
        cidade: 'São Paulo',
        estado: 'SP',
        pais: 'Brasil',
      };

      it('substitui endereços existentes pelo payload enderecos[]', async () => {
        const token = await obterTokenCliente(contexto.app);

        await request(contexto.app)
          .post('/api/clientes/perfil/enderecos')
          .set('Authorization', `Bearer ${token}`)
          .send({
            ...enderecoCompleto,
            apelido: 'Temporário Antes Do Patch',
            logradouro: 'Rua Será Apagada',
          });

        const resPatch = await request(contexto.app)
          .patch('/api/clientes/perfil')
          .set('Authorization', `Bearer ${token}`)
          .send({ enderecos: [enderecoCompleto] });

        expect(resPatch.status).toBe(200);
        expect(resPatch.body.sucesso).toBe(true);
        const enderecos = resPatch.body.dados.enderecos as Array<{ apelido: string }>;
        expect(enderecos).toHaveLength(1);
        expect(enderecos[0].apelido).toBe('Unico Via Patch Perfil');
      });
    });
  });
});
