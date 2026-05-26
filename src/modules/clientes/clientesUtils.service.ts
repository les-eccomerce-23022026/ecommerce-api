import { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
import { ITelefoneDto } from '@/modules/clientes/Iclientes.dto';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import {
  IRowIdSimples,
  IRowCidadeEstado,
  IRowBairro,
  IRowCep,
  IRowPais,
  IRowTipoResidencia,
  IRowLogradouroTipo,
} from '@/shared/types/db-rows.types';

export class ClientesUtils {
  /** Formata Date para YYYY-MM-DD no fuso local (evita off-by-one em UTC). */
  public static formatarDataSomente(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  public static mapearTipoTelefone(tipo: string): number {
    const mapeamentoTipos: Record<string, number> = {
      celular: 1,
      residencial: 2,
      comercial: 3,
    };

    return mapeamentoTipos[tipo.toLowerCase()] ?? 1; // default celular
  }

  public static normalizarDigitos(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  public static mascararCpf(cpf: string): string {
    const cpfSomenteDigitos = this.normalizarDigitos(cpf);

    if (cpfSomenteDigitos.length !== 11) {
      return cpf;
    }

    return `***.${cpfSomenteDigitos.slice(3, 6)}.***-**`;
  }

  public static mascararNumeroTelefone(numero: string): string {
    const numeroSomenteDigitos = this.normalizarDigitos(numero);

    if (numeroSomenteDigitos.length <= 4) {
      return numeroSomenteDigitos;
    }

    const quantidadeMascarada = numeroSomenteDigitos.length - 4;
    return `${'*'.repeat(quantidadeMascarada)}${numeroSomenteDigitos.slice(-4)}`;
  }

  public static mascararEmail(email: string): string {
    const partes = email.split('@');
    if (partes.length !== 2) return email;
    const [usuario, dominio] = partes;
    if (usuario.length <= 2) {
      return `${usuario[0]}***@${dominio}`;
    }
    return `${usuario[0]}***${usuario[usuario.length - 1]}@${dominio}`;
  }

  public static async obterIdTipoResidencia(db: IConexaoBanco, descricao: string): Promise<number> {
    const query = `SELECT tre_id FROM tipos_residencias WHERE tre_descricao ILIKE $1 LIMIT 1`;
    const result = await db.executar<IRowIdSimples>(query, [descricao]);
    return result.length > 0 ? Number(result[0].tre_id) : 1; // Default Casa
  }

  public static async obterIdTipoLogradouro(db: IConexaoBanco, descricao: string): Promise<number> {
    const query = `SELECT tlo_id FROM tipos_logradouros WHERE tlo_descricao ILIKE $1 LIMIT 1`;
    const result = await db.executar<IRowIdSimples>(query, [descricao]);
    return result.length > 0 ? Number(result[0].tlo_id) : 1; // Default Rua
  }

  public static obterOuCriarPais(_pais: string): number {
    // Brasil é 1 por padrão
    return 1;
  }

  public static converterTelefoneParaDto(telefone: ITelefoneUsuario): ITelefoneDto {
    const tipos: Record<number, string> = {
      1: 'Celular',
      2: 'Residencial',
      3: 'Comercial',
    };

    return {
      tipo: tipos[telefone.idTipoTelefone] || 'Celular',
      numero: telefone.numero,
      numeroMascarado: this.mascararNumeroTelefone(telefone.numero),
    };
  }

  public static async obterOuCriarLogradouro(db: IConexaoBanco, tipoLogradouro: string, nomeLogradouro: string): Promise<number> {
    const queryBuscar = `
      SELECT l.log_id
      FROM logradouros l
      JOIN tipos_logradouros tl ON l.tlo_id = tl.tlo_id
      WHERE tl.tlo_descricao ILIKE $1 AND l.log_nome = $2
    `;
    const existente = await db.executar<IRowIdSimples>(queryBuscar, [
      tipoLogradouro,
      nomeLogradouro,
    ]);
    if (existente.length > 0) {
      return Number(existente[0].log_id);
    }

    const idTipoLogradouro = await ClientesUtils.obterIdTipoLogradouro(db, tipoLogradouro);
    const queryInserir = `
      INSERT INTO logradouros (tlo_id, log_nome)
      VALUES ($1, $2)
      RETURNING log_id
    `;
    const novo = await db.executar<IRowIdSimples>(queryInserir, [
      idTipoLogradouro,
      nomeLogradouro,
    ]);
    return Number(novo[0].log_id);
  }

  public static async garantirLocalidade(db: IConexaoBanco, cidade: string, siglaEstado: string): Promise<number> {
    const queryEstado = `SELECT est_id FROM estados WHERE est_sigla = $1 LIMIT 1`;
    const estadoResult = await db.executar<IRowIdSimples>(queryEstado, [siglaEstado.toUpperCase().trim()]);
    const idEstado = estadoResult.length > 0 ? Number(estadoResult[0].est_id) : null;

    const query = `SELECT cid_id FROM cidades WHERE cid_nome_norm = UPPER(TRIM($1)) AND (est_id = $2 OR $2 IS NULL) LIMIT 1`;
    const existente = await db.executar<IRowIdSimples>(query, [cidade, idEstado]);
    if (existente.length > 0) {
      return Number(existente[0].cid_id);
    }

    const insertQuery = `INSERT INTO cidades (cid_nome, cid_nome_norm, est_id) VALUES ($1::varchar, UPPER(TRIM($1::varchar)), $2) RETURNING cid_id`;
    const novo = await db.executar<IRowIdSimples>(insertQuery, [cidade, idEstado]);
    return Number(novo[0].cid_id);
  }

  public static async obterOuCriarBairro(db: IConexaoBanco, bairro: string, idCidade: number): Promise<number> {
    const query = `SELECT bai_id FROM bairros WHERE bai_nome_norm = UPPER(TRIM($1)) AND cid_id = $2 LIMIT 1`;
    const existente = await db.executar<IRowIdSimples>(query, [bairro, idCidade]);
    if (existente.length > 0) {
      return Number(existente[0].bai_id);
    }
    const insertQuery = `INSERT INTO bairros (bai_nome, bai_nome_norm, cid_id) VALUES ($1::varchar, UPPER(TRIM($1::varchar)), $2) RETURNING bai_id`;
    const novo = await db.executar<IRowIdSimples>(insertQuery, [bairro, idCidade]);
    return Number(novo[0].bai_id);
  }

  public static async obterOuCriarCep(db: IConexaoBanco, cep: string, idCidade: number, idBairro: number): Promise<string> {
    const cepLimpo = cep.replace(/\D/g, '');
    const query = `SELECT cep_numero FROM ceps WHERE cep_numero = $1 LIMIT 1`;
    const existente = await db.executar<any>(query, [cepLimpo]);
    if (existente.length > 0) {
      return existente[0].cep_numero;
    }
    try {
      const insertQuery = `INSERT INTO ceps (cep_numero, cid_id, bai_id) VALUES ($1, $2, $3) RETURNING cep_numero`;
      const novo = await db.executar<any>(insertQuery, [cepLimpo, idCidade, idBairro]);
      return novo[0].cep_numero;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const error = err as { message: string; code?: string };
        // Se der erro de unicidade, buscar o que já existe
        if (error.message.includes('unique constraint') || error.code === '23505') {
          const queryRebusca = `SELECT cep_numero FROM ceps WHERE cep_numero = $1 LIMIT 1`;
          const rebuasca = await db.executar<any>(queryRebusca, [cepLimpo]);
          return rebuasca[0].cep_numero;
        }
      }
      throw err;
    }
  }

  public static async obterCidadePorId(db: IConexaoBanco, idCidade: number): Promise<IRowCidadeEstado | null> {
    const query = `SELECT c.cid_nome as "dscCidade", e.est_sigla as "dscEstado"
                   FROM cidades c
                   JOIN estados e ON c.est_id = e.est_id
                   WHERE c.cid_id = $1`;
    const result = await db.executar<IRowCidadeEstado>(query, [idCidade]);
    return result.length > 0 ? result[0] : null;
  }

  public static async obterBairroPorId(db: IConexaoBanco, idBairro: number): Promise<IRowBairro | null> {
    const query = `SELECT bai_nome as "dscBairro" FROM bairros WHERE bai_id = $1`;
    const result = await db.executar<IRowBairro>(query, [idBairro]);
    return result.length > 0 ? result[0] : null;
  }

  public static async obterCepPorId(db: IConexaoBanco, cep: string): Promise<IRowCep | null> {
    const query = `SELECT cep_numero as "numCep" FROM ceps WHERE cep_numero = $1`;
    const result = await db.executar<IRowCep>(query, [cep]);
    return result.length > 0 ? result[0] : null;
  }

  public static async obterPaisPorId(db: IConexaoBanco, idPais: number): Promise<IRowPais | null> {
    const query = `SELECT pai_nome as "dscPais" FROM paises WHERE pai_id = $1`;
    const result = await db.executar<IRowPais>(query, [idPais]);
    return result.length > 0 ? result[0] : null;
  }

  public static async obterTipoResidenciaPorId(db: IConexaoBanco, idTipoResidencia: number): Promise<IRowTipoResidencia | null> {
    const query = `SELECT tre_descricao as "dscTipoResidencia" FROM tipos_residencias WHERE tre_id = $1`;
    const result = await db.executar<IRowTipoResidencia>(query, [idTipoResidencia]);
    return result.length > 0 ? result[0] : null;
  }

  public static async obterLogradouroPorId(db: IConexaoBanco, idLogradouro: number): Promise<IRowLogradouroTipo | null> {
    const query = `SELECT l.log_nome as "dscLogradouro", tl.tlo_descricao as "tipoLogradouro"
                   FROM logradouros l
                   JOIN tipos_logradouros tl ON l.tlo_id = tl.tlo_id
                   WHERE l.log_id = $1`;
    const result = await db.executar<IRowLogradouroTipo>(query, [idLogradouro]);
    return result.length > 0 ? result[0] : null;
  }
}
