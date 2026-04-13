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
  ICartaoDto,
} from '@/modules/clientes/Iclientes.dto';
import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { GestaoEnderecoCliente } from '@/modules/clientes/gestao-identidade-cliente-endereco.service';
import { GestaoIdentidadeClienteOperacoes } from '@/modules/clientes/gestao-identidade-cliente-operacoes.service';
import {
  mascararCpf,
  mascararEmail,
  converterTelefoneParaDto,
} from '@/modules/clientes/gestao-identidade-cliente-texto.util';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 */
export class GestaoIdentidadeCliente {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  private readonly repositorioPerfil: IRepositorioPerfilCliente;

  private readonly repositorioTelefone: IRepositorioTelefoneUsuario;

  private readonly repositorioEndereco: IRepositorioEnderecoUsuario;

  private readonly repositorioCartoes: IRepositorioCartaoUsuario;

  private readonly db: IConexaoBanco;

  private readonly endereco: GestaoEnderecoCliente;

  private readonly operacoes: GestaoIdentidadeClienteOperacoes;

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
    this.endereco = new GestaoEnderecoCliente(db, repositorioEndereco);
    this.operacoes = new GestaoIdentidadeClienteOperacoes({
      repositorioUsuarios,
      repositorioPerfil,
      repositorioTelefone,
      repositorioEndereco,
      endereco: this.endereco,
      obterPerfil: (uuid) => this.obterPerfil(uuid),
    });
  }

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
    const novaSenhaHash = await bcrypt.hash(dados.novaSenha, 10);
    await this.repositorioUsuarios.atualizarUsuario(uuid, { senhaHash: novaSenhaHash });
  }

  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    return this.operacoes.atualizarCliente(uuid, dados);
  }

  public async adicionarEndereco(
    uuid: string,
    dados: IEnderecoDto & { tipoEndereco?: 'cobranca' | 'entrega' },
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) throw new Error('Usuário não encontrado.');
    return this.endereco.criarEndereco(usuario.id, dados, dados.tipoEndereco || 'entrega', false);
  }

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

  public async obterPerfil(uuid: string): Promise<IPerfilClienteDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }
    const perfil = await this.repositorioPerfil.buscarPorIdUsuario(usuario.id);
    const telefones = await this.repositorioTelefone.buscarPorIdUsuario(usuario.id);
    let telefonePrincipal = telefones.find((telefone) => telefone.principal) ?? telefones[0];
    if (!telefonePrincipal && usuario.telefoneRapido) {
      telefonePrincipal = {
        id: 0,
        uuid: '',
        idUsuario: usuario.id,
        idTipoTelefone: 1,
        ddd: '',
        numero: usuario.telefoneRapido,
        principal: true,
      };
    }
    const enderecosUsuario = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecosDto = await this.endereco.converterEnderecosParaDto(enderecosUsuario);
    const cartoesUsuario = await this.repositorioCartoes.buscarPorUsuario(usuario.id);
    const cartoesDto: ICartaoDto[] = cartoesUsuario.map((c) => ({
      uuid: c.uuid,
      ultimosDigitosCartao: c.ultimosDigitosCartao,
      nomeImpresso: c.nomeImpresso,
      bandeira: c.bandeira || 'Outra',
      validade: c.validade.toISOString().substring(0, 7),
      principal: c.principal,
    }));
    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      emailMascarado: mascararEmail(usuario.email),
      cpf: usuario.cpf,
      cpfMascarado: mascararCpf(usuario.cpf),
      genero: perfil?.genero,
      dataNascimento: perfil?.dataNascimento ? perfil.dataNascimento.toISOString().split('T')[0] : undefined,
      telefone: telefonePrincipal ? converterTelefoneParaDto(telefonePrincipal) : undefined,
      enderecos: enderecosDto,
      cartoes: cartoesDto,
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
    if (!usuario) throw new Error('Usuário não encontrado.');
    return this.endereco.editarEndereco(usuario, uuidEndereco, dados);
  }
}
