import request, { Response } from 'supertest';
import { Application } from 'express';
import bcrypt from 'bcryptjs';
import { di } from '@/shared/infrastructure/di.container';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';
import { ITelefoneDto, IEnderecoDto } from '@/modules/clientes/Iclientes.dto';

type DadosCadastroCliente = {
  nome?: string;
  cpf?: string;
  email?: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  senha?: string;
  confirmacaoSenha?: string;
  enderecoCobranca?: IEnderecoDto;
  enderecoEntrega?: IEnderecoDto;
  enderecoEntregaIgualCobranca?: boolean;
};

export async function registrarCliente(
  app: Application,
  dados: DadosCadastroCliente & { limparDados?: boolean } = {},
): Promise<Response> {
  const payloadPadrao = {
    nome: 'Cliente Teste',
    cpf: '123.456.789-10',
    email: 'cliente.teste@email.com',
    senha: 'SenhaForte@123',
    confirmacaoSenha: 'SenhaForte@123',
  };

  const finalCpf = dados.cpf || payloadPadrao.cpf;
  const finalEmail = dados.email || payloadPadrao.email;

  if (dados.limparDados) {
    await di.repoUsuarios.limparDadosUsuarioPorCpf(finalCpf);
    await di.repoUsuarios.deletarPorEmail(finalEmail);
  }

  const res = await request(app).post('/api/clientes/registro').send({
    ...payloadPadrao,
    ...dados,
  });

  // Apenas log de debug para cenários de erro esperados nos testes
  if (res.status !== 201 && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] Erro no registro de cliente: ${res.status} - ${JSON.stringify(res.body)}`);
  }
  return res;
}

export async function registrarAdmin(
  app: Application,
  tokenAdmin: string,
  dados: DadosCadastroCliente & { limparDados?: boolean } = {},
): Promise<Response> {
  const payloadPadrao = {
    nome: 'Admin Teste',
    cpf: '000.000.000-01',
    email: 'admin.teste@email.com',
    senha: 'SenhaAdmin@123',
    confirmacaoSenha: 'SenhaAdmin@123',
  };

  const finalCpf = dados.cpf || payloadPadrao.cpf;
  const finalEmail = dados.email || payloadPadrao.email;

  if (dados.limparDados) {
    await di.repoUsuarios.limparDadosUsuarioPorCpf(finalCpf);
    await di.repoUsuarios.deletarPorEmail(finalEmail);
  }

  return request(app)
    .post('/api/admin/registro')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      ...payloadPadrao,
      ...dados,
    });
}

export async function realizarLogin(
  app: Application,
  email: string,
  senha: string,
): Promise<Response> {
  return request(app).post('/api/auth/login').send({ email, senha });
}

export async function obterTokenCliente(
  app: Application,
  email = 'cliente.teste@email.com',
  cpf = '123.456.789-10',
  limparDados = false
): Promise<string> {
  const repositorioUsuarios = di.repoUsuarios;

  if (limparDados) {
    await repositorioUsuarios.deletarPorCpf(cpf);
    await repositorioUsuarios.deletarPorEmail(email);
  }

  // Mesma abordagem de obterTokenAdmin: cria/atualiza via repositório diretamente
  // para que o usuário fique visível dentro da transação de isolamento do teste.
  const senhaHash = await bcrypt.hash('SenhaForte@123', 10);
  const clienteExistente = await repositorioUsuarios.buscarPorEmail(email);

  if (!clienteExistente) {
    await repositorioUsuarios.criarUsuario({
      nome: 'Cliente Teste',
      email,
      cpf,
      senhaHash,
      role: PAPEL_CLIENTE,
    });
  } else {
    // Garante que a senha é 'SenhaForte@123' na transação atual
    await repositorioUsuarios.atualizarUsuario(clienteExistente.uuid, { senhaHash });
  }

  const maximoTentativas = 5;

  for (let tentativa = 1; tentativa <= maximoTentativas; tentativa += 1) {
    // eslint-disable-next-line no-await-in-loop
    const respostaLogin = await realizarLogin(app, email, 'SenhaForte@123');

    if (respostaLogin.status === 200 && respostaLogin.body?.dados?.token) {
      return respostaLogin.body.dados.token as string;
    }

    if (tentativa === maximoTentativas) {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG] Falha temporária no login de teste:', respostaLogin.status, JSON.stringify(respostaLogin.body));
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  }

  throw new Error(`Não foi possível obter token do cliente de teste (${email}).`);
}

export async function obterTokenAdmin(app: Application): Promise<string> {
  const repositorioUsuarios = di.repoUsuarios;
  const adminExistente = await repositorioUsuarios.buscarPorEmail('admin@livraria.com.br');

  // Gera o hash para a senha conhecida dos testes uma única vez
  const senhaHashAdmin = await bcrypt.hash('Admin@123', 10);

  if (!adminExistente) {
    await repositorioUsuarios.criarUsuario({
      nome: 'Administrador Mestre',
      email: 'admin@livraria.com.br',
      cpf: '000.000.000-00',
      senhaHash: senhaHashAdmin,
      role: PAPEL_ADMIN,
      isAdminMestre: true,
    });
  } else {
    // Atualiza o hash dentro da transação de isolamento para garantir que a senha
    // conhecida ('Admin@123') seja usada, independentemente do que foi seedado no banco.
    // A mudança é revertida ao final do teste junto com a transação.
    await repositorioUsuarios.atualizarUsuario(adminExistente.uuid, { 
      senhaHash: senhaHashAdmin,
      isAdminMestre: true 
    });
  }

  const maximoTentativas = 5;

  for (let tentativa = 1; tentativa <= maximoTentativas; tentativa += 1) {
    // eslint-disable-next-line no-await-in-loop
    const respostaLogin = await realizarLogin(app, 'admin@livraria.com.br', 'Admin@123');

    if (respostaLogin.status === 200 && respostaLogin.body?.dados?.token) {
      return respostaLogin.body.dados.token as string;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }

  throw new Error('Não foi possível obter token do administrador inicial.');
}
