import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { PAPEL_CLIENTE, PAPEL_ADMIN } from '@/shared/types/papeis';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioUsuarios, IDadosCriarUsuario, IFiltrosConsultaClientes } from './IRepositorioUsuarios';

/** Tipo que representa uma linha bruta retornada pelo banco de dados */
type LinhaResultado = Record<string, unknown>;

/**
 * Repositório para usuários.
 * Implementa persistência real seguindo o novo padrão de trigramas.
 */
export class RepositorioUsuarios implements IRepositorioUsuarios {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  /**
   * Mapeia linha do banco para a entidade IUsuario.
   */
  private static mapearParaEntidade(row: LinhaResultado): IUsuario {
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      nome: row.nome as string,
      email: row.email as string,
      cpf: row.cpf as string,
      senhaHash: row.senhaHash as string,
      idPapel: Number(row.idPapel),
      role: {
        id: Number(row.idPapel),
        descricao: (row.papelDescricao as string) || (Number(row.idPapel) === PAPEL_ADMIN.id ? PAPEL_ADMIN.descricao : PAPEL_CLIENTE.descricao),
      },
      telefoneRapido: row.telefoneRapido as string,
      ativo: row.ativo as boolean,
      isAdminMestre: row.isAdminMestre as boolean,
      genero: row.genero as string,
      dataNascimento: row.dataNascimento ? new Date(row.dataNascimento as string) : undefined,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }

  private static get SELECT_BASE(): string {
    return `
      SELECT u.usu_id AS "id", u.usu_uuid AS "uuid", u.usu_nome AS "nome", 
             u.usu_email AS "email", u.usu_cpf AS "cpf", u.usu_senha_hash AS "senhaHash", 
             u.pap_id AS "idPapel", u.usu_telefone_rapido AS "telefoneRapido", 
             u.usu_ativo AS "ativo", u.usu_is_admin_mestre AS "isAdminMestre",
             u.usu_genero AS "genero", u.usu_data_nascimento AS "dataNascimento",
             u.usu_criado_em AS "criadoEm", u.usu_atualizado_em AS "atualizadoEm",
             p.pap_descricao AS "papelDescricao"
      FROM usuarios u
      JOIN papeis p ON u.pap_id = p.pap_id
    `;
  }

  public async criarUsuario(dados: IDadosCriarUsuario): Promise<IUsuario> {
    const { nome, email, cpf, senhaHash, role } = dados;
    const idPapel = role?.id ?? PAPEL_CLIENTE.id;

    const query = `
      INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_is_admin_mestre)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING usu_id AS "id", usu_uuid AS "uuid", usu_nome AS "nome", 
                usu_email AS "email", usu_cpf AS "cpf", usu_senha_hash AS "senhaHash", 
                pap_id AS "idPapel", usu_telefone_rapido AS "telefoneRapido", 
                usu_ativo AS "ativo", usu_is_admin_mestre AS "isAdminMestre",
                usu_criado_em AS "criadoEm", usu_atualizado_em AS "atualizadoEm"
    `;

    const values = [nome, email, cpf, senhaHash, idPapel, dados.isAdminMestre ?? false];
    const rows = await this.db.executar(query, values);

    // Como o INSERT RETURNING não traz o JOIN, buscamos o registro completo ou mapeamos manualmente
    return this.buscarPorUuid((rows[0] as LinhaResultado).uuid as string) as Promise<IUsuario>;
  }

  public async buscarPorEmail(email: string): Promise<IUsuario | undefined> {
    const query = `${RepositorioUsuarios.SELECT_BASE} WHERE u.usu_email = $1 LIMIT 1`;
    const rows = await this.db.executar(query, [email]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarPorEmailPapel(email: string, idPapel: number): Promise<IUsuario | undefined> {
    const query = `${RepositorioUsuarios.SELECT_BASE} WHERE u.usu_email = $1 AND u.pap_id = $2`;
    const rows = await this.db.executar(query, [email, idPapel]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarTodosPorEmail(email: string): Promise<IUsuario[]> {
    const query = `${RepositorioUsuarios.SELECT_BASE} WHERE u.usu_email = $1`;
    const rows = await this.db.executar(query, [email]);
    return rows.map((row) => RepositorioUsuarios.mapearParaEntidade(row as LinhaResultado));
  }

  public async buscarPorCpf(cpf: string): Promise<IUsuario | undefined> {
    const query = `${RepositorioUsuarios.SELECT_BASE} WHERE u.usu_cpf = $1 LIMIT 1`;
    const rows = await this.db.executar(query, [cpf]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarPorCpfPapel(cpf: string, idPapel: number): Promise<IUsuario | undefined> {
    const query = `${RepositorioUsuarios.SELECT_BASE} WHERE u.usu_cpf = $1 AND u.pap_id = $2`;
    const rows = await this.db.executar(query, [cpf, idPapel]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async buscarPorUuid(uuid: string): Promise<IUsuario | undefined> {
    const query = `${RepositorioUsuarios.SELECT_BASE} WHERE u.usu_uuid = $1`;
    const rows = await this.db.executar(query, [uuid]);

    if (rows.length === 0) return undefined;
    return RepositorioUsuarios.mapearParaEntidade(rows[0] as LinhaResultado);
  }

  public async atualizarUsuario(uuid: string, dados: Partial<IUsuario>): Promise<IUsuario | undefined> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let contador = 1;

    if (dados.nome) {
      campos.push(`usu_nome = $${contador}`);
      contador += 1;
      valores.push(dados.nome);
    }
    if (dados.email) {
      campos.push(`usu_email = $${contador}`);
      contador += 1;
      valores.push(dados.email);
    }
    if (dados.cpf) {
      campos.push(`usu_cpf = $${contador}`);
      contador += 1;
      valores.push(dados.cpf);
    }
    if (dados.telefoneRapido) {
      campos.push(`usu_telefone_rapido = $${contador}`);
      contador += 1;
      valores.push(dados.telefoneRapido);
    }
    if (dados.senhaHash) {
      campos.push(`usu_senha_hash = $${contador}`);
      contador += 1;
      valores.push(dados.senhaHash);
    }
    if (dados.idPapel) {
      campos.push(`pap_id = $${contador}`);
      contador += 1;
      valores.push(dados.idPapel);
    } else if (dados.role) {
      campos.push(`pap_id = $${contador}`);
      contador += 1;
      valores.push(dados.role.id);
    }
    if (dados.ativo !== undefined) {
      campos.push(`usu_ativo = $${contador}`);
      contador += 1;
      valores.push(dados.ativo);
    }
    if (dados.isAdminMestre !== undefined) {
      campos.push(`usu_is_admin_mestre = $${contador}`);
      contador += 1;
      valores.push(dados.isAdminMestre);
    }
    if (dados.genero) {
      campos.push(`usu_genero = $${contador}`);
      contador += 1;
      valores.push(dados.genero);
    }
    if (dados.dataNascimento) {
      campos.push(`usu_data_nascimento = $${contador}`);
      contador += 1;
      valores.push(dados.dataNascimento);
    }

    if (campos.length === 0) return this.buscarPorUuid(uuid);

    valores.push(uuid);
    const query = `
      UPDATE usuarios 
      SET ${campos.join(', ')} 
      WHERE usu_uuid = $${contador}
    `;

    await this.db.executar(query, valores);
    return this.buscarPorUuid(uuid);
  }

  public async deletarPorEmail(email: string): Promise<void> {
    const query = 'DELETE FROM usuarios WHERE usu_email = $1';
    await this.db.executar(query, [email]);
  }

  public async buscarClientesComFiltros(filtros: IFiltrosConsultaClientes): Promise<IUsuario[]> {
    const { nome, cpf, email, idPapel, offset, limite } = filtros;

    let query = `
      ${RepositorioUsuarios.SELECT_BASE}
      WHERE u.pap_id = $1
    `;

    const papelBusca = idPapel ?? PAPEL_CLIENTE.id;
    const valores: unknown[] = [papelBusca];
    let contador = 2;

    if (nome) {
      query += ` AND u.usu_nome ILIKE $${contador}`;
      valores.push(`%${nome}%`);
      contador += 1;
    }

    if (cpf) {
      query += ` AND u.usu_cpf ILIKE $${contador}`;
      valores.push(`%${cpf}%`);
      contador += 1;
    }

    if (email) {
      query += ` AND u.usu_email ILIKE $${contador}`;
      valores.push(`%${email}%`);
      contador += 1;
    }

    query += ` ORDER BY u.usu_criado_em DESC LIMIT $${contador} OFFSET $${contador + 1}`;
    valores.push(limite, offset);

    const rows = await this.db.executar(query, valores);
    return rows.map(row => RepositorioUsuarios.mapearParaEntidade(row as LinhaResultado));
  }

  public async contarClientesComFiltros(filtros: Omit<IFiltrosConsultaClientes, 'offset' | 'limite'>): Promise<number> {
    const { nome, cpf, email } = filtros;

    let query = 'SELECT COUNT(*) as total FROM usuarios WHERE pap_id = $1';
    const valores: unknown[] = [PAPEL_CLIENTE.id];
    let contador = 2;

    if (nome) {
      query += ` AND usu_nome ILIKE $${contador}`;
      valores.push(`%${nome}%`);
      contador += 1;
    }

    if (cpf) {
      query += ` AND usu_cpf ILIKE $${contador}`;
      valores.push(`%${cpf}%`);
      contador += 1;
    }

    if (email) {
      query += ` AND usu_email ILIKE $${contador}`;
      valores.push(`%${email}%`);
      contador += 1;
    }

    const rows = await this.db.executar(query, valores);
    return Number((rows[0] as { total?: number })?.total || 0);
  }

  public async buscarSenhaMestra(idPapel: number): Promise<string | undefined> {
    const chave = idPapel === 1 ? 'SENHA_MESTRA_CLIENTE_HASH' : 'SENHA_MESTRA_ADMIN_HASH';
    const query = 'SELECT cfg_valor FROM configuracoes_app WHERE cfg_chave = $1';

    try {
      const res = await this.db.executar(query, [chave]);
      return (res[0] as { cfg_valor: string })?.cfg_valor;
    } catch (erro) {
      const codigoErro = (erro as { code?: string }).code;

      // A tabela de configurações é opcional; se ela não existir, seguimos sem senha mestra.
      if (codigoErro === '42P01') {
        return undefined;
      }

      throw erro;
    }
  }
}
