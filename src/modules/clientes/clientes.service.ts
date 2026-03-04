import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import {
  ICriarClienteDto,
  ICriarClienteMinimoDto,
  IAtualizarClienteDto,
  IAlterarSenhaDto,
} from '@/modules/clientes/Iclientes.dto';
import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 */
export class ServicoClientes {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  private readonly repositorioPerfil: IRepositorioPerfilCliente;

  private readonly repositorioTelefone: IRepositorioTelefoneUsuario;

  /**
   * Construtor injetado com os repositórios — sem saber a implementação (Inversão de Dependência)
   */
  constructor(
    repositorioUsuarios: IRepositorioUsuarios,
    repositorioPerfil: IRepositorioPerfilCliente,
    repositorioTelefone: IRepositorioTelefoneUsuario,
  ) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioPerfil = repositorioPerfil;
    this.repositorioTelefone = repositorioTelefone;
  }

  private static mapearTipoTelefone(tipo: string): number {
    const mapeamentoTipos: Record<string, number> = {
      celular: 1,
      residencial: 2,
      comercial: 3,
    };

    return mapeamentoTipos[tipo.toLowerCase()] ?? 1; // default celular
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

    const senhaValida = await bcrypt.compare(dados.senha_atual, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Senha atual incorreta.');
    }

    if (dados.nova_senha !== dados.confirmacao_senha) {
      throw new Error('Nova senha e confirmação não conferem.');
    }

    if (!verificarForcaSenha(dados.nova_senha)) {
      throw new Error('Nova senha muito fraca.');
    }

    if (dados.nova_senha === dados.senha_atual) {
      throw new Error('Nova senha deve ser diferente da senha atual.');
    }

    const novaSenhaHash = await bcrypt.hash(dados.nova_senha, 10); // Reduzido de 12 para 10 em testes
    await this.repositorioUsuarios.atualizarUsuario(uuid, { senhaHash: novaSenhaHash });
  }

  /**
   * Atualiza os dados de um cliente existente.
   *
   * @param uuid Identificador único do cliente.
   * @param dados Dados a serem atualizados (parcial).
   */
  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    const usuarioNoBanco = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuarioNoBanco) {
      throw new Error('Usuário não encontrado.');
    }

    const perfilExistente = await this.repositorioPerfil.buscarPorIdUsuario(usuarioNoBanco.id);
    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(usuarioNoBanco.id);

    const usuarioAtualizado = await this.repositorioUsuarios.atualizarUsuario(uuid, {
      nome: dados.nome ?? usuarioNoBanco.nome,
    });

    if (!usuarioAtualizado) {
      throw new Error('Erro ao atualizar usuário.');
    }

    // Atualizar perfil (genero / dataNascimento) — RF0022
    if (dados.genero !== undefined || dados.dataNascimento !== undefined) {
      const perfilAtualizado: IPerfilCliente = {
        idUsuario: usuarioNoBanco.id,
        genero: dados.genero ?? perfilExistente?.genero,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : perfilExistente?.dataNascimento,
      };
      if (perfilExistente) {
        await this.repositorioPerfil.atualizar(perfilAtualizado);
      } else {
        await this.repositorioPerfil.criar(perfilAtualizado);
      }
    }

    // Atualizar telefone — RF0022: recriar telefone principal se enviado
    if (dados.telefone !== undefined) {
      await Promise.all(
        telefonesExistentes
          .filter((tel) => tel.uuid)
          .map((tel) => this.repositorioTelefone.deletar(usuarioNoBanco.id, tel.uuid!)),
      );
      if (dados.telefone) {
        await this.repositorioTelefone.criar({
          idUsuario: usuarioNoBanco.id,
          idTipoTelefone: ServicoClientes.mapearTipoTelefone(dados.telefone.tipo),
          ddd: dados.telefone.ddd,
          numero: dados.telefone.numero,
          principal: true,
        });
      }
    }

    return {
      uuid: usuarioAtualizado.uuid,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      role: usuarioAtualizado.role.descricao,
    };
  }

  /**
   * Inativa um cliente (soft delete) (RF0023).
   *
   * @param uuid Identificador único do cliente.
   */
  public async inativarCliente(uuid: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    if (!usuario.ativo) {
      throw new Error('Conta já está inativa.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: false });
  }

  public async registrarCliente(dados: ICriarClienteDto | ICriarClienteMinimoDto) {
    if (dados.senha !== dados.confirmacao_senha) {
      throw new Error('Senha e confirmação de senha não conferem.');
    }

    if (!verificarForcaSenha(dados.senha)) {
      throw new Error(
        'Senha fraca. É necessário pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e caractere especial.',
      );
    }

    const existentePorEmail = await this.repositorioUsuarios.buscarPorEmail(dados.email);
    if (existentePorEmail) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const existentePorCpf = await this.repositorioUsuarios.buscarPorCpf(dados.cpf);
    if (existentePorCpf) {
      throw new Error('Já existe um usuário cadastrado com este CPF.');
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12);

    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      senhaHash,
      role: PAPEL_CLIENTE,
    });

    // Criar perfil se fornecido
    if ('genero' in dados && dados.genero) {
      await this.repositorioPerfil.criar({
        idUsuario: usuario.id,
        genero: dados.genero,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : new Date(),
      });
    }

    // Criar telefone se fornecido
    if ('telefone' in dados && dados.telefone) {
      await this.repositorioTelefone.criar({
        idUsuario: usuario.id,
        idTipoTelefone: ServicoClientes.mapearTipoTelefone(dados.telefone.tipo),
        ddd: dados.telefone.ddd,
        numero: dados.telefone.numero,
        principal: true,
      });
    }

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role.descricao,
    };
  }
}

