import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

type RowItem = {
  cri_quantidade: string;
  liv_uuid: string;
  liv_titulo: string;
  liv_isbn: string;
  liv_imagem_url: string | null;
  etq_preco_venda: string;
};

export class RepositorioCarrinhoPostgres {
  constructor(private readonly db: IConexaoBanco) {}

  /**
   * Obtém o loj_id do contexto de requisição.
   * Se não houver contexto, retorna undefined (compatibilidade com código legado).
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  async obterUsuIdPorUuid(usuUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ usu_id: number }>(
      'SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_uuid = $1',
      [usuUuid] as DbParametro[],
    );
    return rows.length ? rows[0].usu_id : null;
  }

  async listarItens(usuUuid: string): Promise<RowItem[]> {
    const loj_id = this.obterLojId();
    let sql = `
      SELECT
        c.cri_quantidade::text,
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_imagem_url,
        e.etq_preco_venda::text
      FROM livraria_comercial.carrinho_itens c
      INNER JOIN livraria_gestao.usuarios u ON u.usu_id = c.usu_id
      INNER JOIN livraria_comercial.livros l ON l.liv_id = c.liv_id
      INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
      WHERE u.usu_uuid = $1
    `;
    
    const parametros: DbParametro[] = [usuUuid];
    let contador = 2;

    // Se multi-tenancy estiver habilitado, filtrar por loj_id no estoque
    if (loj_id) {
      sql += ` AND e.loj_id = $${contador}`;
      parametros.push(loj_id);
      contador++;
    }

    sql += ` ORDER BY c.cri_atualizado_em DESC`;
    
    return this.db.executar<RowItem>(sql, parametros);
  }

  async removerItem(usuId: number, livId: number): Promise<void> {
    await this.db.executar(
      'DELETE FROM livraria_comercial.carrinho_itens WHERE usu_id = $1 AND liv_id = $2',
      [usuId, livId] as DbParametro[],
    );
  }

  async limpar(usuId: number): Promise<void> {
    await this.db.executar('DELETE FROM livraria_comercial.carrinho_itens WHERE usu_id = $1', [usuId] as DbParametro[]);
  }

  async upsertQuantidade(
    usuId: number,
    livId: number,
    quantidade: number,
    lojIdExplicito?: number,
  ): Promise<void> {
    if (quantidade <= 0) {
      await this.removerItem(usuId, livId);
      return;
    }
    const loj_id = lojIdExplicito ?? this.obterLojId() ?? 1;
    const sql = `
      INSERT INTO livraria_comercial.carrinho_itens (usu_id, liv_id, cri_quantidade, loj_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (usu_id, liv_id) DO UPDATE SET
        cri_quantidade = EXCLUDED.cri_quantidade,
        cri_atualizado_em = NOW()
    `;
    await this.db.executar(sql, [usuId, livId, quantidade, loj_id] as DbParametro[]);
  }
}
