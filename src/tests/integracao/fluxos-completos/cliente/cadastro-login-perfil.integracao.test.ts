import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { registrarCliente, realizarLogin, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';

// Testes de integração que simulam fluxos completos do domínio cliente,
// cobrindo o ciclo de vida da conta desde o registro até a inativação,
// e cenários de falha como senha incorreta e email duplicado.
describe('Integração - Fluxos completos do cliente', () => {
  const contexto = configurarTesteIntegracao();

  it('deve executar fluxo feliz completo do cliente', async () => {
    // Registra um novo cliente para iniciar o fluxo,
    // validando que o registro é bem-sucedido (status 201).
    const respostaRegistro = await registrarCliente(contexto.app, {
      nome: 'Fluxo Cliente Feliz',
      cpf: gerarCpfValidoUnico(),
      email: 'fluxo.feliz@email.com',
      senha: 'SenhaInicial@123',
      confirmacaoSenha: 'SenhaInicial@123',
      limparDados: true,
    });

    expect(respostaRegistro.status).toBe(201);

    // Realiza login com as credenciais recém-registradas,
    // confirmando que o usuário pode autenticar-se imediatamente após o registro.
    const respostaLoginInicial = await realizarLogin(contexto.app, 'fluxo.feliz@email.com', 'SenhaInicial@123');
    expect(respostaLoginInicial.status).toBe(200);

    const tokenCliente = respostaLoginInicial.body.dados.token as string;

    // Atualiza o perfil do cliente usando o token obtido,
    // testando a funcionalidade de edição de dados pessoais.
    const respostaAtualizacao = await request(contexto.app)
      .patch('/api/clientes/perfil')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nome: 'Fluxo Cliente Atualizado' });

    expect(respostaAtualizacao.status).toBe(200);
    expect(respostaAtualizacao.body.dados.nome).toBe('Fluxo Cliente Atualizado');

    // Altera a senha do cliente, validando a segurança da conta,
    // exigindo a senha atual para autorizar a mudança.
    const respostaAlterarSenha = await request(contexto.app)
      .patch('/api/clientes/seguranca/alterar-senha')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        senhaAtual: 'SenhaInicial@123',
        novaSenha: 'SenhaNovaFluxo@123',
        confirmacaoNovaSenha: 'SenhaNovaFluxo@123',
      });

    expect(respostaAlterarSenha.status).toBe(200);

    // Confirma que o login funciona with a nova senha,
    // assegurando que a alteração foi aplicada corretamente.
    const respostaLoginNovaSenha = await realizarLogin(contexto.app, 'fluxo.feliz@email.com', 'SenhaNovaFluxo@123');
    expect(respostaLoginNovaSenha.status).toBe(200);

    // Inativa o perfil do cliente, simulando exclusão lógica,
    // para testar o ciclo de vida completo da conta.
    const respostaInativacao = await request(contexto.app)
      .delete('/api/clientes/perfil')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send();

    expect(respostaInativacao.status).toBe(200);

    // Verifica que após inativação, o login falha,
    // confirmando que a conta foi desativada e não permite acesso.
    const respostaLoginAposInativacao = await realizarLogin(contexto.app, 'fluxo.feliz@email.com', 'SenhaNovaFluxo@123');
    expect(respostaLoginAposInativacao.status).toBe(401);
    expect(respostaLoginAposInativacao.body.mensagem).toBe('Credenciais inválidas.');
  });

  it('deve executar fluxo de falhas do cliente', async () => {
    // Registra um cliente para preparar o cenário de testes de falha,
    // sem verificar o sucesso aqui, pois o foco é nos erros subsequentes.
    await registrarCliente(contexto.app, {
      nome: 'Fluxo Falha',
      cpf: gerarCpfValidoUnico(),
      email: 'fluxo.falha@email.com',
      senha: 'SenhaFalha@123',
      confirmacaoSenha: 'SenhaFalha@123',
      limparDados: true,
    });

    const respostaLogin = await realizarLogin(contexto.app, 'fluxo.falha@email.com', 'SenhaFalha@123');
    const tokenCliente = respostaLogin.body.dados.token as string;

    // Tenta alterar senha com senha atual incorreta,
    // validando que a API rejeita mudanças sem verificação adequada.
    const respostaSenhaAtualIncorreta = await request(contexto.app)
      .patch('/api/clientes/seguranca/alterar-senha')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        senhaAtual: 'SenhaErrada@123',
        novaSenha: 'SenhaNovaFalha@123',
        confirmacaoNovaSenha: 'SenhaNovaFalha@123',
      });

    expect(respostaSenhaAtualIncorreta.status).toBe(400);
    expect(respostaSenhaAtualIncorreta.body.mensagem).toBe('Senha atual incorreta');

    // Tenta cadastrar um admin com token de cliente,
    // testando controle de acesso e autorização baseada em papéis.
    const respostaSemPermissaoAdmin = await request(contexto.app)
      .post('/api/admin/registro')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        nome: 'Admin Proibido',
        cpf: gerarCpfValidoUnico(),
        email: 'admin.proibido@email.com',
        senha: 'SenhaAdmin@123',
        confirmacaoSenha: 'SenhaAdmin@123',
      });

    expect(respostaSemPermissaoAdmin.status).toBe(403);

    // Tenta registrar cliente com email já existente,
    // validando unicidade de email no sistema.
    const respostaEmailDuplicado = await registrarCliente(contexto.app, {
      nome: 'Duplicado',
      cpf: gerarCpfValidoUnico(),
      email: 'fluxo.falha@email.com',
      senha: 'SenhaDuplicada@123',
      confirmacaoSenha: 'SenhaDuplicada@123',
    });

    expect(respostaEmailDuplicado.status).toBe(400);
    expect(respostaEmailDuplicado.body.mensagem).toBe('E-mail já cadastrado.');
  });
});
