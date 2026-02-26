import bcrypt from 'bcryptjs';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import { CriarClienteDto, CriarClienteMinimoDto } from '@/modules/clientes/clientes.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 */
export class ServicoClientes {
  private readonly repositorioUsuarios = RepositorioUsuarios.obterInstancia();

  public async registrarCliente(dados: CriarClienteDto | CriarClienteMinimoDto) {
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
      role: 'cliente',
    });

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      role: usuario.role,
    };
  }
}

