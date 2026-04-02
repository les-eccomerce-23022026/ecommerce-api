import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';

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

  async obterUsuIdPorUuid(usuUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ usu_id: number }>(
      'SELECT usu_id FROM usuarios WHERE usu_uuid = $1',
      [usuUuid] as DbParametro[],
    );
    return rows.length ? rows[0].usu_id : null;
  }

  async listarItens(usuUuid: string): Promise<RowItem[]> {
    const sql = `
      SELECT
        c.cri_quantidade::text,
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_imagem_url,
        e.etq_preco_venda::text
      FROM carrinho_itens c
      INNER JOIN usuarios u ON u.usu_id = c.usu_id
      INNER JOIN livros l ON l.liv_id = c.liv_id
      INNER JOIN estoques e ON e.liv_id = l.liv_id
      WHERE u.usu_uuid = $1
      ORDER BY c.cri_atualizado_em DESC
    `;
    return this.db.executar<RowItem>(sql, [usuUuid] as DbParametro[]);
  }

  async removerItem(usuId: number, livId: number): Promise<void> {
    await this.db.executar(
      'DELETE FROM carrinho_itens WHERE usu_id = $1 AND liv_id = $2',
      [usuId, livId] as DbParametro[],
    );
  }

  async limpar(usuId: number): Promise<void> {
    await this.db.executar('DELETE FROM carrinho_itens WHERE usu_id = $1', [usuId] as DbParametro[]);
  }

  async upsertQuantidade(usuId: number, livId: number, quantidade: number): Promise<void> {
    if (quantidade <= 0) {
      await this.removerItem(usuId, livId);
      return;
    }
    const sql = `
      INSERT INTO carrinho_itens (usu_id, liv_id, cri_quantidade)
      VALUES ($1, $2, $3)
      ON CONFLICT (usu_id, liv_id) DO UPDATE SET
        cri_quantidade = EXCLUDED.cri_quantidade,
        cri_atualizado_em = NOW()
    `;
    await this.db.executar(sql, [usuId, livId, quantidade] as DbParametro[]);
  }
}
