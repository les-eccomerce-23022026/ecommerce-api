import request from 'supertest';
import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';
import { registrarCliente, obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

// Testes de integração para rotas de clientes (/api/clientes),
// cobrindo registro, validações de senha e segurança de acesso autenticado.
describe('Integração - Clientes (rotas individuais)', () => {
  let app: Application;
  let escopo: EscopoIsolamentoIntegracao;

  // Inicializa a aplicação Express uma vez, reutilizando-a
  // para eficiência, já que a configuração é estática.
  beforeAll(() => {
    app = criarAplicacao();
  });

  // Cria escopo isolado de banco antes de cada teste
  // para garantir independência e evitar estado compartilhado.
  beforeEach(async () => {
    escopo = await iniciarEscopoIsolamentoIntegracao();
  });

  // Limpa o escopo após cada teste para manter consistência.
  afterEach(async () => {
    await escopo.finalizar();
  });

  it('deve registrar cliente com sucesso', async () => {
    // Registra um cliente com dados válidos padrão,
    // testando o caminho feliz do registro e geração de UUID.
    const resposta = await registrarCliente(app);

    expect(resposta.status).toBe(201);
    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados.uuid).toBeDefined();
  });

  it('deve falhar no registro com campos obrigatórios ausentes', async () => {
    // Envia apenas o nome, omitindo outros campos obrigatórios,
    // testando validação de presença de dados essenciais.
    const resposta = await request(app).post('/api/clientes/registro').send({ nome: 'Cliente' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toContain('Campos obrigatórios ausentes');
  });

  it('deve falhar no registro quando senha e confirmação diferem', async () => {
    // Registra cliente com confirmação de senha diferente,
    // validando consistência entre senha e sua confirmação.
    const resposta = await registrarCliente(app, {
      confirmacao_senha: 'SenhaDiferente@123',
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Senha e confirmação de senha não conferem.');
  });

  it('deve falhar no registro com senha fraca', async () => {
    // Tenta registrar com senha muito simples ('123'),
    // testando políticas de segurança de senha.
    const resposta = await registrarCliente(app, {
      senha: '123',
      confirmacao_senha: '123',
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toContain('Senha fraca');
  });

  it('deve falhar na alteração de senha sem token', async () => {
    // Tenta alterar senha sem fornecer token de autenticação,
    // validando proteção de rotas autenticadas.
    const resposta = await request(app).patch('/api/clientes/seguranca/alterar-senha').send({
      senha_atual: 'SenhaForte@123',
      nova_senha: 'NovaSenha@123',
      confirmacao_senha: 'NovaSenha@123',
    });

    expect(resposta.status).toBe(401);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Token não fornecido.');
  });

  it('deve falhar na alteração de senha com senha atual inválida', async () => {
    // Obtém token de cliente autenticado para testar alteração,
    // mas usa senha atual incorreta para validar verificação.
    const tokenCliente = await obterTokenCliente(app);

    const resposta = await request(app)
      .patch('/api/clientes/seguranca/alterar-senha')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        senha_atual: 'SenhaAtualErrada@123',
        nova_senha: 'NovaSenhaValida@123',
        confirmacao_senha: 'NovaSenhaValida@123',
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
    expect(resposta.body.mensagem).toBe('Senha atual incorreta.');
  });
});
