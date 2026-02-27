import bcrypt from 'bcryptjs';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import {
  ICriarClienteDto,
  ICriarClienteMinimoDto,
  IAtualizarClienteDto,
  IAlterarSenhaDto,
} from '@/modules/clientes/Iclientes.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 */
export class ServicoClientes {
  private readonly repositorioUsuarios = RepositorioUsuarios.obterInstancia();

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

    const novaSenhaHash = await bcrypt.hash(dados.nova_senha, 10);
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

    if (dados.email && dados.email !== usuarioNoBanco.email) {
      const emailEmUso = await this.repositorioUsuarios.buscarPorEmail(dados.email);
      if (emailEmUso) {
        throw new Error('Email já em uso por outro usuário.');
      }
    }

    const usuarioAtualizado = await this.repositorioUsuarios.atualizarUsuario(uuid, {
      nome: dados.nome ?? usuarioNoBanco.nome,
      email: dados.email ?? usuarioNoBanco.email,
    });

    if (!usuarioAtualizado) {
      throw new Error('Erro ao atualizar usuário.');
    }

    return {
      uuid: usuarioAtualizado.uuid,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      cpf: usuarioAtualizado.cpf,
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

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      senhaHash,
      role: PAPEL_CLIENTE,
    });

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      role: usuario.role.descricao,
    };
  }
}

