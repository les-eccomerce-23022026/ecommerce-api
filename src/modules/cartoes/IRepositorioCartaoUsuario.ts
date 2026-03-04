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
      id: Number(linha.id_cartao),
      uuid: linha.uuid_cartao as string,
      idUsuario: Number(linha.id_usuario),
      idBandeiraCartao: Number(linha.id_bandeira_cartao),
      tokenCartao: linha.dsc_token_cartao as string,
      finalCartao: linha.dsc_final_cartao as string,
      nomeImpresso: linha.dsc_nome_impresso as string,
      validade: new Date(linha.dat_validade as string),
      principal: linha.flg_principal as boolean,
    };
  }

  async criar(cartao: Omit<ICartaoUsuario, 'id' | 'uuid'>): Promise<ICartaoUsuario> {
    const query = `
      INSERT INTO ecm_cartao_usuario (
        id_usuario, id_bandeira_cartao, dsc_token_cartao,
        dsc_final_cartao, dsc_nome_impresso, dat_validade, flg_principal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_cartao, uuid_cartao, id_usuario, id_bandeira_cartao,
                dsc_token_cartao, dsc_final_cartao, dsc_nome_impresso,
                dat_validade, flg_principal
    `;

    const valores = [
      cartao.idUsuario,
      cartao.idBandeiraCartao,
      cartao.tokenCartao,
      cartao.finalCartao,
      cartao.nomeImpresso,
      cartao.validade,
      cartao.principal
    ];

    const rows = await this.pool.executar<LinhaCartao>(query, valores);
    return RepositorioCartaoUsuario.mapearLinha(rows[0]);
  }

  async buscarPorUuid(uuid: string): Promise<ICartaoUsuario | null> {
    const query = `
      SELECT id_cartao, uuid_cartao, id_usuario, id_bandeira_cartao,
             dsc_token_cartao, dsc_final_cartao, dsc_nome_impresso,
             dat_validade, flg_principal
      FROM ecm_cartao_usuario
      WHERE uuid_cartao = $1
    `;

    const rows = await this.pool.executar<LinhaCartao>(query, [uuid]);
    if (rows.length === 0) return null;
    return RepositorioCartaoUsuario.mapearLinha(rows[0]);
  }

  async buscarPorUsuario(idUsuario: number): Promise<ICartaoUsuario[]> {
    const query = `
      SELECT id_cartao, uuid_cartao, id_usuario, id_bandeira_cartao,
             dsc_token_cartao, dsc_final_cartao, dsc_nome_impresso,
             dat_validade, flg_principal
      FROM ecm_cartao_usuario
      WHERE id_usuario = $1
      ORDER BY flg_principal DESC, dat_criacao DESC
    `;

    const rows = await this.pool.executar<LinhaCartao>(query, [idUsuario]);
    return rows.map((linha) => RepositorioCartaoUsuario.mapearLinha(linha));
  }

  async atualizar(uuid: string, dados: Partial<Omit<ICartaoUsuario, 'id' | 'uuid' | 'idUsuario'>>): Promise<ICartaoUsuario | null> {
    const campos = [];
    const valores = [];
    let contador = 1;

    if (dados.idBandeiraCartao !== undefined) {
      campos.push(`id_bandeira_cartao = $${contador}`);
      contador += 1;
      valores.push(dados.idBandeiraCartao);
    }
    if (dados.tokenCartao !== undefined) {
      campos.push(`dsc_token_cartao = $${contador}`);
      contador += 1;
      valores.push(dados.tokenCartao);
    }
    if (dados.finalCartao !== undefined) {
      campos.push(`dsc_final_cartao = $${contador}`);
      contador += 1;
      valores.push(dados.finalCartao);
    }
    if (dados.nomeImpresso !== undefined) {
      campos.push(`dsc_nome_impresso = $${contador}`);
      contador += 1;
      valores.push(dados.nomeImpresso);
    }
    if (dados.validade !== undefined) {
      campos.push(`dat_validade = $${contador}`);
      contador += 1;
      valores.push(dados.validade);
    }
    if (dados.principal !== undefined) {
      campos.push(`flg_principal = $${contador}`);
      contador += 1;
      valores.push(dados.principal);
    }

    if (campos.length === 0) return null;

    const query = `
      UPDATE ecm_cartao_usuario
      SET ${campos.join(', ')}
      WHERE uuid_cartao = $${contador}
      RETURNING id_cartao, uuid_cartao, id_usuario, id_bandeira_cartao,
                dsc_token_cartao, dsc_final_cartao, dsc_nome_impresso,
                dat_validade, flg_principal
    `;

    valores.push(uuid);
    const rows = await this.pool.executar<LinhaCartao>(query, valores);
    if (rows.length === 0) return null;
    return RepositorioCartaoUsuario.mapearLinha(rows[0]);
  }

  async excluir(uuid: string): Promise<boolean> {
    const query = 'DELETE FROM ecm_cartao_usuario WHERE uuid_cartao = $1';
    const rows = await this.pool.executar<LinhaCartao>(query, [uuid]);
    return rows.length > 0;
  }

  async definirComoPrincipal(uuid: string, idUsuario: number): Promise<boolean> {
    // Primeiro, remove o flag principal de todos os cartões do usuário
    await this.pool.executar<LinhaCartao>(
      'UPDATE ecm_cartao_usuario SET flg_principal = FALSE WHERE id_usuario = $1',
      [idUsuario]
    );

    // Depois, define o cartão específico como principal
    const query = 'UPDATE ecm_cartao_usuario SET flg_principal = TRUE WHERE uuid_cartao = $1 AND id_usuario = $2';
    const rows = await this.pool.executar<LinhaCartao>(query, [uuid, idUsuario]);
    return (rows.length ?? 0) > 0;
  }
}