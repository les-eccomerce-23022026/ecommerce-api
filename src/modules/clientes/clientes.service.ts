import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import {
  ICriarClienteDto,
  IAtualizarClienteDto,
  IAlterarSenhaDto,
  IEnderecoDto,
  IPerfilClienteDto,
  ICartaoDto,
} from '@/modules/clientes/Iclientes.dto';
import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { GestaoEnderecoCliente } from '@/modules/clientes/gestaoIdentidadeClienteEndereco.service';
import { GestaoIdentidadeClienteOperacoes } from '@/modules/clientes/gestaoIdentidadeClienteOperacoes.service';
import { GestaoSenhaCliente } from '@/modules/clientes/gestaoSenhaCliente.service';
import { GestaoTelefoneCliente } from '@/modules/clientes/gestaoTelefoneCliente.service';
import { GestaoCartaoCliente } from '@/modules/clientes/gestaoCartaoCliente.service';
import { GestaoPerfilCliente } from '@/modules/clientes/gestaoPerfilCliente.service';
import {
  mascararCpf,
  mascararEmail,
} from '@/modules/clientes/gestaoIdentidadeClienteTexto.util';
import { ServicoLojas } from '@/modules/lojas/servicoLojas';
import { UsuarioNaoEncontradoError, OperacaoNaoPermitidaError } from '@/shared/exceptions/Exceptions';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 * 
 * Coordena os serviços especializados para gestão de identidade do cliente:
 * - GestaoSenhaCliente: gestão de senhas
 * - GestaoTelefoneCliente: gestão de telefones
 * - GestaoCartaoCliente: gestão de cartões
 * - GestaoPerfilCliente: gestão de perfil
 * - GestaoEnderecoCliente: gestão de endereços
 * - GestaoIdentidadeClienteOperacoes: operações complexas de cadastro/atualização
 */
export class GestaoIdentidadeCliente {
  private readonly repositorioUsuarios: IRepositorioUsuarios;
  private readonly repositorioEndereco: IRepositorioEnderecoUsuario;
  private readonly db: IConexaoBanco;
  private readonly endereco: GestaoEnderecoCliente;
  private readonly operacoes: GestaoIdentidadeClienteOperacoes;
  private readonly senha: GestaoSenhaCliente;
  private readonly telefone: GestaoTelefoneCliente;
  private readonly cartao: GestaoCartaoCliente;
  private readonly perfil: GestaoPerfilCliente;
  private readonly servicoLojas?: ServicoLojas;

  constructor(
    repositorioUsuarios: IRepositorioUsuarios,
    repositorioPerfil: IRepositorioPerfilCliente,
    repositorioTelefone: IRepositorioTelefoneUsuario,
    repositorioEndereco: IRepositorioEnderecoUsuario,
    repositorioCartoes: IRepositorioCartaoUsuario,
    db: IConexaoBanco,
    servicoLojas?: ServicoLojas,
  ) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioEndereco = repositorioEndereco;
    this.db = db;
    this.servicoLojas = servicoLojas;
    
    // Inicializa serviços especializados
    this.endereco = new GestaoEnderecoCliente(db, repositorioEndereco);
    this.senha = new GestaoSenhaCliente(repositorioUsuarios);
    this.telefone = new GestaoTelefoneCliente(repositorioTelefone);
    this.cartao = new GestaoCartaoCliente(repositorioCartoes);
    this.perfil = new GestaoPerfilCliente(repositorioPerfil);
    
    this.operacoes = new GestaoIdentidadeClienteOperacoes({
      repositorioUsuarios,
      repositorioPerfil,
      repositorioTelefone,
      repositorioEndereco,
      endereco: this.endereco,
      obterPerfil: (uuid) => this.obterPerfil(uuid),
      servicoLojas: this.servicoLojas,
    });
  }

  public async alterarSenha(uuid: string, dados: IAlterarSenhaDto): Promise<void> {
    return this.senha.alterarSenha(uuid, dados);
  }

  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    return this.operacoes.atualizarCliente(uuid, dados);
  }

  public async adicionarEndereco(
    uuid: string,
    dados: IEnderecoDto & { tipoEndereco?: 'cobranca' | 'entrega' },
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) throw new UsuarioNaoEncontradoError(uuid);
    return this.endereco.criarEndereco(usuario.id, dados, dados.tipoEndereco || 'entrega', false);
  }

  public async removerEndereco(uuidUsuario: string, uuidEndereco: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new UsuarioNaoEncontradoError(uuidUsuario);
    const todosEnderecos = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecoExistente = todosEnderecos.find((e) => e.uuid === uuidEndereco);
    if (!enderecoExistente) {
      throw new OperacaoNaoPermitidaError('Endereço não encontrado.');
    }
    await this.repositorioEndereco.deletar(usuario.id, uuidEndereco);
  }

  public async suspenderAcessoCliente(uuid: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new UsuarioNaoEncontradoError(uuid);
    }
    if (!usuario.ativo) {
      throw new OperacaoNaoPermitidaError('Conta já está inativa.');
    }
    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: false });
  }

  public async obterPerfil(uuid: string): Promise<IPerfilClienteDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new UsuarioNaoEncontradoError(uuid);
    }
    
    // Usa serviços especializados
    const perfil = await this.perfil.buscarPerfilPorUsuario(usuario.id);
    const telefone = await this.telefone.buscarTelefonePrincipal(usuario.id);
    const enderecosUsuario = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecosDto = await this.endereco.converterEnderecosParaDto(enderecosUsuario);
    const cartoes = await this.cartao.buscarCartoesPorUsuario(usuario.id);
    
    // Fallback para telefone rápido se não houver telefone cadastrado
    let telefoneFinal = telefone;
    if (!telefoneFinal && usuario.telefoneRapido) {
      telefoneFinal = {
        id: 0,
        uuid: '',
        idUsuario: usuario.id,
        idTipoTelefone: 1,
        ddd: '',
        numero: usuario.telefoneRapido,
        principal: true,
      };
    }
    
    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      emailMascarado: mascararEmail(usuario.email),
      cpf: usuario.cpf,
      cpfMascarado: usuario.cpf ? mascararCpf(usuario.cpf) : undefined,
      genero: perfil?.genero,
      dataNascimento: perfil?.dataNascimento,
      telefone: telefoneFinal,
      enderecos: enderecosDto,
      cartoes: cartoes,
    };
  }

  public async realizarCadastroPublico(dados: ICriarClienteDto) {
    return this.operacoes.realizarCadastroPublico(dados);
  }

  public async editarEndereco(
    uuidUsuario: string,
    uuidEndereco: string,
    dados: Partial<IEnderecoDto>,
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new UsuarioNaoEncontradoError(uuidUsuario);
    return this.endereco.editarEndereco(usuario, uuidEndereco, dados);
  }
}
