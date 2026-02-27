import request from 'supertest';
import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';
import { registrarCliente, realizarLogin } from '@/tests/utils/requisicoes-api.util';

// Testes de integração que simulam fluxos completos do domínio cliente,
// cobrindo o ciclo de vida da conta desde o registro até a inativação,
// e cenários de falha como senha incorreta e email duplicado.
describe('Integração - Fluxos completos do cliente', () => {
  let app: Application;
  let escopo: EscopoIsolamentoIntegracao;

  // Inicializa a aplicação Express uma vez para todos os testes,
  // pois a configuração não muda entre eles.
  beforeAll(() => {
    app = criarAplicacao();
  });

  // Antes de cada teste, cria um escopo isolado de banco de dados
  // para evitar interferência entre testes e garantir consistência.
  beforeEach(async () => {
    escopo = await iniciarEscopoIsolamentoIntegracao();
  });

  // Após cada teste, finaliza o escopo isolado, limpando dados
  // para manter o ambiente limpo para o próximo teste.
  afterEach(async () => {
    await escopo.finalizar();
  });

  it('deve executar fluxo feliz completo do cliente', async () => {
    // Registra um novo cliente para iniciar o fluxo,
    // validando que o registro é bem-sucedido (status 201).
    const respostaRegistro = await registrarCliente(app, {
      nome: 'Fluxo Cliente Feliz',
      cpf: '321.654.987-00',
      email: 'fluxo.feliz@email.com',
      senha: 'SenhaInicial@123',
      confirmacao_senha: 'SenhaInicial@123',
    });

    expect(respostaRegistro.status).toBe(201);

    // Realiza login com as credenciais recém-registradas,
    // confirmando que o usuário pode autenticar-se imediatamente após o registro.
    const respostaLoginInicial = await realizarLogin(app, 'fluxo.feliz@email.com', 'SenhaInicial@123');
    expect(respostaLoginInicial.status).toBe(200);

    const tokenCliente = respostaLoginInicial.body.dados.token as string;

    // Atualiza o perfil do cliente usando o token obtido,
    // testando a funcionalidade de edição de dados pessoais.
    const respostaAtualizacao = await request(app)
      .put('/api/clientes/perfil')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nome: 'Fluxo Cliente Atualizado' });

    expect(respostaAtualizacao.status).toBe(200);
    expect(respostaAtualizacao.body.dados.nome).toBe('Fluxo Cliente Atualizado');

    // Altera a senha do cliente, validando a segurança da conta,
    // exigindo a senha atual para autorizar a mudança.
    const respostaAlterarSenha = await request(app)
      .patch('/api/clientes/seguranca/alterar-senha')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        senha_atual: 'SenhaInicial@123',
        nova_senha: 'SenhaNovaFluxo@123',
        confirmacao_senha: 'SenhaNovaFluxo@123',
      });

    expect(respostaAlterarSenha.status).toBe(200);

    // Confirma que o login funciona com a nova senha,
    // assegurando que a alteração foi aplicada corretamente.
    const respostaLoginNovaSenha = await realizarLogin(app, 'fluxo.feliz@email.com', 'SenhaNovaFluxo@123');
    expect(respostaLoginNovaSenha.status).toBe(200);

    // Inativa o perfil do cliente, simulando exclusão lógica,
    // para testar o ciclo de vida completo da conta.
    const respostaInativacao = await request(app)
      .delete('/api/clientes/perfil')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send();

    expect(respostaInativacao.status).toBe(200);

    // Verifica que após inativação, o login falha,
    // confirmando que a conta foi desativada e não permite acesso.
    const respostaLoginAposInativacao = await realizarLogin(app, 'fluxo.feliz@email.com', 'SenhaNovaFluxo@123');
    expect(respostaLoginAposInativacao.status).toBe(401);
    expect(respostaLoginAposInativacao.body.mensagem).toBe('Credenciais inválidas.');
  });

  it('deve executar fluxo de falhas do cliente', async () => {
    // Registra um cliente para preparar o cenário de testes de falha,
    // sem verificar o sucesso aqui, pois o foco é nos erros subsequentes.
    await registrarCliente(app, {
      nome: 'Fluxo Falha',
      cpf: '654.987.321-00',
      email: 'fluxo.falha@email.com',
      senha: 'SenhaFalha@123',
      confirmacao_senha: 'SenhaFalha@123',
    });

    const respostaLogin = await realizarLogin(app, 'fluxo.falha@email.com', 'SenhaFalha@123');
    const tokenCliente = respostaLogin.body.dados.token as string;

    // Tenta alterar senha com senha atual incorreta,
    // validando que a API rejeita mudanças sem verificação adequada.
    const respostaSenhaAtualIncorreta = await request(app)
      .patch('/api/clientes/seguranca/alterar-senha')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        senha_atual: 'SenhaErrada@123',
        nova_senha: 'SenhaNovaFalha@123',
        confirmacao_senha: 'SenhaNovaFalha@123',
      });

    expect(respostaSenhaAtualIncorreta.status).toBe(400);
    expect(respostaSenhaAtualIncorreta.body.mensagem).toBe('Senha atual incorreta.');

    // Tenta cadastrar um admin com token de cliente,
    // testando controle de acesso e autorização baseada em papéis.
    const respostaSemPermissaoAdmin = await request(app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        nome: 'Admin Proibido',
        cpf: '222.333.444-55',
        email: 'admin.proibido@email.com',
        senha: 'SenhaAdmin@123',
        confirmacao_senha: 'SenhaAdmin@123',
      });

    expect(respostaSemPermissaoAdmin.status).toBe(403);

    // Tenta registrar cliente com email já existente,
    // validando unicidade de email no sistema.
    const respostaEmailDuplicado = await registrarCliente(app, {
      nome: 'Duplicado',
      cpf: '777.888.999-00',
      email: 'fluxo.falha@email.com',
      senha: 'SenhaDuplicada@123',
      confirmacao_senha: 'SenhaDuplicada@123',
    });

    expect(respostaEmailDuplicado.status).toBe(400);
    expect(respostaEmailDuplicado.body.mensagem).toBe('Já existe um usuário cadastrado com este e-mail.');
  });
});
