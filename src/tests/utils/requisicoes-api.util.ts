import request, { Response } from 'supertest';
import { Application } from 'express';
import bcrypt from 'bcryptjs';
import { di } from '@/shared/infrastructure/di.container';
import { PAPEL_ADMIN } from '@/shared/types/papeis';

type DadosCadastroCliente = {
  nome?: string;
  cpf?: string;
  email?: string;
  senha?: string;
  confirmacao_senha?: string;
};

export async function registrarCliente(
  app: Application,
  dados: DadosCadastroCliente = {},
): Promise<Response> {
  const payloadPadrao = {
    nome: 'Cliente Teste',
    cpf: '123.456.789-10',
    email: 'cliente.teste@email.com',
    senha: 'SenhaForte@123',
    confirmacao_senha: 'SenhaForte@123',
  };

  return request(app).post('/api/clientes/registro').send({
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

export async function obterTokenCliente(app: Application): Promise<string> {
  await registrarCliente(app);
  const respostaLogin = await realizarLogin(app, 'cliente.teste@email.com', 'SenhaForte@123');

  return respostaLogin.body?.dados?.token as string;
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
    });
  } else {
    // Atualiza o hash dentro da transação de isolamento para garantir que a senha
    // conhecida ('Admin@123') seja usada, independentemente do que foi seedado no banco.
    // A mudança é revertida ao final do teste junto com a transação.
    await repositorioUsuarios.atualizarUsuario(adminExistente.uuid, { senhaHash: senhaHashAdmin });
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
