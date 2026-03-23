import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export class RepositorioPerfilClientePostgres implements IRepositorioPerfilCliente {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  private static mapearParaEntidade(row: Record<string, unknown>): IPerfilCliente {
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
    const query = `
      INSERT INTO clientes (usu_id, cli_genero, cli_data_nascimento)
      VALUES ($1, $2, $3)
    `;
    await this.db.executar(query, [perfil.idUsuario, perfil.genero ?? null, perfil.dataNascimento ?? null]);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IPerfilCliente | null> {
    const query = `
      SELECT cli_id AS "id", cli_uuid AS "uuid", 
             usu_id AS "idUsuario", cli_genero AS "genero", cli_data_nascimento AS "dataNascimento", 
             cli_ranking AS "ranking", cli_criado_em AS "criadoEm", cli_atualizado_em AS "atualizadoEm"
      FROM clientes 
      WHERE usu_id = $1
    `;
    const rows = await this.db.executar(query, [idUsuario]);

    if (rows.length === 0) return null;
    return RepositorioPerfilClientePostgres.mapearParaEntidade(rows[0] as Record<string, unknown>);
  }

  // eslint-disable-next-line class-methods-use-this
  public async atualizar(perfil: IPerfilCliente): Promise<void> {
    const query = `
      UPDATE clientes
      SET cli_genero = $1, cli_data_nascimento = $2
      WHERE usu_id = $3
    `;
    await this.db.executar(query, [perfil.genero ?? null, perfil.dataNascimento ?? null, perfil.idUsuario]);
  }

  public async deletar(idUsuario: number): Promise<void> {
    const query = 'DELETE FROM clientes WHERE usu_id = $1';
    await this.db.executar(query, [idUsuario]);
  }
}
