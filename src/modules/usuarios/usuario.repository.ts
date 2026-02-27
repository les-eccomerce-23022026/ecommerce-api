import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { IPapelUsuario } from '@/shared/types/Ipapel-usuario';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';

/**
 * Repositório em memória para prototipação.
 * Em fases futuras, este repositório deve ser substituído por uma implementação com banco de dados.
 */
export class RepositorioUsuarios {
  private static instancia: RepositorioUsuarios;

  private usuarios: IUsuario[] = [];
  private idCounter: number = 1;

  private constructor() {
    this.criarAdministradorInicial().catch(() => undefined);
  }

  public static obterInstancia(): RepositorioUsuarios {
    if (!RepositorioUsuarios.instancia) {
      RepositorioUsuarios.instancia = new RepositorioUsuarios();
    }
    return RepositorioUsuarios.instancia;
  }

  private async criarAdministradorInicial(): Promise<void> {
    const existeAdmin = this.usuarios.some((usuario) => usuario.role.descricao === 'admin');
    if (existeAdmin) {
      return;
    }

    const senhaPadrao = 'Admin@123';
    const senhaHash = await bcrypt.hash(senhaPadrao, 10);

    const administrador: IUsuario = {
      id: this.idCounter++,
      uuid: randomUUID(),
      nome: 'Administrador Mestre',
      email: 'admin@livraria.com.br',
      cpf: '000.000.000-00',
      senhaHash,
      role: PAPEL_ADMIN,
      ativo: true,
    };

    this.usuarios.push(administrador);
  }

  public async criarUsuario(
    dados: Omit<IUsuario, 'uuid' | 'ativo' | 'id'> & { role?: IPapelUsuario },
  ): Promise<IUsuario> {
    const usuario: IUsuario = {
      id: this.idCounter++,
      uuid: randomUUID(),
      ativo: true,
      ...dados,
      role: dados.role ?? PAPEL_CLIENTE,
    };

    this.usuarios.push(usuario);
    return usuario;
  }

  public async buscarPorEmail(email: string): Promise<IUsuario | undefined> {
    return this.usuarios.find((usuario) => usuario.email === email);
  }

  public async buscarPorCpf(cpf: string): Promise<IUsuario | undefined> {
    return this.usuarios.find((usuario) => usuario.cpf === cpf);
  }

  public async buscarPorUuid(uuid: string): Promise<IUsuario | undefined> {
    return this.usuarios.find((usuario) => usuario.uuid === uuid);
  }

  public async atualizarUsuario(uuid: string, dados: Partial<IUsuario>): Promise<IUsuario | undefined> {
    const indice = this.usuarios.findIndex((u) => u.uuid === uuid);
    if (indice === -1) {
      return undefined;
    }

    this.usuarios[indice] = {
      ...this.usuarios[indice],
      ...dados,
      uuid, // garante que o uuid não muda
    };

    return this.usuarios[indice];
  }
}

