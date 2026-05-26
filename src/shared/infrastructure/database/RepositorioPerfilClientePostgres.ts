import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRowPerfilCliente } from '@/shared/types/db-rows.types';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

export class RepositorioPerfilClientePostgres implements IRepositorioPerfilCliente {
  /** Perfil do cliente vive em livraria_gestao (evita resolver livraria_comercial.clientes no search_path). */
  private static readonly TABELA_CLIENTES = 'livraria_gestao.clientes';

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

  private static mapearParaEntidade(row: IRowPerfilCliente): IPerfilCliente {
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      idUsuario: Number(row.idUsuario),
      genero: row.genero as string | undefined,
      dataNascimento: row.dataNascimento ? new Date(row.dataNascimento as string) : undefined,
      ranking: Number(row.ranking ?? 0),
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }

  public async criar(perfil: IPerfilCliente): Promise<void> {
    const loj_id = this.obterLojId() ?? 1;
    
    const query = `
      INSERT INTO ${RepositorioPerfilClientePostgres.TABELA_CLIENTES} (usu_id, cli_genero, cli_data_nascimento, loj_id)
      VALUES ($1, $2, $3, $4)
    `;
    const valores: any[] = [perfil.idUsuario, perfil.genero ?? null, perfil.dataNascimento ?? null, loj_id];

    await this.db.executar(query, valores);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IPerfilCliente | null> {
    const loj_id = this.obterLojId();
    
    let query = `
      SELECT cli_id AS "id", cli_uuid AS "uuid",
             usu_id AS "idUsuario", cli_genero AS "genero", cli_data_nascimento AS "dataNascimento",
             cli_ranking AS "ranking", cli_criado_em AS "criadoEm", cli_atualizado_em AS "atualizadoEm"
      FROM ${RepositorioPerfilClientePostgres.TABELA_CLIENTES}
      WHERE usu_id = $1
    `;
    const parametros: any[] = [idUsuario];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += ` AND loj_id = $2`;
      parametros.push(loj_id);
    }

    const rows = await this.db.executar(query, parametros);

    if (rows.length === 0) return null;
    return RepositorioPerfilClientePostgres.mapearParaEntidade(rows[0] as IRowPerfilCliente);
  }

  // eslint-disable-next-line class-methods-use-this
  public async atualizar(perfil: IPerfilCliente): Promise<void> {
    const loj_id = this.obterLojId();
    
    let query = `
      UPDATE ${RepositorioPerfilClientePostgres.TABELA_CLIENTES}
      SET cli_genero = $1, cli_data_nascimento = $2
      WHERE usu_id = $3
    `;
    const parametros: any[] = [perfil.genero ?? null, perfil.dataNascimento ?? null, perfil.idUsuario];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += ` AND loj_id = $4`;
      parametros.push(loj_id);
    }

    await this.db.executar(query, parametros);
  }

  public async deletar(idUsuario: number): Promise<void> {
    const loj_id = this.obterLojId();
    
    let query = `DELETE FROM ${RepositorioPerfilClientePostgres.TABELA_CLIENTES} WHERE usu_id = $1`;
    const parametros: any[] = [idUsuario];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += ` AND loj_id = $2`;
      parametros.push(loj_id);
    }

    await this.db.executar(query, parametros);
  }
}
