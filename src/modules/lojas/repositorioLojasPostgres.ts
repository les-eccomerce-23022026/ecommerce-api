import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ICriarLojaDto, IAtualizarLojaDto, IListaLojaDto, IFiltrosListarLojasDto, IRespostaListarLojasPaginadoDto } from './Iloja.dto';
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

    Logger.info('[criarLoja] Loja criada com sucesso', { uuid: (rows[0] as IListaLojaDto).uuid });
    return rows[0] as IListaLojaDto;
  }

  /**
   * Lista lojas com filtros opcionais e paginação.
   */
  public async listarLojas(filtros?: IFiltrosListarLojasDto): Promise<IRespostaListarLojasPaginadoDto> {
    const pagina = Math.max(1, filtros?.pagina ?? 1);
    const limite = Math.min(100, Math.max(1, filtros?.limite ?? 20));
    const offset = (pagina - 1) * limite;

    const condicoes: string[] = [];
    const valores: (string | boolean | number)[] = [];
    let idx = 1;

    if (filtros?.nome) {
      condicoes.push(`loj_nome ILIKE $${idx++}`);
      valores.push(`%${filtros.nome}%`);
    }

    if (filtros?.cnpj) {
      condicoes.push(`TRIM(loj_cnpj) = $${idx++}`);
      valores.push(filtros.cnpj.trim());
    }

    if (filtros?.ativo !== undefined) {
      condicoes.push(`loj_ativo = $${idx++}`);
      valores.push(filtros.ativo);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

    const sqlCount = `SELECT COUNT(*)::int AS total FROM livraria_gestao.lojas ${where}`;
    const rowsCount = await this.db.executar<{ total: number }>(sqlCount, valores);
    const total = rowsCount[0].total;

    const sqlData = `
      SELECT loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug",
             COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
      FROM livraria_gestao.lojas
      ${where}
      ORDER BY loj_nome
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const valoresData = [...valores, limite, offset];
    const rows = await this.db.executar(sqlData, valoresData);

    return {
      lojas: rows as IListaLojaDto[],
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
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
   * Atualiza campos da loja (partial update).
   */
  public async atualizarLoja(uuid: string, dados: IAtualizarLojaDto): Promise<IListaLojaDto> {
    Logger.info('[atualizarLoja] Atualizando loja', { uuid });

    // Validação de segurança: apenas campos permitidos
    const camposPermitidos: (keyof IAtualizarLojaDto)[] = ['nome', 'cnpj', 'ativo'];
    const camposInvalidos = Object.keys(dados).filter(
      campo => !camposPermitidos.includes(campo as keyof IAtualizarLojaDto)
    );

    if (camposInvalidos.length > 0) {
      Logger.warn('[atualizarLoja] Campos não permitidos', { camposInvalidos });
      throw new Error(`Campos não permitidos: ${camposInvalidos.join(', ')}`);
    }

    const sets: string[] = [];
    const valores: (string | boolean)[] = [];
    let idx = 1;

    if (dados.nome !== undefined) {
      sets.push(`loj_nome = $${idx++}`);
      valores.push(dados.nome);
    }

    if (dados.cnpj !== undefined) {
      sets.push(`loj_cnpj = $${idx++}`);
      valores.push(dados.cnpj);
    }

    if (dados.ativo !== undefined) {
      sets.push(`loj_ativo = $${idx++}`);
      valores.push(dados.ativo);
    }

    sets.push(`loj_atualizado_em = NOW()`);
    valores.push(uuid);

    const sql = `
      UPDATE livraria_gestao.lojas
      SET ${sets.join(', ')}
      WHERE loj_uuid = $${idx}
      RETURNING loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug",
                COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
    `;

    const rows = await this.db.executar(sql, valores);
    
    if (rows.length === 0) {
      Logger.warn('[atualizarLoja] Loja não encontrada para atualização', { uuid });
      throw new Error('Loja não encontrada para atualização');
    }
    
    Logger.info('[atualizarLoja] Loja atualizada com sucesso', { uuid });
    return rows[0] as IListaLojaDto;
  }

  /**
   * Inativa ou reativa uma loja.
   */
  public async inativarLoja(uuid: string, ativo: boolean): Promise<IListaLojaDto> {
    Logger.info('[inativarLoja] Alterando status da loja', { uuid, ativo });

    const sql = `
      UPDATE livraria_gestao.lojas
      SET loj_ativo = $1, loj_atualizado_em = NOW()
      WHERE loj_uuid = $2
      RETURNING loj_uuid AS "uuid", loj_nome AS "nome", loj_slug AS "slug",
                COALESCE(TRIM(loj_cnpj), '') AS "cnpj", loj_ativo AS "ativo"
    `;

    const rows = await this.db.executar(sql, [ativo, uuid]);
    
    if (rows.length === 0) {
      Logger.warn('[inativarLoja] Loja não encontrada para alteração de status', { uuid });
      throw new Error('Loja não encontrada para alteração de status');
    }
    
    Logger.info('[inativarLoja] Status da loja alterado com sucesso', { uuid, ativo });
    return rows[0] as IListaLojaDto;
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
