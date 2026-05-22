import { IUsuario } from '@/modules/usuarios/IUsuario.entity';
import { IRepositorioUsuarios, IDadosCriarUsuario, IFiltrosConsultaClientes } from './IRepositorioUsuarios';
import { UsuarioMapper, LinhaResultadoUsuario } from './usuario.mapper';
import { USUARIO_QUERIES } from './usuario.queries';
import { montarClausulasAtualizacaoUsuario } from '@/modules/usuarios/usuario-repository-atualizacao.util';
import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { Logger } from '@/shared/utils/Logger.util';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';
import { obterTipoBancoAtual, obterTransacaoAtual } from '@/shared/infrastructure/database/ContextoBanco';
import { limparDocumento } from '@/shared/validators/validadorDocumento';

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
   * Obtém o loj_id do contexto de requisição.
   * Se não houver contexto, retorna undefined (compatibilidade com código legado).
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  public async criarUsuario(dados: IDadosCriarUsuario): Promise<IUsuario> {
    const { nome, email, cpf, cnpj, tipoPessoa, senhaHash, role } = dados;
    const idPapel = role?.id ?? PAPEL_CLIENTE.id;
    const lojId = dados.lojId ?? this.obterLojId() ?? 1;

    // Normalizar CPF e CNPJ para garantir consistência
    const cpfNormalizado = cpf ? limparDocumento(cpf) : null;
    const cnpjNormalizado = cnpj ? limparDocumento(cnpj) : null;

    const values = [nome, email, cpfNormalizado, cnpjNormalizado, tipoPessoa || 'PF', senhaHash, idPapel, lojId];
    const rows = await this.db.executar(USUARIO_QUERIES.INSERT, values);
    
    const usuarioCriadoRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioCriadoRow.id);

    // Também associa o papel na tabela muitos-para-muitos
    await this.associarPapelUsuario(usuarioId, idPapel);

    return this.buscarPorUuid(usuarioCriadoRow.uuid as string) as Promise<IUsuario>;
  }

  public async buscarPorEmail(email: string): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_email = $1 LIMIT 1`;
    const rows = await this.db.executar(query, [email]);

    if (rows.length === 0) return undefined;
    
    // Buscar papéis do usuário
    const usuarioRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioRow.id) as number;
    const papeisRows = await this.db.executar(
      USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, 
      [usuarioId]
    );
    
    return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
  }

  public async buscarPorEmailPapel(email: string, idPapel: number): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_email = $1 AND u.pap_id = $2`;
    const rows = await this.db.executar(query, [email, idPapel]);

    if (rows.length === 0) return undefined;
    
    const usuarioRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioRow.id) as number;
    const papeisRows = await this.db.executar(USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, [usuarioId]);
    
    return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
  }

  public async buscarTodosPorEmail(email: string): Promise<IUsuario[]> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_email = $1`;
    const rows = await this.db.executar(query, [email]);
    
    // Buscar papéis para cada usuário
    const usuariosComPapeis = await Promise.all(
      rows.map(async (row) => {
        const usuarioRow = row as LinhaResultadoUsuario;
        const usuarioId = Number(usuarioRow.id) as number;
        
        const papeisRows = await this.db.executar(
          USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, 
          [usuarioId],
          { searchPath: 'livraria_comercial, livraria_financeiro, livraria_gestao, livraria_logistica, livraria_ref, public' }
        );
        
        return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
      })
    );
    
    return usuariosComPapeis;
  }

  public async buscarPorCpf(cpf: string): Promise<IUsuario | undefined> {
    const cpfNormalizado = limparDocumento(cpf);
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_cpf = $1 LIMIT 1`;
    const rows = await this.db.executar(query, [cpfNormalizado]);

    if (rows.length === 0) return undefined;
    
    const usuarioRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioRow.id) as number;
    const papeisRows = await this.db.executar(USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, [usuarioId]);
    
    return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
  }

  public async buscarPorCpfPapel(cpf: string, idPapel: number): Promise<IUsuario | undefined> {
    const cpfNormalizado = limparDocumento(cpf);
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_cpf = $1 AND u.pap_id = $2`;
    const rows = await this.db.executar(query, [cpfNormalizado, idPapel]);

    if (rows.length === 0) return undefined;
    
    const usuarioRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioRow.id) as number;
    const papeisRows = await this.db.executar(USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, [usuarioId]);
    
    return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
  }

  public async buscarPorUuid(uuid: string): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_uuid = $1`;
    const rows = await this.db.executar(query, [uuid]);

    if (rows.length === 0) return undefined;
    
    // Buscar papéis do usuário
    const usuarioRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioRow.id) as number;
    const papeisRows = await this.db.executar(USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, [usuarioId]);
    
    return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
  }

  public async buscarPorId(id: number): Promise<IUsuario | undefined> {
    const query = `${USUARIO_QUERIES.SELECT_BASE} WHERE u.usu_id = $1`;
    const rows = await this.db.executar(query, [id]);

    if (rows.length === 0) return undefined;
    
    // Buscar papéis do usuário
    const usuarioRow = rows[0] as LinhaResultadoUsuario;
    const usuarioId = Number(usuarioRow.id) as number;
    const papeisRows = await this.db.executar(USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, [usuarioId]);
    
    return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
  }

  public async atualizarUsuario(uuid: string, dados: Partial<IUsuario>): Promise<IUsuario | undefined> {
    const { campos, valores } = montarClausulasAtualizacaoUsuario(dados);
    if (campos.length === 0) return this.buscarPorUuid(uuid);

    valores.push(uuid);
    const idxUuid = valores.length;
    const query = `
      UPDATE usuarios 
      SET ${campos.join(', ')} 
      WHERE usu_uuid = $${idxUuid}
    `;

    await this.db.executar(query, valores);
    return this.buscarPorUuid(uuid);
  }

  public async deletarPorCpf(cpf: string): Promise<void> {
    await this.db.executar(USUARIO_QUERIES.DELETE_BY_CPF, [cpf]);
  }

  public async deletarPorEmail(email: string): Promise<void> {
    const existente = await this.buscarPorEmail(email);
    if (!existente) {
      return;
    }
    if (existente.cpf) {
      await this.limparDadosUsuarioPorCpf(existente.cpf);
      return;
    }
    await this.db.executar('DELETE FROM livraria_gestao.usuario_papeis WHERE usu_id = $1', [existente.id]);
    await this.db.executar('DELETE FROM livraria_gestao.admin_lojas WHERE usu_id = $1', [existente.id]);
    await this.db.executar(USUARIO_QUERIES.DELETE_BY_EMAIL, [email]);
  }

  public async limparDadosUsuarioPorCpf(cpf: string): Promise<void> {
    const tipoBanco = obterTipoBancoAtual();
    if (tipoBanco !== 'teste') {
      throw new Error(`OPERACAO BLOQUEADA: Tentativa de limpeza de dados por CPF em banco de ${tipoBanco}. Esta operacao so eh permitida em ambiente de teste.`);
    }

    const cpfNormalizado = limparDocumento(cpf);
    const usuRes = await this.db.executar<{ usu_id: number }>(USUARIO_QUERIES.SELECT_ID_BY_CPF, [cpfNormalizado]);
    if (usuRes.length === 0) return;

    const usuId = usuRes[0].usu_id;
    const { DELETE_CASCADE } = USUARIO_QUERIES;

    await this.db.executar(DELETE_CASCADE.ITENS_VENDA, [usuId]);
    await this.db.executar(DELETE_CASCADE.VENDAS, [usuId]);
    await this.db.executar(DELETE_CASCADE.CARTOES, [usuId]);
    await this.db.executar(DELETE_CASCADE.TELEFONES, [usuId]);
    await this.db.executar(DELETE_CASCADE.ENDERECOS, [usuId]);
    await this.db.executar(DELETE_CASCADE.CLIENTES, [usuId]);
    await this.db.executar('DELETE FROM livraria_gestao.usuario_papeis WHERE usu_id = $1', [usuId]);
    await this.db.executar('DELETE FROM livraria_gestao.admin_lojas WHERE usu_id = $1', [usuId]);
    await this.db.executar(DELETE_CASCADE.USUARIOS, [usuId]);
  }

  public async buscarClientesComFiltros(filtros: IFiltrosConsultaClientes): Promise<IUsuario[]> {
    const { nome, cpf, email, idPapel, offset, limite } = filtros;
    const papelBusca = idPapel ?? PAPEL_CLIENTE.id;
    const loj_id = this.obterLojId();
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

    // Se multi-tenancy estiver habilitado, filtrar por loj_id via tabela clientes
    if (loj_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM livraria_gestao.clientes c 
        WHERE c.usu_id = u.usu_id AND c.loj_id = $${contador}
      )`;
      contador += 1;
      valores.push(loj_id);
    }

    query += ` ORDER BY u.usu_criado_em DESC LIMIT $${contador} OFFSET $${contador + 1}`;
    valores.push(limite, offset);

    const rows = await this.db.executar(query, valores);
    
    // Buscar papéis para cada usuário
    const usuariosComPapeis = await Promise.all(
      rows.map(async (row) => {
        const usuarioRow = row as LinhaResultadoUsuario;
        const usuarioId = Number(usuarioRow.id) as number;
        
        const papeisRows = await this.db.executar(
          USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, 
          [usuarioId]
        );
        
        return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
      })
    );
    
    return usuariosComPapeis;
  }

  public async contarClientesComFiltros(filtros: Omit<IFiltrosConsultaClientes, 'offset' | 'limite'>): Promise<number> {
    const { nome, cpf, email } = filtros;
    const loj_id = this.obterLojId();
    const valores: DbParametro[] = [PAPEL_CLIENTE.id];
    let query = 'SELECT COUNT(*) as total FROM usuarios u WHERE pap_id = $1';
    let contador = 2;

    const filtrosMapeados = [ { val: nome, sql: 'u.usu_nome' }, { val: cpf, sql: 'u.usu_cpf' }, { val: email, sql: 'u.usu_email' } ];
    filtrosMapeados.forEach((f) => {
      if (f.val) {
        query += ` AND ${f.sql} ILIKE $${contador}`;
        contador += 1;
        valores.push(`%${f.val}%`);
      }
    });

    // Se multi-tenancy estiver habilitado, filtrar por loj_id via tabela clientes
    if (loj_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM livraria_gestao.clientes c 
        WHERE c.usu_id = u.usu_id AND c.loj_id = $${contador}
      )`;
      contador += 1;
      valores.push(loj_id);
    }

    const rows = await this.db.executar(query, valores);
    return Number((rows[0] as { total?: number })?.total || 0);
  }

  public async buscarSenhaMestra(idPapel: number): Promise<string | undefined> {
    const chave = idPapel === 1 ? 'SENHA_MESTRA_CLIENTE_HASH' : 'SENHA_MESTRA_ADMIN_HASH';
    const transacaoAtiva = obterTransacaoAtual();
    const savepoint = 'sp_senha_mestra';

    if (transacaoAtiva) {
      await this.db.executar(`SAVEPOINT ${savepoint}`);
    }

    try {
      const res = await this.db.executar(USUARIO_QUERIES.SELECT_CONFIG, [chave]);
      if (transacaoAtiva) {
        await this.db.executar(`RELEASE SAVEPOINT ${savepoint}`);
      }
      return (res[0] as { cfg_valor: string })?.cfg_valor;
    } catch (erro) {
      if (transacaoAtiva) {
        await this.db.executar(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      }
      if ((erro as { code?: string }).code === '42P01') return undefined;
      throw erro;
    }
  }

  public async buscarLojasDoUsuario(usuarioId: number): Promise<number[]> {
    const queryCliente = `
      SELECT DISTINCT loj_id
      FROM livraria_gestao.clientes
      WHERE usu_id = $1 AND loj_id IS NOT NULL
    `;
    const queryAdmin = `
      SELECT DISTINCT loj_id
      FROM livraria_gestao.admin_lojas
      WHERE usu_id = $1 AND adl_ativo = TRUE
    `;

    const executarConsultaOpcional = async (sql: string, rotulo: string): Promise<number[]> => {
      const transacaoAtiva = obterTransacaoAtual();
      const savepoint = `sp_lojas_${rotulo}`;

      if (transacaoAtiva) {
        await this.db.executar(`SAVEPOINT ${savepoint}`);
      }

      try {
        const rows = await this.db.executar<{ loj_id: number }>(sql, [usuarioId]);
        if (transacaoAtiva) {
          await this.db.executar(`RELEASE SAVEPOINT ${savepoint}`);
        }
        return rows.map((row) => row.loj_id);
      } catch (erro) {
        if (transacaoAtiva) {
          await this.db.executar(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        }
        if ((erro as { code?: string }).code === '42P01') {
          return [];
        }
        throw erro;
      }
    };

    const lojasCliente = await executarConsultaOpcional(queryCliente, 'cliente');
    const lojasAdmin = await executarConsultaOpcional(queryAdmin, 'admin');
    return [...new Set([...lojasCliente, ...lojasAdmin])];
  }

  public async associarPapelUsuario(usuarioId: number, papelId: number): Promise<void> {
    // Verificar se o papel já está associado
    const jaAssociado = await this.verificarPapelUsuario(usuarioId, papelId);
    if (jaAssociado) {
      Logger.warn('[associarPapelUsuario] Papel já associado ao usuário', { usuarioId, papelId });
      return;
    }

    await this.db.executar(USUARIO_QUERIES.INSERT_USUARIO_PAPEL, [usuarioId, papelId]);
    Logger.info('[associarPapelUsuario] Papel associado ao usuário', { usuarioId, papelId });
  }

  public async removerPapelUsuario(usuarioId: number, papelId: number): Promise<void> {
    await this.db.executar(USUARIO_QUERIES.REMOVER_USUARIO_PAPEL, [usuarioId, papelId]);
    Logger.info('[removerPapelUsuario] Papel removido do usuário', { usuarioId, papelId });
  }

  public async removerTodosPapeisUsuario(usuarioId: number): Promise<void> {
    const query = `UPDATE livraria_gestao.usuario_papeis SET usp_ativo = FALSE WHERE usu_id = $1`;
    await this.db.executar(query, [usuarioId]);
    Logger.info('[removerTodosPapeisUsuario] Todos os papéis removidos do usuário', { usuarioId });
  }

  public async verificarPapelUsuario(usuarioId: number, papelId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM livraria_gestao.usuario_papeis
      WHERE usu_id = $1 AND pap_id = $2 AND usp_ativo = TRUE
    `;
    const rows = await this.db.executar<{ count: string }>(query, [usuarioId, papelId]);
    return parseInt(rows[0].count) > 0;
  }

  public async buscarUsuariosPorPapel(idPapel: number): Promise<IUsuario[]> {
    const rows = await this.db.executar(USUARIO_QUERIES.SELECT_USUARIOS_POR_PAPEL, [idPapel]);
    
    // Buscar papéis para cada usuário
    const usuariosComPapeis = await Promise.all(
      rows.map(async (row) => {
        const usuarioRow = row as LinhaResultadoUsuario;
        const usuarioId = Number(usuarioRow.id) as number;
        
        const papeisRows = await this.db.executar(
          USUARIO_QUERIES.SELECT_PAPEIS_USUARIO, 
          [usuarioId],
          { searchPath: 'livraria_comercial, livraria_financeiro, livraria_gestao, livraria_logistica, livraria_ref, public' }
        );
        
        return UsuarioMapper.mapearParaEntidade(usuarioRow, papeisRows as LinhaResultadoUsuario[]);
      })
    );
    
    return usuariosComPapeis;
  }
}
