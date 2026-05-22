/**
 * Repositório de Notificações
 * 
 * Gerencia persistência de notificações no PostgreSQL.
 */

import { IConexaoBanco, DbParametro } from '../../shared/infrastructure/database/IConexaoBanco';
import { INotificacao, INotificacaoResponse } from './types/Notificacao';

export class RepositorioNotificacoes {
  constructor(private readonly db: IConexaoBanco) {}

  async criar(notificacao: INotificacao): Promise<INotificacaoResponse> {
    const query = `
      INSERT INTO livraria_comercial.notificacoes (not_usuario_uuid, not_venda_uuid, not_tipo, not_titulo, not_mensagem, not_codigo_rastreio, not_lida)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING not_uuid, not_usuario_uuid, not_venda_uuid, not_tipo, not_titulo, not_mensagem, not_codigo_rastreio, not_lida, not_criado_em, not_atualizado_em
    `;

    const values: DbParametro[] = [
      notificacao.usuarioUuid,
      notificacao.vendaUuid || null,
      notificacao.tipo,
      notificacao.titulo,
      notificacao.mensagem,
      notificacao.codigoRastreio || null,
      notificacao.lida,
    ];

    const result = await this.db.executar<any>(query, values);
    return this.mapearParaResponse(result[0]);
  }

  async buscarPorUsuario(usuarioUuid: string, apenasNaoLidas = false): Promise<INotificacaoResponse[]> {
    let query = `
      SELECT not_uuid, not_usuario_uuid, not_venda_uuid, not_tipo, not_titulo, not_mensagem, not_codigo_rastreio, not_lida, not_criado_em, not_atualizado_em
      FROM livraria_comercial.notificacoes
      WHERE not_usuario_uuid = $1
    `;
    const values: DbParametro[] = [usuarioUuid];

    if (apenasNaoLidas) {
      query += ' AND not_lida = false';
    }

    query += ' ORDER BY not_criado_em DESC';

    const result = await this.db.executar<any>(query, values);
    return result.map(this.mapearParaResponse);
  }

  async contarNaoLidas(usuarioUuid: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM livraria_comercial.notificacoes
      WHERE not_usuario_uuid = $1 AND not_lida = false
    `;

    const result = await this.db.executar<{ count: string }>(query, [usuarioUuid]);
    return parseInt(result[0].count, 10);
  }

  async marcarComoLida(uuid: string, usuarioUuid: string): Promise<void> {
    const query = `
      UPDATE livraria_comercial.notificacoes
      SET not_lida = true, not_atualizado_em = CURRENT_TIMESTAMP
      WHERE not_uuid = $1 AND not_usuario_uuid = $2
    `;

    await this.db.executar(query, [uuid, usuarioUuid]);
  }

  async marcarTodasComoLidas(usuarioUuid: string): Promise<void> {
    const query = `
      UPDATE livraria_comercial.notificacoes
      SET not_lida = true, not_atualizado_em = CURRENT_TIMESTAMP
      WHERE not_usuario_uuid = $1 AND not_lida = false
    `;

    await this.db.executar(query, [usuarioUuid]);
  }

  async buscarUsuarioPorEmail(email: string): Promise<{ uuid: string } | null> {
    const query = `
      SELECT usu_uuid as uuid
      FROM livraria_gestao.usuarios
      WHERE usu_email = $1
      LIMIT 1
    `;

    const result = await this.db.executar<{ uuid: string }>(query, [email]);
    
    if (result.length === 0) {
      return null;
    }

    return { uuid: result[0].uuid };
  }

  private mapearParaResponse(row: any): INotificacaoResponse {
    return {
      uuid: row.not_uuid,
      usuarioUuid: row.not_usuario_uuid,
      vendaUuid: row.not_venda_uuid,
      tipo: row.not_tipo,
      titulo: row.not_titulo,
      mensagem: row.not_mensagem,
      codigoRastreio: row.not_codigo_rastreio,
      lida: row.not_lida,
      criadoEm: row.not_criado_em,
      atualizadoEm: row.not_atualizado_em,
    };
  }
}
