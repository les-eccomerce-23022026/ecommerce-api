import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ICriarLojaDto, IListaLojaDto } from './Iloja.dto';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Repositório para lojas.
 */
export class RepositorioLojasPostgres {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  /**
   * Cria uma nova loja.
   */
  public async criarLoja(dados: ICriarLojaDto): Promise<IListaLojaDto> {
    Logger.info('[criarLoja] Iniciando criação de loja', { nome: dados.nome, slug: dados.slug });

    const sql = `
      INSERT INTO livraria_gestao.lojas (loj_nome, loj_slug, loj_cnpj)
      VALUES ($1, $2, $3)
      RETURNING loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug", 
             COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
    `;

    const values = [dados.nome, dados.slug, dados.cnpj];
    const rows = await this.db.executar(sql, values);

    Logger.info('[criarLoja] Loja criada com sucesso', { uuid: (rows[0] as any).uuid });
    return rows[0] as IListaLojaDto;
  }

  /**
   * Lista todas as lojas.
   */
  public async listarLojas(): Promise<IListaLojaDto[]> {
    const sql = `
      SELECT loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug", 
             COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
      FROM livraria_gestao.lojas
      ORDER BY loj_nome
    `;

    const rows = await this.db.executar(sql, []);
    return rows as IListaLojaDto[];
  }

  /**
   * Busca loja por UUID.
   */
  public async buscarPorUuid(uuid: string): Promise<IListaLojaDto | undefined> {
    const sql = `
      SELECT loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug", 
             COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
      FROM livraria_gestao.lojas
      WHERE loj_uuid = $1
    `;

    const rows = await this.db.executar(sql, [uuid]);
    if (rows.length === 0) return undefined;
    return rows[0] as IListaLojaDto;
  }

  /**
   * Obtém loja por UUID (alias para buscarPorUuid).
   */
  public async obterPorUuid(uuid: string): Promise<IListaLojaDto | null> {
    const resultado = await this.buscarPorUuid(uuid);
    return resultado ?? null;
  }

  /**
   * Busca loja por slug.
   */
  public async buscarPorSlug(slug: string): Promise<IListaLojaDto | undefined> {
    const sql = `
      SELECT loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug", 
             COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
      FROM livraria_gestao.lojas
      WHERE loj_slug = $1
    `;

    const rows = await this.db.executar(sql, [slug]);
    if (rows.length === 0) return undefined;
    return rows[0] as IListaLojaDto;
  }

  /**
   * Obtém o ID interno (bigint) da loja a partir do UUID público.
   */
  public async obterIdInternoPorUuid(uuid: string): Promise<number | null> {
    const sql = `
      SELECT loj_id
      FROM livraria_gestao.lojas
      WHERE loj_uuid = $1
    `;
    const rows = await this.db.executar<{ loj_id: number }>(sql, [uuid]);
    return rows.length > 0 ? rows[0].loj_id : null;
  }

  /**
   * Associa administrador a loja.
   */
  public async associarAdminALoja(usuarioId: number, lojaId: number, papel: string = 'admin'): Promise<void> {
    Logger.info('[associarAdminALoja] Associando admin à loja', { usuarioId, lojaId, papel });

    const sql = `
      INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel)
      VALUES ($1, $2, $3)
      ON CONFLICT (usu_id, loj_id) DO UPDATE SET adl_papel = $3
    `;

    await this.db.executar(sql, [usuarioId, lojaId, papel]);
    Logger.info('[associarAdminALoja] Admin associado à loja com sucesso', { usuarioId, lojaId });
  }

  /**
   * Busca lojas de um administrador.
   */
  public async buscarLojasDoAdmin(usuarioId: number): Promise<IListaLojaDto[]> {
    const sql = `
      SELECT l.loj_uuid AS "uuid", l.loj_nome AS "nome", l.loj_slug AS "slug", 
             COALESCE(TRIM(l.loj_cnpj), '') AS "cnpj", l.loj_ativo AS "ativo"
      FROM livraria_gestao.lojas l
      INNER JOIN livraria_gestao.admin_lojas al ON l.loj_id = al.loj_id
      WHERE al.usu_id = $1 AND al.adl_ativo = TRUE
    `;

    const rows = await this.db.executar(sql, [usuarioId]);
    return rows as IListaLojaDto[];
  }
}
