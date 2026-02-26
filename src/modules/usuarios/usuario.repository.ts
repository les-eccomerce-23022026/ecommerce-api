import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { Usuario, PapelUsuario } from '@/modules/usuarios/usuario.entity';

/**
 * Repositório em memória para prototipação.
 * Em fases futuras, este repositório deve ser substituído por uma implementação com banco de dados.
 */
export class RepositorioUsuarios {
  private static instancia: RepositorioUsuarios;

  private usuarios: Usuario[] = [];

  private constructor() {
    void this.criarAdministradorInicial();
  }

  public static obterInstancia(): RepositorioUsuarios {
    if (!RepositorioUsuarios.instancia) {
      RepositorioUsuarios.instancia = new RepositorioUsuarios();
    }
    return RepositorioUsuarios.instancia;
  }

  private async criarAdministradorInicial(): Promise<void> {
    const existeAdmin = this.usuarios.some((usuario) => usuario.role === 'admin');
    if (existeAdmin) {
      return;
    }

    const senhaPadrao = 'Admin@123';
    const senhaHash = await bcrypt.hash(senhaPadrao, 10);

    const administrador: Usuario = {
      uuid: randomUUID(),
      nome: 'Administrador Mestre',
      email: 'admin@livraria.com.br',
      cpf: '000.000.000-00',
      senhaHash,
      role: 'admin',
      ativo: true,
    };

    this.usuarios.push(administrador);
  }

  public async criarUsuario(
    dados: Omit<Usuario, 'uuid' | 'ativo'> & { role?: PapelUsuario },
  ): Promise<Usuario> {
    const usuario: Usuario = {
      uuid: randomUUID(),
      ativo: true,
      ...dados,
      role: dados.role ?? 'cliente',
    };

    this.usuarios.push(usuario);
    return usuario;
  }

  public async buscarPorEmail(email: string): Promise<Usuario | undefined> {
    return this.usuarios.find((usuario) => usuario.email === email);
  }

  public async buscarPorCpf(cpf: string): Promise<Usuario | undefined> {
    return this.usuarios.find((usuario) => usuario.cpf === cpf);
  }
}

