import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';
import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { obterTipoBancoAtual } from '@/shared/infrastructure/database/ContextoBanco';
import { IRepositorioUsuarios, IDadosCriarUsuario, IFiltrosConsultaClientes } from './IRepositorioUsuarios';
import { UsuarioMapper, LinhaResultadoUsuario } from './usuario.mapper';
import { USUARIO_QUERIES } from './usuario.queries';

/**
 * Repositório para usuários.
 * Implementa persistência real seguindo o novo padrão de trigramas.
 */
export class RepositorioUsuarios implements IRepositorioUsuarios {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async criarUsuario(dados: IDadosCriarUsuario): Promise<IUsuario> {
    const { nome, email, cpf, senhaHash, role } = dados;
    const idPapel = role?.id ?? PAPEL_CLIENTE.id;

    const values = [nome, email, cpf, senhaHash, idPapel, dados.isAdminMestre ?? false];
    const rows = await this.db.executar(USUARIO_QUERIES.INSERT, values);

    return this.buscarPorUuid((rows[0] as LinhaResultadoUsuario).uuid as string) as Promise<IUsuario>;
  }

  public async buscarPorEmail(email: string): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_email = $1 LIMIT 1`;
    const rows = await this.db.executar(query, [email]);

    if (rows.length === 0) return undefined;
    return UsuarioMapper.mapearParaEntidade(rows[0] as LinhaResultadoUsuario);
  }

  public async buscarPorEmailPapel(email: string, idPapel: number): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_email = $1 AND u.pap_id = $2`;
    const rows = await this.db.executar(query, [email, idPapel]);

    if (rows.length === 0) return undefined;
    return UsuarioMapper.mapearParaEntidade(rows[0] as LinhaResultadoUsuario);
  }

  public async buscarTodosPorEmail(email: string): Promise<IUsuario[]> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_email = $1`;
    const rows = await this.db.executar(query, [email]);
    return rows.map((row) => UsuarioMapper.mapearParaEntidade(row as LinhaResultadoUsuario));
  }

  public async buscarPorCpf(cpf: string): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_cpf = $1 LIMIT 1`;
    const rows = await this.db.executar(query, [cpf]);

    if (rows.length === 0) return undefined;
    return UsuarioMapper.mapearParaEntidade(rows[0] as LinhaResultadoUsuario);
  }

  public async buscarPorCpfPapel(cpf: string, idPapel: number): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_cpf = $1 AND u.pap_id = $2`;
    const rows = await this.db.executar(query, [cpf, idPapel]);

    if (rows.length === 0) return undefined;
    return UsuarioMapper.mapearParaEntidade(rows[0] as LinhaResultadoUsuario);
  }

  public async buscarPorUuid(uuid: string): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_uuid = $1`;
    const rows = await this.db.executar(query, [uuid]);

    if (rows.length === 0) return undefined;
    return UsuarioMapper.mapearParaEntidade(rows[0] as LinhaResultadoUsuario);
  }

  public async atualizarUsuario(uuid: string, dados: Partial<IUsuario>): Promise<IUsuario | undefined> {
    const campos: string[] = [];
    const valores: DbParametro[] = [];
    let contador = 1;

    const mapeamento: Record<string, string> = {
      nome: 'usu_nome',
      email: 'usu_email',
      cpf: 'usu_cpf',
      telefoneRapido: 'usu_telefone_rapido',
      senhaHash: 'usu_senha_hash',
      idPapel: 'pap_id',
      ativo: 'usu_ativo',
      isAdminMestre: 'usu_is_admin_mestre',
      genero: 'usu_genero',
      dataNascimento: 'usu_data_nascimento',
    };

    Object.entries(mapeamento).forEach(([key, field]) => {
      const val = (dados as Record<string, unknown>)[key];
      if (val !== undefined) {
        campos.push(`${field} = $${contador}`);
        contador += 1;
        valores.push(val as DbParametro);
      } else if (key === 'idPapel' && dados.role?.id !== undefined) {
        campos.push(`${field} = $${contador}`);
        contador += 1;
        valores.push(dados.role.id as DbParametro);
      }
    });

    if (campos.length === 0) return this.buscarPorUuid(uuid);

    valores.push(uuid);
    const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE usu_uuid = $${contador}`;

    await this.db.executar(query, valores);
    return this.buscarPorUuid(uuid);
  }

  public async deletarPorCpf(cpf: string): Promise<void> {
    await this.db.executar(USUARIO_QUERIES.DELETE_BY_CPF, [cpf]);
  }

  public async deletarPorEmail(email: string): Promise<void> {
    await this.db.executar(USUARIO_QUERIES.DELETE_BY_EMAIL, [email]);
  }

  public async limparDadosUsuarioPorCpf(cpf: string): Promise<void> {
    const tipoBanco = obterTipoBancoAtual();
    if (tipoBanco !== 'teste') {
      throw new Error(`OPERACAO BLOQUEADA: Tentativa de limpeza de dados por CPF em banco de ${tipoBanco}. Esta operacao so eh permitida em ambiente de teste.`);
    }

    const usuRes = await this.db.executar<{ usu_id: number }>(USUARIO_QUERIES.SELECT_ID_BY_CPF, [cpf]);
    if (usuRes.length === 0) return;

    const usuId = usuRes[0].usu_id;
    const { DELETE_CASCADE } = USUARIO_QUERIES;

    await this.db.executar(DELETE_CASCADE.ITENS_VENDA, [usuId]);
    await this.db.executar(DELETE_CASCADE.VENDAS, [usuId]);
    await this.db.executar(DELETE_CASCADE.CARTOES, [usuId]);
    await this.db.executar(DELETE_CASCADE.TELEFONES, [usuId]);
    await this.db.executar(DELETE_CASCADE.ENDERECOS, [usuId]);
    await this.db.executar(DELETE_CASCADE.CLIENTES, [usuId]);
    await this.db.executar(DELETE_CASCADE.USUARIOS, [usuId]);
  }

  public async buscarClientesComFiltros(filtros: IFiltrosConsultaClientes): Promise<IUsuario[]> {
    const { nome, cpf, email, idPapel, offset, limite } = filtros;
    const papelBusca = idPapel ?? PAPEL_CLIENTE.id;
    const valores: DbParametro[] = [papelBusca];
    let query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.pap_id = $1`;
    let contador = 2;

    const filtrosMapeados = [ { val: nome, sql: 'u.usu_nome' }, { val: cpf, sql: 'u.usu_cpf' }, { val: email, sql: 'u.usu_email' } ];
    filtrosMapeados.forEach((f) => {
      if (f.val) {
        query += ` AND ${f.sql} ILIKE $${contador}`;
        contador += 1;
        valores.push(`%${f.val}%`);
      }
    });

    query += ` ORDER BY u.usu_criado_em DESC LIMIT $${contador} OFFSET $${contador + 1}`;
    valores.push(limite, offset);

    const rows = await this.db.executar(query, valores);
    return rows.map(row => UsuarioMapper.mapearParaEntidade(row as LinhaResultadoUsuario));
  }

  public async contarClientesComFiltros(filtros: Omit<IFiltrosConsultaClientes, 'offset' | 'limite'>): Promise<number> {
    const { nome, cpf, email } = filtros;
    const valores: DbParametro[] = [PAPEL_CLIENTE.id];
    let query = 'SELECT COUNT(*) as total FROM usuarios WHERE pap_id = $1';
    let contador = 2;

    const filtrosMapeados = [ { val: nome, sql: 'usu_nome' }, { val: cpf, sql: 'usu_cpf' }, { val: email, sql: 'usu_email' } ];
    filtrosMapeados.forEach((f) => {
      if (f.val) {
        query += ` AND ${f.sql} ILIKE $${contador}`;
        contador += 1;
        valores.push(`%${f.val}%`);
      }
    });

    const rows = await this.db.executar(query, valores);
    return Number((rows[0] as { total?: number })?.total || 0);
  }

  public async buscarSenhaMestra(idPapel: number): Promise<string | undefined> {
    const chave = idPapel === 1 ? 'SENHA_MESTRA_CLIENTE_HASH' : 'SENHA_MESTRA_ADMIN_HASH';
    try {
      const res = await this.db.executar(USUARIO_QUERIES.SELECT_CONFIG, [chave]);
      return (res[0] as { cfg_valor: string })?.cfg_valor;
    } catch (erro) {
      if ((erro as { code?: string }).code === '42P01') return undefined;
      throw erro;
    }
  }
}
