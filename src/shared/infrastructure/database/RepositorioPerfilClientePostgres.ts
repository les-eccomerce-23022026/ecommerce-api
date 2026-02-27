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
      idUsuario: Number(row.id_usuario),
      genero: row.dsc_genero as string,
      dataNascimento: row.dat_nascimento as Date,
    };
  }

  public async criar(perfil: IPerfilCliente): Promise<void> {
    const query = `
      INSERT INTO ecm_perfil_cliente (id_usuario, dsc_genero, dat_nascimento)
      VALUES ($1, $2, $3)
    `;
    await this.db.executar(query, [perfil.idUsuario, perfil.genero, perfil.dataNascimento]);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IPerfilCliente | null> {
    const query = 'SELECT * FROM ecm_perfil_cliente WHERE id_usuario = $1';
    const rows = await this.db.executar(query, [idUsuario]);

    if (rows.length === 0) return null;
    return RepositorioPerfilClientePostgres.mapearParaEntidade(rows[0] as Record<string, unknown>);
  }

  public async atualizar(perfil: IPerfilCliente): Promise<void> {
    const query = `
      UPDATE ecm_perfil_cliente
      SET dsc_genero = $1, dat_nascimento = $2
      WHERE id_usuario = $3
    `;
    await this.db.executar(query, [perfil.genero, perfil.dataNascimento, perfil.idUsuario]);
  }

  public async deletar(idUsuario: number): Promise<void> {
    const query = 'DELETE FROM ecm_perfil_cliente WHERE id_usuario = $1';
    await this.db.executar(query, [idUsuario]);
  }
}
