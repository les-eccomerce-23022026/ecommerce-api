import { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export class RepositorioTelefoneUsuarioPostgres implements IRepositorioTelefoneUsuario {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  private static mapearParaEntidade(row: Record<string, unknown>): ITelefoneUsuario {
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      idUsuario: Number(row.idUsuario),
      idTipoTelefone: Number(row.idTipoTelefone),
      ddd: row.ddd as string,
      numero: row.numero as string,
      principal: row.principal as boolean,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }

  public async criar(telefone: ITelefoneUsuario): Promise<void> {
    const query = `
      INSERT INTO tel_telefones (usu_id, ttp_id, tel_ddd, tel_numero, tel_principal)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await this.db.executar(query, [
      telefone.idUsuario,
      telefone.idTipoTelefone,
      telefone.ddd,
      telefone.numero,
      telefone.principal,
    ]);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<ITelefoneUsuario[]> {
    const query = `
      SELECT tel_id AS "id", tel_uuid AS "uuid", 
             usu_id AS "idUsuario", ttp_id AS "idTipoTelefone", 
             tel_ddd AS "ddd", tel_numero AS "numero", tel_principal AS "principal",
             tel_criado_em AS "criadoEm", tel_atualizado_em AS "atualizadoEm"
      FROM tel_telefones 
      WHERE usu_id = $1
    `;
    const rows = await this.db.executar(query, [idUsuario]);
    return rows.map((row) => RepositorioTelefoneUsuarioPostgres.mapearParaEntidade(row as Record<string, unknown>));
  }

  public async atualizar(telefone: ITelefoneUsuario): Promise<void> {
    const query = `
      UPDATE tel_telefones
      SET ttp_id = $1, tel_ddd = $2, tel_numero = $3, tel_principal = $4
      WHERE usu_id = $5 AND tel_uuid = $6
    `;
    await this.db.executar(query, [
      telefone.idTipoTelefone,
      telefone.ddd,
      telefone.numero,
      telefone.principal,
      telefone.idUsuario,
      telefone.uuid,
    ]);
  }

  public async deletar(idUsuario: number, uuidTelefone: string): Promise<void> {
    const query = 'DELETE FROM tel_telefones WHERE usu_id = $1 AND tel_uuid = $2';
    await this.db.executar(query, [idUsuario, uuidTelefone]);
  }
}
