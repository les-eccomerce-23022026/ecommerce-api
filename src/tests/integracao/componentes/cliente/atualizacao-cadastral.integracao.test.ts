import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, registrarCliente, realizarLogin, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';

/**
 * Testes de integração para atualização cadastral.
 * Verifica atualização de dados de administradores e clientes.
 * 
 * Prioridade: MÉDIA
 * - Atualização de nome, email, CPF de administradores
 * - Atualização de nome, email, telefone de clientes
 * - Validação de duplicidade em atualizações
 * - Validação de campos obrigatórios em atualizações
 */
describe('Integração - Atualização Cadastral', () => {
  const contexto = configurarTesteIntegracao();

  describe('Atualização de Administradores', () => {
    it('[ATUALIZAÇÃO] deve atualizar nome de administrador com sucesso', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin
      const adminRes = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Original',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.original@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      const adminUuid = adminRes.body.dados.uuid;

      // Atualizar nome
      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${adminUuid}`)
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Atualizado',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.nome).toBe('Admin Atualizado');
    });

    it('[ATUALIZAÇÃO] deve atualizar email de administrador com sucesso', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin
      const adminRes = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Email',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.email.old@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      const adminUuid = adminRes.body.dados.uuid;

      // Atualizar email
      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${adminUuid}`)
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          email: 'admin.email.new@teste.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.email).toBe('admin.email.new@teste.com');
    });

    it('[ATUALIZAÇÃO] deve rejeitar email duplicado de outro admin', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar primeiro admin
      await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Primeiro',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.duplicado@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      // Criar segundo admin
      const adminRes2 = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Segundo',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.segundo@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      const adminUuid2 = adminRes2.body.dados.uuid;

      // Tentar atualizar para email duplicado
      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${adminUuid2}`)
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          email: 'admin.duplicado@teste.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/e-mail|já cadastrado/i);
    });

    it('[ATUALIZAÇÃO] deve rejeitar CPF duplicado de outro admin', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const cpfDuplicado = gerarCpfValidoUnico();

      // Criar primeiro admin com CPF específico
      await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin CPF 1',
          cpf: cpfDuplicado,
          email: 'admin.cpf1@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      // Criar segundo admin com CPF diferente
      const adminRes2 = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin CPF 2',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.cpf2@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      const adminUuid2 = adminRes2.body.dados.uuid;

      // Tentar atualizar segundo admin para o CPF do primeiro (duplicado)
      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${adminUuid2}`)
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          cpf: cpfDuplicado,
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/cpf|já cadastrado/i);
    });

    it('[ATUALIZAÇÃO] deve rejeitar nome vazio ao atualizar admin', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin
      const adminRes = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Teste',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.nome@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      const adminUuid = adminRes.body.dados.uuid;

      // Tentar atualizar com nome vazio
      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${adminUuid}`)
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/nome|vazio/i);
    });
  });

  describe('Atualização de Clientes', () => {
    it('[ATUALIZAÇÃO] deve atualizar nome de cliente com sucesso', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.nome@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.nome@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Atualizar nome
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Cliente Atualizado',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.nome).toBe('Cliente Atualizado');
    });

    it('[ATUALIZAÇÃO] deve atualizar telefone de cliente com sucesso', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.telefone@teste.com',
        cpf: '987.654.321-00',
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.telefone@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Atualizar telefone
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaConfirmacao: 'SenhaForte@123',
          telefone: {
            tipo: 'celular',
            numero: '11999999999',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
    });

    it('[ATUALIZAÇÃO] deve rejeitar email duplicado de outro cliente', async () => {
      // Registrar primeiro cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.duplicado@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Registrar segundo cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.segundo@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Fazer login como segundo cliente
      const loginRes = await realizarLogin(contexto.app, 'cliente.segundo@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Tentar atualizar para email duplicado
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'cliente.duplicado@teste.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/e-mail|já cadastrado/i);
    });

    it('[ATUALIZAÇÃO] deve atualizar gênero de cliente com sucesso', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.genero@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.genero@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Atualizar gênero
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({
          genero: 'M',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.genero).toBe('M');
    });

    it('[ATUALIZAÇÃO] deve atualizar data de nascimento de cliente com sucesso', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.nascimento@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.nascimento@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Atualizar data de nascimento
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dataNascimento: '1990-01-01',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.dataNascimento).toBe('1990-01-01');
    });
  });

  describe('Atualização de Senha', () => {
    it('[ATUALIZAÇÃO] deve alterar senha de cliente com sucesso', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.senha@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Fazer login com senha antiga
      const loginResAntiga = await realizarLogin(contexto.app, 'cliente.senha@teste.com', 'SenhaForte@123');
      const token = loginResAntiga.body.dados.token;

      // Alterar senha
      const res = await request(contexto.app)
        .patch('/api/clientes/seguranca/alterar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'SenhaForte@123',
          novaSenha: 'NovaSenha@456',
          confirmacaoNovaSenha: 'NovaSenha@456',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);

      // Verificar que consegue fazer login com nova senha
      const loginResNova = await realizarLogin(contexto.app, 'cliente.senha@teste.com', 'NovaSenha@456');
      expect(loginResNova.status).toBe(200);
    });

    it('[ATUALIZAÇÃO] deve rejeitar alteração de senha com senha atual incorreta', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.senha.errada@teste.com',
        cpf: '987.654.321-00',
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.senha.errada@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Tentar alterar senha com senha atual incorreta
      const res = await request(contexto.app)
        .patch('/api/clientes/seguranca/alterar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'SenhaErrada@123',
          novaSenha: 'NovaSenha@456',
          confirmacaoNovaSenha: 'NovaSenha@456',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/senha atual|incorreta/i);
    });

    it('[ATUALIZAÇÃO] deve rejeitar alteração de senha quando confirmação não confere', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.senha.conf@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.senha.conf@teste.com', 'SenhaForte@123');
      const token = loginRes.body.dados.token;

      // Tentar alterar senha com confirmação diferente
      const res = await request(contexto.app)
        .patch('/api/clientes/seguranca/alterar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'SenhaForte@123',
          novaSenha: 'NovaSenha@456',
          confirmacaoNovaSenha: 'SenhaDiferente@789',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/confirmação|não conferem/i);
    });
  });

  describe('Autorização em Atualizações', () => {
    it('[ATUALIZAÇÃO] deve retornar 401 ao atualizar perfil sem token', async () => {
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .send({
          nome: 'Novo Nome',
        });

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });

    it('[ATUALIZAÇÃO] deve retornar 403 ao atualizar admin de outro usuário', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin 1
      const adminRes1 = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin 1',
          cpf: gerarCpfValidoUnico(),
          email: 'admin1@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      // Criar admin 2
      const adminRes2 = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin 2',
          cpf: gerarCpfValidoUnico(),
          email: 'admin2@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      const tokenAdmin2 = adminRes2.body.dados.token;
      const adminUuid1 = adminRes1.body.dados.uuid;

      // Tentar atualizar admin 1 como admin 2
      const res = await request(contexto.app)
        .patch(`/api/admin/administradores/${adminUuid1}`)
        .set('Authorization', `Bearer ${tokenAdmin2}`)
        .send({
          nome: 'Nome Alterado',
        });

      expect(res.status).toBe(403);
      expect(res.body.sucesso).toBe(false);
    });
  });
});
