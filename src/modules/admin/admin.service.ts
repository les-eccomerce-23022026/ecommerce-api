import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { ICriarAdminDto, IListaAdminDto, IRespostaAdminCriadoDto } from '@/modules/admin/Iadmin.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { PAPEL_ADMIN } from '@/shared/types/papeis';

/**
 * Serviço responsável por tarefas de administração do sistema.
 */
export class ServicoAdmin {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  constructor(repositorioUsuarios: IRepositorioUsuarios) {
    this.repositorioUsuarios = repositorioUsuarios;
  }

  /**
   * Lista todos os administradores cadastrados.
   */
  public async listarAdministradores(): Promise<IListaAdminDto[]> {
    // Usamos um filtro de busca que pegue todos, mas garantimos que filtramos por papel admin depois
    // ou usamos um método específico se existir. Como o IRepositorioUsuarios é genérico,
    // vamos buscar filtrando pelo papel se possível ou buscar todos e filtrar na memória se a base for pequena.
    // O ideal é ter um método no repositório para buscar por papel.
    // Por enquanto, vamos assumir que buscarClientesComFiltros pode ser usado ou implementamos algo.

    const todos = await this.repositorioUsuarios.buscarClientesComFiltros({ offset: 0, limite: 1000 });
    return todos
      .filter((u) => u.role.id === PAPEL_ADMIN.id)
      .map((u) => ({
        uuid: u.uuid,
        nome: u.nome,
        email: u.email,
        ativo: u.ativo,
      }));
  }

  /**
   * Inativa um administrador.
   *
   * @param uuid UUID do administrador a ser inativado.
   */
  public async inativarAdministrador(uuid: string): Promise<void> {
    const admin = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!admin || admin.role.id !== PAPEL_ADMIN.id) {
      throw new Error('Administrador não encontrado.');
    }

    if (!admin.ativo) {
      throw new Error('Administrador já está inativo.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: false });
  }

  /**
   * Ativa um administrador.
   *
   * @param uuid UUID do administrador a ser ativado.
   */
  public async ativarAdministrador(uuid: string): Promise<void> {
    const admin = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!admin || admin.role.id !== PAPEL_ADMIN.id) {
      throw new Error('Administrador não encontrado.');
    }

    if (admin.ativo) {
      throw new Error('Administrador já está ativo.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: true });
  }

  /**
   * Registra um novo administrador. Requer validação de permissões prévia.
   *
   * @param dados Dados para criação do administrador.
   */
  public async registrarNovoAdministrador(dados: ICriarAdminDto): Promise<IRespostaAdminCriadoDto> {
    if (dados.senha !== dados.confirmacaoSenha) {
      throw new Error('Senha e confirmação de senha não conferem.');
    }

    if (!verificarForcaSenha(dados.senha)) {
      throw new Error(
        'Senha fraca. É necessário pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e caractere especial.',
      );
    }

    const existentePorEmail = await this.repositorioUsuarios.buscarPorEmail(dados.email);
    const existentePorCpf = await this.repositorioUsuarios.buscarPorCpf(dados.cpf);

    if (existentePorEmail && existentePorEmail.cpf !== dados.cpf) {
      throw new Error('O e-mail informado pertence a um usuário com CPF diferente.');
    }

    if (existentePorCpf && existentePorCpf.email !== dados.email) {
      throw new Error('O CPF informado pertence a um usuário com e-mail diferente.');
    }

    if (existentePorEmail && existentePorCpf && existentePorEmail.uuid !== existentePorCpf.uuid) {
      throw new Error('O e-mail e o CPF informados pertencem a usuários diferentes.');
    }

    const usuarioExistente = existentePorEmail ?? existentePorCpf;

    if (usuarioExistente) {
      if (usuarioExistente.role.id === PAPEL_ADMIN.id) {
        throw new Error('O usuário informado já possui papel de administrador.');
      }

      const senhaAtualIgual = await bcrypt.compare(dados.senha, usuarioExistente.senhaHash);
      if (senhaAtualIgual) {
        throw new Error('A senha administrativa deve ser diferente da senha atual do usuário.');
      }

      const senhaHashAtualizada = await bcrypt.hash(dados.senha, 10);
      const usuarioPromovido = await this.repositorioUsuarios.atualizarUsuario(usuarioExistente.uuid, {
        nome: dados.nome,
        senhaHash: senhaHashAtualizada,
        role: PAPEL_ADMIN,
        ativo: true,
      });

      if (!usuarioPromovido) {
        throw new Error('Não foi possível promover o usuário para administrador.');
      }

      return {
        uuid: usuarioPromovido.uuid,
        nome: usuarioPromovido.nome,
        email: usuarioPromovido.email,
        cpf: usuarioPromovido.cpf,
        role: usuarioPromovido.role.descricao,
      };
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      senhaHash,
      role: PAPEL_ADMIN, // Força papel de administrador
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
