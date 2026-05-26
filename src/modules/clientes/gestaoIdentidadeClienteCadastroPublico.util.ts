import bcrypt from 'bcryptjs';
import type { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import type { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import type { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import type { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import type { ICriarClienteDto } from '@/modules/clientes/Iclientes.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { validarCpf } from '@/shared/utils/validacao-cpf.util';
import { PAPEL_CLIENTE, PAPEL_ADMIN } from '@/shared/types/papeis';
import type { GestaoEnderecoCliente } from '@/modules/clientes/gestaoIdentidadeClienteEndereco.service';
import { mapearTipoTelefone } from '@/modules/clientes/gestaoIdentidadeClienteTexto.util';
import { ServicoLojas } from '@/modules/lojas/servicoLojas';

export type DepsCadastroPublicoCliente = {
  repositorioUsuarios: IRepositorioUsuarios;
  repositorioPerfil: IRepositorioPerfilCliente;
  repositorioTelefone: IRepositorioTelefoneUsuario;
  repositorioEndereco: IRepositorioEnderecoUsuario;
  endereco: GestaoEnderecoCliente;
  servicoLojas?: ServicoLojas;
};

function validarSenhaECpfCadastroPublico(dados: ICriarClienteDto): void {
  if (dados.senha !== dados.confirmacaoSenha) {
    throw new Error('Senha e confirmação não conferem.');
  }
  if (!verificarForcaSenha(dados.senha)) {
    throw new Error(
      'Senha fraca. É necessário pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e caractere especial.',
    );
  }
  if (!validarCpf(dados.cpf)) {
    throw new Error('CPF inválido. Certifique-se de que o formato e os dígitos estão corretos.');
  }
}

async function garantirEmailECpfLivresCadastro(
  deps: DepsCadastroPublicoCliente,
  dados: ICriarClienteDto,
): Promise<void> {
  const existentePorEmail = await deps.repositorioUsuarios.buscarPorEmail(dados.email);
  if (existentePorEmail) {
    throw new Error('E-mail já cadastrado.');
  }
  const existentePorCpf = await deps.repositorioUsuarios.buscarPorCpf(dados.cpf);
  if (existentePorCpf) {
    throw new Error('CPF já cadastrado.');
  }
}

async function persistirPerfilOpcional(
  deps: DepsCadastroPublicoCliente,
  usuarioId: number,
  dados: ICriarClienteDto,
): Promise<void> {
  if (!dados.genero && !dados.dataNascimento) {
    return;
  }
  await deps.repositorioPerfil.criar({
    idUsuario: usuarioId,
    genero: dados.genero,
    dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
  });
}

async function persistirTelefonePrincipalSeInformado(
  deps: DepsCadastroPublicoCliente,
  usuarioId: number,
  dados: ICriarClienteDto,
): Promise<void> {
  if (!('telefone' in dados) || !dados.telefone) {
    return;
  }
  await deps.repositorioTelefone.criar({
    idUsuario: usuarioId,
    idTipoTelefone: mapearTipoTelefone(dados.telefone.tipo),
    numero: dados.telefone.numero,
    principal: true,
  });
}

async function persistirEnderecosPosCadastro(
  deps: DepsCadastroPublicoCliente,
  usuarioId: number,
  dados: ICriarClienteDto,
): Promise<void> {
  if (!dados.enderecoCobranca) {
    return;
  }
  await deps.endereco.criarEndereco(usuarioId, dados.enderecoCobranca, 'cobranca', true);
  if (dados.enderecoEntregaIgualCobranca) {
    await deps.endereco.criarEndereco(usuarioId, dados.enderecoCobranca, 'entrega', false);
    return;
  }
  if (dados.enderecoEntrega) {
    await deps.endereco.criarEndereco(usuarioId, dados.enderecoEntrega, 'entrega', false);
  }
}

export async function realizarCadastroPublicoCliente(
  deps: DepsCadastroPublicoCliente,
  dados: ICriarClienteDto,
): Promise<{ uuid: string; nome: string; email: string; role: string }> {
  validarSenhaECpfCadastroPublico(dados);
  await garantirEmailECpfLivresCadastro(deps, dados);
  const senhaHash = await bcrypt.hash(dados.senha, 12);
  
  // Determinar papel do usuário baseado em querSerAdmin
  const role = dados.querSerAdmin ? PAPEL_ADMIN : PAPEL_CLIENTE;
  const papeis = dados.querSerAdmin ? [PAPEL_ADMIN, PAPEL_CLIENTE] : [PAPEL_CLIENTE];
  
  const usuario = await deps.repositorioUsuarios.criarUsuario({
    nome: dados.nome,
    email: dados.email,
    cpf: dados.cpf,
    senhaHash,
    role,
    papeis,
  });
  
  await persistirPerfilOpcional(deps, usuario.id, dados);
  await persistirTelefonePrincipalSeInformado(deps, usuario.id, dados);
  await persistirEnderecosPosCadastro(deps, usuario.id, dados);
  
  // Criar loja se dados fornecidos e servicoLojas disponível
  if (dados.querSerAdmin && dados.nomeFantasiaLoja && deps.servicoLojas) {
    const slug = dados.nomeFantasiaLoja
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const cnpj = dados.tipoPessoaLoja === 'PJ' ? (dados.cnpjLoja || '') : '';
    
    const lojaCriada = await deps.servicoLojas.criarLoja({
      nome: dados.nomeFantasiaLoja,
      slug,
      cnpj,
    });
    
    // Associar administrador à loja
    await deps.servicoLojas.associarAdminALoja(usuario.id, lojaCriada.uuid, 'admin');
  }
  
  return {
    uuid: usuario.uuid,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role.descricao,
  };
}
