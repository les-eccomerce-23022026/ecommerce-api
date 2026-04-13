import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { ICriarAdminDto, IListaAdminDto, IRespostaAdminCriadoDto } from '@/modules/admin/Iadmin.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';

/**
 * Serviço responsável por tarefas de administração do sistema.
 */
export class ServicoAdmin {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  constructor(repositorioUsuarios: IRepositorioUsuarios) {
    this.repositorioUsuarios = repositorioUsuarios;
  }

  private static validarSenhaCadastroAdministrador(dados: ICriarAdminDto): void {
    if (dados.senha !== dados.confirmacaoSenha) {
      throw new Error('Senha e confirmação de senha não conferem.');
    }
    if (!verificarForcaSenha(dados.senha)) {
      throw new Error(
        'Senha fraca. É necessário pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e caractere especial.',
      );
    }
  }

  /**
   * Lista todos os administradores cadastrados.
   */
  public async listarAdministradores(): Promise<IListaAdminDto[]> {
    const todos = await this.repositorioUsuarios.buscarClientesComFiltros({
      idPapel: PAPEL_ADMIN.id,
      offset: 0,
      limite: 1000,
    });
    return todos.map((u) => ({
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
    ServicoAdmin.validarSenhaCadastroAdministrador(dados);

    const existenteAdminPorEmail = await this.repositorioUsuarios.buscarPorEmailPapel(
      dados.email,
      PAPEL_ADMIN.id,
    );
    if (existenteAdminPorEmail) {
      throw new Error('Já existe um administrador cadastrado com este e-mail.');
    }

    const existenteAdminPorCpf = await this.repositorioUsuarios.buscarPorCpfPapel(
      dados.cpf,
      PAPEL_ADMIN.id,
    );
    if (existenteAdminPorCpf) {
      throw new Error('Já existe um administrador cadastrado com este CPF.');
    }

    // Se o usuário existe como cliente, ele será "promovido" (novo registro de admin)
    const existenteClientePorEmail = await this.repositorioUsuarios.buscarPorEmailPapel(
      dados.email,
      PAPEL_CLIENTE.id,
    );

    let senhaHash = await bcrypt.hash(dados.senha, 10);
    if (existenteClientePorEmail && dados.usarMesmaSenha) {
      senhaHash = existenteClientePorEmail.senhaHash;
    }

    if (existenteClientePorEmail) {
      await this.repositorioUsuarios.atualizarUsuario(existenteClientePorEmail.uuid, {
        idPapel: PAPEL_ADMIN.id,
        senhaHash,
      });
      const usuario = await this.repositorioUsuarios.buscarPorUuid(existenteClientePorEmail.uuid);
      if (!usuario) throw new Error('Erro ao carregar usuário promovido.');
      return {
        uuid: usuario.uuid,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        role: usuario.role.descricao,
      };
    }

    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      senhaHash,
      role: PAPEL_ADMIN,
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
