import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import {
  IRowCidadeEstado,
  IRowBairro,
  IRowCep,
  IRowPais,
  IRowTipoResidencia,
  IRowLogradouroTipo,
} from '@/shared/types/db-rows.types';

/** Leituras de cidade, CEP e logradouro para montagem de DTO de endereço. */
export class GestaoEnderecoLeituras {
  constructor(private readonly db: IConexaoBanco) {}

  public async obterCidadePorId(idCidade: number): Promise<IRowCidadeEstado | null> {
    const query = `SELECT c.cid_nome as "dscCidade", e.est_sigla as "dscEstado"
                   FROM cidades c
                   JOIN estados e ON c.est_id = e.est_id
                   WHERE c.cid_id = $1`;
    const result = await this.db.executar<IRowCidadeEstado>(query, [idCidade]);
    return result.length > 0 ? result[0] : null;
  }

  public async obterBairroPorId(idBairro: number): Promise<IRowBairro | null> {
    const query = `SELECT bai_nome as "dscBairro" FROM bairros WHERE bai_id = $1`;
    const result = await this.db.executar<IRowBairro>(query, [idBairro]);
    return result.length > 0 ? result[0] : null;
  }

  public async obterCepPorId(idCep: string | number): Promise<IRowCep | null> {
    const query = `SELECT cep_numero as "numCep" FROM ceps WHERE cep_numero = $1`;
    const result = await this.db.executar<IRowCep>(query, [idCep]);
    return result.length > 0 ? result[0] : null;
  }

  public async obterPaisPorId(idPais: number): Promise<IRowPais | null> {
    const query = `SELECT pai_nome as "dscPais" FROM paises WHERE pai_id = $1`;
    const result = await this.db.executar<IRowPais>(query, [idPais]);
    return result.length > 0 ? result[0] : null;
  }

  public async obterTipoResidenciaPorId(idTipoResidencia: number): Promise<IRowTipoResidencia | null> {
    const query = `SELECT tre_descricao as "dscTipoResidencia" FROM tipos_residencias WHERE tre_id = $1`;
    const result = await this.db.executar<IRowTipoResidencia>(query, [idTipoResidencia]);
    return result.length > 0 ? result[0] : null;
  }

  public async obterLogradouroPorId(idLogradouro: number): Promise<IRowLogradouroTipo | null> {
    const query = `SELECT l.log_nome as "dscLogradouro", tl.tlo_descricao as "tipoLogradouro"
                   FROM logradouros l
                   JOIN tipos_logradouros tl ON l.tlo_id = tl.tlo_id
                   WHERE l.log_id = $1`;
    const result = await this.db.executar<IRowLogradouroTipo>(query, [idLogradouro]);
    return result.length > 0 ? result[0] : null;
  }
}
