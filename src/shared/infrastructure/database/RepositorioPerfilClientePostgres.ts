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
      id: Number(row.idPerfilCliente),
      uuid: row.uuidPerfilCliente as string,
      idUsuario: Number(row.idUsuario),
      genero: row.dscGenero as string | undefined,
      dataNascimento: row.datNascimento ? new Date(row.datNascimento as string) : undefined,
      ranking: Number(row.numRanking ?? 0),
      dataCriacao: row.datCriacao ? new Date(row.datCriacao as string) : undefined,
      dataAtualizacao: row.datAtualizacao ? new Date(row.datAtualizacao as string) : undefined,
    };
  }

  public async criar(perfil: IPerfilCliente): Promise<void> {
    const query = `
      INSERT INTO ecm_perfil_cliente (id_usuario, dsc_genero, dat_nascimento)
      VALUES ($1, $2, $3)
    `;
    await this.db.executar(query, [perfil.idUsuario, perfil.genero ?? null, perfil.dataNascimento ?? null]);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IPerfilCliente | null> {
    const query = `
      SELECT id_perfil_cliente AS "idPerfilCliente", uuid_perfil_cliente AS "uuidPerfilCliente", 
             id_usuario AS "idUsuario", dsc_genero AS "dscGenero", dat_nascimento AS "datNascimento", 
             num_ranking AS "numRanking", dat_criacao AS "datCriacao", dat_atualizacao AS "datAtualizacao"
      FROM ecm_perfil_cliente 
      WHERE id_usuario = $1
    `;
    const rows = await this.db.executar(query, [idUsuario]);

    if (rows.length === 0) return null;
    return RepositorioPerfilClientePostgres.mapearParaEntidade(rows[0] as Record<string, unknown>);
  }

  // eslint-disable-next-line class-methods-use-this
  public async atualizar(perfil: IPerfilCliente): Promise<void> {
    const query = `
      UPDATE ecm_perfil_cliente
      SET dsc_genero = $1, dat_nascimento = $2
      WHERE id_usuario = $3
    `;
    await this.db.executar(query, [perfil.genero ?? null, perfil.dataNascimento ?? null, perfil.idUsuario]);
  }

  public async deletar(idUsuario: number): Promise<void> {
    const query = 'DELETE FROM ecm_perfil_cliente WHERE id_usuario = $1';
    await this.db.executar(query, [idUsuario]);
  }
}
