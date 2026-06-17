import { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRowEnderecoUsuario } from '@/shared/types/db-rows.types';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

export class RepositorioEnderecoUsuarioPostgres implements IRepositorioEnderecoUsuario {
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

  private static mapearParaEntidade(row: IRowEnderecoUsuario): IEnderecoUsuario {
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
      idCep: row.idCep ? String(row.idCep).trim() : '',
      idPais: Number(row.idPais),
      principal: row.principal as boolean,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }

  public async criar(endereco: IEnderecoUsuario): Promise<IEnderecoUsuario> {
    const loj_id = this.obterLojId() ?? 1;
    
    let query = `
      INSERT INTO enderecos (
        usu_id, end_tipo, end_apelido, tre_id, log_id, end_numero, end_complemento,
        cid_id, bai_id, cep_id, pai_id, end_principal, loj_id
    `;
    const valores: any[] = [
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
      loj_id,
    ];

    query += `) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING end_id AS "id", end_uuid AS "uuid",
                usu_id AS "idUsuario", end_tipo AS "tipo",
                end_apelido AS "apelido", tre_id AS "idTipoResidencia",
                log_id AS "idLogradouro", end_numero AS "numero", end_complemento AS "complemento",
                cid_id AS "idCidade", bai_id AS "idBairro", cep_id AS "idCep",
                pai_id AS "idPais", end_principal AS "principal"`;

    const rows = await this.db.executar(query, valores);
    return RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(rows[0] as IRowEnderecoUsuario);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]> {
    const loj_id = this.obterLojId();
    
    let query = `
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
    const parametros: any[] = [idUsuario];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += ` AND loj_id = $2`;
      parametros.push(loj_id);
    }

    const rows = await this.db.executar(query, parametros);
    return rows.map((row) => RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(row as IRowEnderecoUsuario));
  }

  public async atualizar(endereco: IEnderecoUsuario): Promise<void> {
    const loj_id = this.obterLojId();
    
    let query = `
      UPDATE enderecos
      SET end_tipo = $1, end_apelido = $2, tre_id = $3, log_id = $4, end_numero = $5, end_complemento = $6,
          cid_id = $7, bai_id = $8, cep_id = $9, pai_id = $10, end_principal = $11
      WHERE usu_id = $12 AND end_uuid = $13
    `;
    const parametros: any[] = [
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
    ];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += ` AND loj_id = $14`;
      parametros.push(loj_id);
    }

    await this.db.executar(query, parametros);
  }

  public async deletar(idUsuario: number, uuidEndereco: string): Promise<void> {
    const loj_id = this.obterLojId();
    
    let query = `DELETE FROM enderecos WHERE usu_id = $1 AND end_uuid = $2`;
    const parametros: any[] = [idUsuario, uuidEndereco];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += ` AND loj_id = $3`;
      parametros.push(loj_id);
    }

    await this.db.executar(query, parametros);
  }

  public async buscarResumoPorIdUsuario(idUsuario: number): Promise<Array<{
    apelido: string | null;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    principal: boolean;
  }>> {
    const query = `
      SELECT
        e.end_apelido AS "apelido",
        COALESCE(tl.tlo_descricao || ' ', '') || l.log_nome AS "logradouro",
        e.end_numero AS "numero",
        e.end_complemento AS "complemento",
        b.bai_nome AS "bairro",
        c.cid_nome AS "cidade",
        est.est_sigla AS "estado",
        LPAD(cep.cep_numero::text, 8, '0') AS "cep",
        e.end_principal AS "principal"
      FROM livraria_gestao.enderecos e
      LEFT JOIN livraria_ref.logradouros l ON l.log_id = e.log_id
      LEFT JOIN livraria_ref.tipos_logradouros tl ON tl.tlo_id = l.tlo_id
      LEFT JOIN livraria_ref.bairros b ON b.bai_id = e.bai_id
      LEFT JOIN livraria_ref.cidades c ON c.cid_id = e.cid_id
      LEFT JOIN livraria_ref.estados est ON est.est_id = c.est_id
      LEFT JOIN livraria_ref.ceps cep ON cep.cep_numero = e.cep_id
      WHERE e.usu_id = $1
      ORDER BY e.end_principal DESC, e.end_criado_em DESC
    `;

    return this.db.executar(query, [idUsuario]);
  }
}
