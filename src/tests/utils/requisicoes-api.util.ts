import request, { Response } from 'supertest';
import { Application } from 'express';
import bcrypt from 'bcryptjs';
import { di } from '@/shared/infrastructure/di.container';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';
import { ITelefoneDto, IEnderecoDto } from '@/modules/clientes/Iclientes.dto';
import { validarCpf } from '@/shared/utils/validacao-cpf.util';

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

async function logApi(reqPromise: Promise<import('supertest').Response>) {
  const res = await reqPromise;
  // Comentado para evitar lint errors - logs de debug podem ser reabilitados se necessário
  // console.log(`\n🚀 [API CALL] ${req.method} ${req.url}`);
  // if (req._data) {
  //   console.log(`📦 PAYLOAD: ${JSON.stringify(req._data).substring(0, 200)}`);
  // }
  // const count = Array.isArray(res.body) ? res.body.length : (res.body ? 1 : 0);
  // console.log(`✅ RESPONSE COUNT: ${count}`);
  return res;
}

/** Gera CPF válido (dígitos verificadores) para testes de integração sem colisão. */
export function gerarCpfValidoUnico(): string {
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const base = String(Math.floor(100000000 + Math.random() * 899999999));
    const calcDigito = (numeros: string, tamanho: number): number => {
      let soma = 0;
      for (let i = 0; i < tamanho; i += 1) {
        soma += parseInt(numeros.charAt(i), 10) * (tamanho + 1 - i);
      }
      const resto = 11 - (soma % 11);
      return resto === 10 || resto === 11 ? 0 : resto;
    };
    const d1 = calcDigito(base, 9);
    const d2 = calcDigito(`${base}${d1}`, 10);
    const numeros = `${base}${d1}${d2}`;
    const cpfFormatado = numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (validarCpf(cpfFormatado)) {
      return cpfFormatado;
    }
  }
  return '529.982.247-25';
}

export async function registrarCliente(
  app: Application,
  dados: DadosCadastroCliente & { limparDados?: boolean } = {},
): Promise<Response> {
  const payloadPadrao = {
    nome: 'Cliente Teste',
    cpf: gerarCpfValidoUnico(),
    email: 'cliente.teste@email.com',
    senha: 'SenhaForte@123',
    confirmacaoSenha: 'SenhaForte@123',
  };

  const finalCpf = dados.cpf ?? payloadPadrao.cpf;
  const finalEmail = dados.email || payloadPadrao.email;

  if (dados.limparDados) {
    // Limpar por CPF primeiro
    await di.repoUsuarios.limparDadosUsuarioPorCpf(finalCpf);
    // Limpar por email também para garantir consistência (caso exista usuário com mesmo email mas CPF diferente)
    try {
      await di.repoUsuarios.deletarPorEmail(finalEmail);
    } catch (erro) {
      // Ignorar erro se email não existir
      if (!(erro instanceof Error) || !erro.message.includes('não encontrado')) {
        throw erro;
      }
    }
    // Pequeno delay para garantir que a transação foi commitada
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const res = await logApi(request(app).post('/api/clientes/registro').send({
    ...payloadPadrao,
    ...dados,
  }));

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
    cpf: gerarCpfValidoUnico(),
    email: `admin.teste.${Date.now()}@email.com`,
    senha: 'SenhaAdmin@123',
    confirmacaoSenha: 'SenhaAdmin@123',
  };

  const finalCpf = dados.cpf || payloadPadrao.cpf;
  const finalEmail = dados.email || payloadPadrao.email;

  if (dados.limparDados) {
    await di.repoUsuarios.limparDadosUsuarioPorCpf(finalCpf);
    try {
      await di.repoUsuarios.deletarPorEmail(finalEmail);
    } catch (erro) {
      if (!(erro instanceof Error) || !erro.message.includes('não encontrado')) {
        throw erro;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return logApi(request(app)
    .post('/api/admin/registro')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      ...payloadPadrao,
      ...dados,
    }));
}

export async function realizarLogin(
  app: Application,
  email: string,
  senha: string,
): Promise<Response> {
  return logApi(request(app).post('/api/auth/login').send({ email, senha }));
}

export async function obterTokenCliente(
  app: Application,
  email = 'cliente.teste@email.com',
  cpf = '529.982.247-25',
  limparDados = false
): Promise<string> {
  const repositorioUsuarios = di.repoUsuarios;
  const repositorioPerfil = di.repoPerfil;

  if (limparDados) {
    await repositorioUsuarios.limparDadosUsuarioPorCpf(cpf);
  }

  // Mesma abordagem de obterTokenAdmin: cria/atualiza via repositório diretamente
  // para que o usuário fique visível dentro da transação de isolamento do teste.
  const senhaHash = await bcrypt.hash('SenhaForte@123', 10);
  const clienteExistente = await repositorioUsuarios.buscarPorEmail(email);

  let usuarioId: number;

  if (!clienteExistente) {
    const usuario = await repositorioUsuarios.criarUsuario({
      nome: 'Cliente Teste',
      email,
      cpf,
      senhaHash,
      role: PAPEL_CLIENTE,
      papeis: [PAPEL_CLIENTE],
      isAdminMestre: false,
    });
    usuarioId = usuario.id;

    // Criar perfil em livraria_gestao.clientes com genero e dataNascimento
    await repositorioPerfil.criar({
      idUsuario: usuarioId,
      genero: 'M',
      dataNascimento: new Date('1990-01-01'),
    });
  } else {
    // Garante que a senha é 'SenhaForte@123' e que o papel seja apenas cliente na transação atual
    await repositorioUsuarios.atualizarUsuario(clienteExistente.uuid, { 
      senhaHash,
      idPapel: PAPEL_CLIENTE.id,
      isAdminMestre: false
    });
    
    // Remove TODOS os papéis existentes e garante que apenas cliente esteja ativo
    // Isso resolve o problema de usuários com múltiplos papéis (admin + cliente)
    await repositorioUsuarios.removerTodosPapeisUsuario(clienteExistente.id);
    await repositorioUsuarios.associarPapelUsuario(clienteExistente.id, PAPEL_CLIENTE.id);
    
    usuarioId = clienteExistente.id;

    // Verificar se perfil existe, se não, criar
    const perfilExistente = await repositorioPerfil.buscarPorIdUsuario(usuarioId);
    if (!perfilExistente) {
      await repositorioPerfil.criar({
        idUsuario: usuarioId,
        genero: 'M',
        dataNascimento: new Date('1990-01-01'),
      });
    }
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
      papeis: [PAPEL_ADMIN],
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

/**
 * Helper de teste: cria um cupom de troca usando a rota de teste protegida.
 */
export async function criarCupomTrocaTeste(
  app: Application,
  tokenAdmin: string,
  clienteId: number,
  codigo: string,
  valor: number,
): Promise<Response> {
  return logApi(request(app)
    .post('/api/admin/testes/criar-cupom')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ clienteId, codigo, valor }));
}

/**
 * Helper de teste: expira uma intenção de pagamento simulando TTL.
 */
export async function expirarIntencaoTeste(
  app: Application,
  tokenAdmin: string,
  idIntencao: string,
): Promise<Response> {
  return logApi(request(app)
    .post('/api/admin/testes/expirar-intencao')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ idIntencao }));
}

/**
 * Helper de teste: muda o status de uma venda.
 */
export async function mudarStatusVendaTeste(
  app: Application,
  tokenAdmin: string,
  vendaUuid: string,
  novoStatus: string,
  dataEntrega?: string,
): Promise<Response> {
  return logApi(request(app)
    .post('/api/admin/testes/mudar-status-venda')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ vendaUuid, novoStatus, dataEntrega }));
}
