import { ICartaoUsuario } from '../../shared/types/ICartaoUsuario';
import { IConexaoBanco } from '../../shared/infrastructure/database/IConexaoBanco';

/** Tipo que representa uma linha bruta do banco para cartões */
type LinhaCartao = Record<string, unknown>;

export interface IRepositorioCartaoUsuario {
  criar(cartao: Omit<ICartaoUsuario, 'id' | 'uuid'>): Promise<ICartaoUsuario>;
  buscarPorUuid(uuid: string): Promise<ICartaoUsuario | null>;
  buscarPorUsuario(idUsuario: number): Promise<ICartaoUsuario[]>;
  atualizar(uuid: string, dados: Partial<Omit<ICartaoUsuario, 'id' | 'uuid' | 'idUsuario'>>): Promise<ICartaoUsuario | null>;
  excluir(uuid: string): Promise<boolean>;
  definirComoPrincipal(uuid: string, idUsuario: number): Promise<boolean>;
}

export class RepositorioCartaoUsuario implements IRepositorioCartaoUsuario {
  private readonly pool: IConexaoBanco;

  constructor(pool: IConexaoBanco) {
    this.pool = pool;
  }

  private static mapearLinha(linha: LinhaCartao): ICartaoUsuario {
    return {
      id: Number(linha.id),
      uuid: linha.uuid as string,
      idUsuario: Number(linha.idUsuario),
      idBandeira: Number(linha.idBandeira),
      bandeira: linha.bandeira as string | undefined,
      token: linha.token as string,
      final: linha.final as string,
      nomeImpresso: linha.nomeImpresso as string,
      validade: new Date(linha.validade as string),
      principal: linha.principal as boolean,
      criadoEm: linha.criadoEm ? new Date(linha.criadoEm as string) : undefined,
      atualizadoEm: linha.atualizadoEm ? new Date(linha.atualizadoEm as string) : undefined,
    };
  }

  async criar(cartao: Omit<ICartaoUsuario, 'id' | 'uuid'>): Promise<ICartaoUsuario> {
    const query = `
      INSERT INTO crt_cartoes (
        usu_id, ban_id, crt_token,
        crt_final, crt_nome_impresso, crt_validade, crt_principal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING crt_id AS "id", crt_uuid AS "uuid", usu_id AS "idUsuario",
                ban_id AS "idBandeira",
                (SELECT ban_descricao FROM ban_bandeiras WHERE ban_id = crt_cartoes.ban_id) AS "bandeira",
                crt_token AS "token",
                crt_final AS "final", crt_nome_impresso AS "nomeImpresso",
                crt_validade AS "validade", crt_principal AS "principal"
    `;

    const valores = [
      cartao.idUsuario,
      cartao.idBandeira,
      cartao.token,
      cartao.final,
      cartao.nomeImpresso,
      cartao.validade,
      cartao.principal,
    ];

    const rows = await this.pool.executar<LinhaCartao>(query, valores);
    return RepositorioCartaoUsuario.mapearLinha(rows[0]);
  }

  async buscarPorUuid(uuid: string): Promise<ICartaoUsuario | null> {
    const query = `
      SELECT c.crt_id AS "id", c.crt_uuid AS "uuid", c.usu_id AS "idUsuario",
             c.ban_id AS "idBandeira", b.ban_descricao AS "bandeira",
             c.crt_token AS "token", c.crt_final AS "final", 
             c.crt_nome_impresso AS "nomeImpresso", c.crt_validade AS "validade", 
             c.crt_principal AS "principal", c.crt_criado_em AS "criadoEm", 
             c.crt_atualizado_em AS "atualizadoEm"
      FROM crt_cartoes c
      JOIN ban_bandeiras b ON c.ban_id = b.ban_id
      WHERE c.crt_uuid = $1
    `;
    const rows = await this.pool.executar<LinhaCartao>(query, [uuid]);
    if (rows.length === 0) return null;
    return RepositorioCartaoUsuario.mapearLinha(rows[0]);
  }

  async buscarPorUsuario(idUsuario: number): Promise<ICartaoUsuario[]> {
    const query = `
      SELECT c.crt_id AS "id", c.crt_uuid AS "uuid", c.usu_id AS "idUsuario",
             c.ban_id AS "idBandeira", b.ban_descricao AS "bandeira",
             c.crt_token AS "token", c.crt_final AS "final", 
             c.crt_nome_impresso AS "nomeImpresso", c.crt_validade AS "validade", 
             c.crt_principal AS "principal", c.crt_criado_em AS "criadoEm", 
             c.crt_atualizado_em AS "atualizadoEm"
      FROM crt_cartoes c
      JOIN ban_bandeiras b ON c.ban_id = b.ban_id
      WHERE c.usu_id = $1
      ORDER BY c.crt_principal DESC, c.crt_criado_em DESC
    `;
    const rows = await this.pool.executar<LinhaCartao>(query, [idUsuario]);
    return rows.map(RepositorioCartaoUsuario.mapearLinha);
  }

  async atualizar(
    uuid: string,
    dados: Partial<Omit<ICartaoUsuario, 'id' | 'uuid' | 'idUsuario'>>,
  ): Promise<ICartaoUsuario | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let contador = 1;

    if (dados.idBandeira !== undefined) {
      campos.push(`ban_id = $${contador}`);
      valores.push(dados.idBandeira);
      contador += 1;
    }
    if (dados.token !== undefined) {
      campos.push(`crt_token = $${contador}`);
      valores.push(dados.token);
      contador += 1;
    }
    if (dados.final !== undefined) {
      campos.push(`crt_final = $${contador}`);
      valores.push(dados.final);
      contador += 1;
    }
    if (dados.nomeImpresso !== undefined) {
      campos.push(`crt_nome_impresso = $${contador}`);
      valores.push(dados.nomeImpresso);
      contador += 1;
    }
    if (dados.validade !== undefined) {
      campos.push(`crt_validade = $${contador}`);
      valores.push(dados.validade);
      contador += 1;
    }
    if (dados.principal !== undefined) {
      campos.push(`crt_principal = $${contador}`);
      valores.push(dados.principal);
      contador += 1;
    }

    if (campos.length === 0) return this.buscarPorUuid(uuid);

    valores.push(uuid);
    const query = `
      UPDATE crt_cartoes
      SET ${campos.join(', ')}
      WHERE crt_uuid = $${contador}
    `;

    await this.pool.executar(query, valores);
    return this.buscarPorUuid(uuid);
  }

  async excluir(uuid: string): Promise<boolean> {
    const query = 'DELETE FROM crt_cartoes WHERE crt_uuid = $1';
    await this.pool.executar(query, [uuid]);
    return true;
  }

  async definirComoPrincipal(uuid: string, idUsuario: number): Promise<boolean> {
    // 1. Remove principal de todos os outros cartões do usuário
    await this.pool.executar('UPDATE crt_cartoes SET crt_principal = false WHERE usu_id = $1', [idUsuario]);

    if (!uuid) return true;

    // 2. Define o cartão específico como principal
    const query = 'UPDATE crt_cartoes SET crt_principal = true WHERE crt_uuid = $1 AND usu_id = $2';
    await this.pool.executar(query, [uuid, idUsuario]);

    return true;
  }
}
