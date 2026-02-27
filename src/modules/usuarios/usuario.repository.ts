import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { PAPEL_CLIENTE, PAPEL_ADMIN } from '@/shared/types/papeis';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioUsuarios, IDadosCriarUsuario } from './IRepositorioUsuarios';

/** Tipo que representa uma linha bruta retornada pelo banco de dados */
type LinhaResultado = Record<string, unknown>;

/**
 * Repositório para usuários.
 * Implementa persistência real seguindo a modelagem ecm_usuario.
 * Recebe a conexão com o banco via construtor (Inversão de Dependência).
 */
export class RepositorioUsuarios implements IRepositorioUsuarios {
  private db: IConexaoBanco;

  /**
   * Construtor injetado com a abstração do banco de dados.
   * Não sabe se é Postgres, MySQL ou outro.
   */
  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  /**
   * Mapeia linha do banco para a entidade IUsuario.
   * Método estático pois não depende de estado da instância.
   */
  private static mapearParaEntidade(row: LinhaResultado): IUsuario {
    return {
      id: Number(row.id_usuario),
      uuid: row.uuid_usuario as string,
      nome: row.nom_usuario as string,
      email: row.dsc_email as string,
      cpf: row.dsc_cpf as string,
      senhaHash: row.dsc_senha_hash as string,
      role: {
        id: Number(row.id_papel),
        descricao: Number(row.id_papel) === PAPEL_ADMIN.id ? PAPEL_ADMIN.descricao : PAPEL_CLIENTE.descricao,
      },
      ativo: row.flg_ativo as boolean,
    };
  }

  public async criarUsuario(dados: IDadosCriarUsuario): Promise<IUsuario> {
    const { nome, email, cpf, senhaHash, role } = dados;
    const idPapel = role?.id ?? PAPEL_CLIENTE.id;

    const query = `
      INSERT INTO ecm_usuario (nom_usuario, dsc_email, dsc_cpf, dsc_senha_hash, id_papel)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [nome, email, cpf, senhaHash, idPapel];
    const rows = await this.db.executar(query, values);

    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarPorEmail(email: string): Promise<IUsuario | undefined> {
    const query = 'SELECT * FROM ecm_usuario WHERE dsc_email = $1';
    const rows = await this.db.executar(query, [email]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarPorCpf(cpf: string): Promise<IUsuario | undefined> {
    const query = 'SELECT * FROM ecm_usuario WHERE dsc_cpf = $1';
    const rows = await this.db.executar(query, [cpf]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarPorUuid(uuid: string): Promise<IUsuario | undefined> {
    const query = 'SELECT * FROM ecm_usuario WHERE uuid_usuario = $1';
    const rows = await this.db.executar(query, [uuid]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async atualizarUsuario(uuid: string, dados: Partial<IUsuario>): Promise<IUsuario | undefined> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let contador = 1;

    if (dados.nome) {
      campos.push(`nom_usuario = $${contador}`);
      contador += 1;
      valores.push(dados.nome);
    }
    if (dados.email) {
      campos.push(`dsc_email = $${contador}`);
      contador += 1;
      valores.push(dados.email);
    }
    if (dados.cpf) {
      campos.push(`dsc_cpf = $${contador}`);
      contador += 1;
      valores.push(dados.cpf);
    }
    if (dados.senhaHash) {
      campos.push(`dsc_senha_hash = $${contador}`);
      contador += 1;
      valores.push(dados.senhaHash);
    }
    if (dados.role) {
      campos.push(`id_papel = $${contador}`);
      contador += 1;
      valores.push(dados.role.id);
    }
    if (dados.ativo !== undefined) {
      campos.push(`flg_ativo = $${contador}`);
      contador += 1;
      valores.push(dados.ativo);
    }

    if (campos.length === 0) return this.buscarPorUuid(uuid);

    valores.push(uuid);
    const query = `
      UPDATE ecm_usuario 
      SET ${campos.join(', ')} 
      WHERE uuid_usuario = $${contador}
      RETURNING *
    `;

    const rows = await this.db.executar(query, valores);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async deletarPorEmail(email: string): Promise<void> {
    const query = 'DELETE FROM ecm_usuario WHERE dsc_email = $1';
    await this.db.executar(query, [email]);
  }
}

