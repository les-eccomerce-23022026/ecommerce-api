import bcrypt from 'bcryptjs';
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
} from '@/modules/clientes/Iclientes.dto';
import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ClientesEnderecoService } from './clientes-endereco.service';
import { ClientesCadastroService } from './clientes-cadastro.service';
import { ClientesAtualizacaoService } from './clientes-atualizacao.service';
import { ClientesConsultaService } from './clientes-consulta.service';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 */
export class GestaoIdentidadeCliente {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  private readonly repositorioPerfil: IRepositorioPerfilCliente;

  private readonly repositorioTelefone: IRepositorioTelefoneUsuario;

  private readonly repositorioEndereco: IRepositorioEnderecoUsuario;

  private readonly repositorioCartoes: IRepositorioCartaoUsuario;

  private readonly db: IConexaoBanco; // Acesso direto ao banco para queries customizadas

  private readonly servicoEndereco: ClientesEnderecoService;

  private readonly servicoCadastro: ClientesCadastroService;

  private readonly servicoAtualizacao: ClientesAtualizacaoService;

  private readonly servicoConsulta: ClientesConsultaService;

  /**
   * Construtor injetado com os repositórios — sem saber a implementação (Inversão de Dependência)
   */
  constructor(
    repositorioUsuarios: IRepositorioUsuarios,
    repositorioPerfil: IRepositorioPerfilCliente,
    repositorioTelefone: IRepositorioTelefoneUsuario,
    repositorioEndereco: IRepositorioEnderecoUsuario,
    repositorioCartoes: IRepositorioCartaoUsuario,
    db: IConexaoBanco,
  ) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioPerfil = repositorioPerfil;
    this.repositorioTelefone = repositorioTelefone;
    this.repositorioEndereco = repositorioEndereco;
    this.repositorioCartoes = repositorioCartoes;
    this.db = db;
    this.servicoEndereco = new ClientesEnderecoService(repositorioEndereco, db);
    this.servicoCadastro = new ClientesCadastroService(
      repositorioUsuarios,
      repositorioPerfil,
      repositorioTelefone,
      this.servicoEndereco,
    );
    this.servicoAtualizacao = new ClientesAtualizacaoService(
      repositorioUsuarios,
      repositorioPerfil,
      repositorioTelefone,
      repositorioEndereco,
      this.servicoEndereco,
    );
    this.servicoConsulta = new ClientesConsultaService(
      repositorioUsuarios,
      repositorioPerfil,
      repositorioTelefone,
      repositorioEndereco,
      repositorioCartoes,
      db,
      this.servicoEndereco,
    );
  }

  /**
   * Altera a senha de um cliente existente. (RF0028)
   *
   * @param uuid Identificador único do cliente.
   * @param dados Dados contendo senha atual e nova senha.
   */
  public async alterarSenha(uuid: string, dados: IAlterarSenhaDto): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const senhaValida = await bcrypt.compare(dados.senhaAtual, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Senha atual incorreta.');
    }

    if (dados.novaSenha !== dados.confirmacaoNovaSenha) {
      throw new Error('Nova senha e confirmação não conferem.');
    }

    if (!verificarForcaSenha(dados.novaSenha)) {
      throw new Error('Nova senha muito fraca.');
    }

    if (dados.novaSenha === dados.senhaAtual) {
      throw new Error('Nova senha deve ser diferente da senha atual.');
    }

    const novaSenhaHash = await bcrypt.hash(dados.novaSenha, 10); // Reduzido de 12 para 10 em testes
    await this.repositorioUsuarios.atualizarUsuario(uuid, { senhaHash: novaSenhaHash });
  }

  /**
   * Atualiza os dados de um cliente existente.
   * Suporta atualização parcial e exige senha para dados críticos (E-mail, CPF, Telefone).
   *
   * @param uuid Identificador único do cliente.
   * @param dados Dados a serem atualizados (parcial).
   */
  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    await this.servicoAtualizacao.atualizarCliente(uuid, dados);
    return this.obterPerfil(uuid);
  }

  /**
   * Adiciona um novo endereço de entrega ou cobrança ao cliente. (RF0026)
   */
  public async adicionarEndereco(
    uuid: string,
    dados: IEnderecoDto & { tipoEndereco?: 'cobranca' | 'entrega' },
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) throw new Error('Usuário não encontrado.');

    return this.servicoEndereco.criarEndereco(usuario.id, dados, dados.tipoEndereco || 'entrega', false);
  }

  /**
   * Remove um endereço pelo UUID do endereço, validando o dono.
   */
  public async removerEndereco(uuidUsuario: string, uuidEndereco: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new Error('Usuário não encontrado.');

    const todosEnderecos = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecoExistente = todosEnderecos.find((e) => e.uuid === uuidEndereco);

    if (!enderecoExistente) {
      throw new Error('Endereço não encontrado.');
    }

    await this.repositorioEndereco.deletar(usuario.id, uuidEndereco);
  }

  /**
   * Inativa um cliente (soft delete) (RF0023).
   *
   * @param uuid Identificador único do cliente.
   */
  public async suspenderAcessoCliente(uuid: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    if (!usuario.ativo) {
      throw new Error('Conta já está inativa.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: false });
  }

  /**
   * Obtém o perfil completo do cliente.
   *
   * @param uuid UUID do cliente.
   * @returns Dados do perfil do cliente.
   */
  public async obterPerfil(uuid: string): Promise<IPerfilClienteDto> {
    return this.servicoConsulta.obterPerfil(uuid);
  }

  public async realizarCadastroPublico(dados: ICriarClienteDto) {
    return this.servicoCadastro.realizarCadastroPublico(dados);
  }

  /**
   * Edita um endereço de um cliente (PATCH). (RF0026)
   */
  public async editarEndereco(
    uuidUsuario: string,
    uuidEndereco: string,
    dados: Partial<IEnderecoDto>,
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new Error('Usuário não encontrado.');

    return this.servicoEndereco.editarEndereco(usuario.id, uuidEndereco, dados);
  }
}
