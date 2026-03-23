import { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export class RepositorioEnderecoUsuarioPostgres implements IRepositorioEnderecoUsuario {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  private static mapearParaEntidade(row: Record<string, unknown>): IEnderecoUsuario {
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      idUsuario: Number(row.idUsuario),
      tipo: row.tipo as 'cobranca' | 'entrega',
      apelido: (row.apelido as string | null | undefined) || undefined,
      idTipoResidencia: Number(row.idTipoResidencia),
      idLogradouro: Number(row.idLogradouro),
      numero: row.numero as string,
      complemento: (row.complemento as string | null | undefined) || undefined,
      idCidade: Number(row.idCidade),
      idBairro: Number(row.idBairro),
      idCep: Number(row.idCep),
      idPais: Number(row.idPais),
      principal: row.principal as boolean,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }

  public async criar(endereco: IEnderecoUsuario): Promise<IEnderecoUsuario> {
    const query = `
      INSERT INTO enderecos (
        usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento,
        cid_id, bai_id, cep_id, pai_id, end_principal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING end_id AS "id", end_uuid AS "uuid", 
                usu_id AS "idUsuario", end_tipo AS "tipo", 
                end_apelido AS "apelido", tre_id AS "idTipoResidencia", 
                log_id AS "idLogradouro", end_numero AS "numero", end_complemento AS "complemento", 
                cid_id AS "idCidade", bai_id AS "idBairro", cep_id AS "idCep", 
                pai_id AS "idPais", end_principal AS "principal"
    `;
    const rows = await this.db.executar(query, [
      endereco.idUsuario,
      endereco.tipo,
      endereco.apelido,
      endereco.idTipoResidencia,
      endereco.idLogradouro,
      endereco.numero,
      endereco.complemento,
      endereco.idCidade,
      endereco.idBairro,
      endereco.idCep,
      endereco.idPais,
      endereco.principal,
    ]);
    return RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(rows[0] as Record<string, unknown>);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]> {
    const query = `
      SELECT end_id AS "id", end_uuid AS "uuid", 
             usu_id AS "idUsuario", end_tipo AS "tipo", 
             end_apelido AS "apelido", tre_id AS "idTipoResidencia", 
             log_id AS "idLogradouro", end_numero AS "numero", end_complemento AS "complemento", 
             cid_id AS "idCidade", bai_id AS "idBairro", cep_id AS "idCep", 
             pai_id AS "idPais", end_principal AS "principal",
             end_criado_em AS "criadoEm", end_atualizado_em AS "atualizadoEm"
      FROM enderecos 
      WHERE usu_id = $1
    `;
    const rows = await this.db.executar(query, [idUsuario]);
    return rows.map((row) => RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(row as Record<string, unknown>));
  }

  public async atualizar(endereco: IEnderecoUsuario): Promise<void> {
    const query = `
      UPDATE enderecos
      SET end_tipo = $1, end_apelido = $2, tre_id = $3, log_id = $4, end_numero = $5, end_complemento = $6,
          cid_id = $7, bai_id = $8, cep_id = $9, pai_id = $10, end_principal = $11
      WHERE usu_id = $12 AND end_uuid = $13
    `;
    await this.db.executar(query, [
      endereco.tipo,
      endereco.apelido,
      endereco.idTipoResidencia,
      endereco.idLogradouro,
      endereco.numero,
      endereco.complemento,
      endereco.idCidade,
      endereco.idBairro,
      endereco.idCep,
      endereco.idPais,
      endereco.principal,
      endereco.idUsuario,
      endereco.uuid,
    ]);
  }

  public async deletar(idUsuario: number, uuidEndereco: string): Promise<void> {
    const query = 'DELETE FROM enderecos WHERE usu_id = $1 AND end_uuid = $2';
    await this.db.executar(query, [idUsuario, uuidEndereco]);
  }
}
