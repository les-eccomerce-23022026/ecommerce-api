import { Pool } from 'pg';
import {
  IRepositorioContextoCliente,
  IRepositorioMetricasRecomendacao,
  IRepositorioTendencias,
  IMetricaRecomendacao,
  ICriarMetricaRecomendacaoDto,
  PeriodoMetrica,
  IMetricasAgregadas,
} from './IRepositorioRecomendacao';
import { IContextoRecomendacao } from './IContextoRecomendacao.entity';
import {
  IPedidoRecenteContexto,
  ITendenciaCategoriaContexto,
  ITendenciaFaixaEtariaContexto,
} from './IContextoRecomendacao.entity';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Implementação do Repositório de Recomendação usando PostgreSQL
 *
 * Implementa IRepositorioContextoCliente (contexto do cliente) e
 * IRepositorioMetricasRecomendacao (métricas de avaliação) de forma segregada,
 * respeitando o Princípio da Segregação de Interfaces (ISP).
 */
/**
 * Status de venda que indicam transações concluídas para fins de tendências.
 * Usados nas queries de ranking para excluir pedidos cancelados ou em aberto.
 */
const STATUS_VENDAS_CONCLUIDOS = [STATUS_VENDAS.APROVADA, STATUS_VENDAS.ENTREGUE] as const;

/**
 * Número máximo de títulos retornados por agrupamento (categoria ou faixa etária).
 */
const LIMITE_TITULOS_POR_GRUPO = 3;

/**
 * Número máximo de pedidos recentes retornados no modo pós-venda.
 */
const LIMITE_PEDIDOS_RECENTES = 10;

/**
 * Número máximo de categorias no ranking geral (sem filtro de categoria).
 */
const LIMITE_CATEGORIAS_GERAIS = 5;

export class RepositorioRecomendacaoPostgres
  implements
    IRepositorioContextoCliente,
    IRepositorioMetricasRecomendacao,
    IRepositorioTendencias
{
  constructor(private pool: Pool) {}

  async buscarContexto(clienteUuid: string): Promise<IContextoRecomendacao | null> {
    try {
      const queryPerfil = `
        SELECT
          u.usu_nome AS nome,
          u.usu_genero AS genero,
          u.usu_data_nascimento AS data_nascimento,
          est.est_sigla AS estado,
          cid.cid_nome AS cidade
        FROM livraria_gestao.usuarios u
        LEFT JOIN LATERAL (
          SELECT e.cid_id
          FROM livraria_gestao.enderecos e
          WHERE e.usu_id = u.usu_id
          ORDER BY e.end_principal DESC, e.end_criado_em DESC
          LIMIT 1
        ) end_principal ON TRUE
        LEFT JOIN livraria_ref.cidades cid ON cid.cid_id = end_principal.cid_id
        LEFT JOIN livraria_ref.estados est ON est.est_id = cid.est_id
        WHERE u.usu_uuid = $1
        LIMIT 1
      `;

      const resultadoPerfil = await this.pool.query(queryPerfil, [clienteUuid]);

      if (resultadoPerfil.rows.length === 0) {
        return null;
      }

      const rowPerfil = resultadoPerfil.rows[0];
      const idadeAnos = this.calcularIdadeAnos(rowPerfil.data_nascimento);

      const queryHistorico = `
        SELECT
          l.liv_uuid AS produto_uuid,
          l.liv_titulo AS titulo,
          COALESCE(c.cat_nome, 'Sem categoria') AS categoria,
          a.aut_nome AS autor,
          iv.itv_preco_unitario AS preco,
          v.ven_criado_em AS data_compra
        FROM livraria_comercial.vendas v
        JOIN livraria_comercial.itens_venda iv ON v.ven_id = iv.ven_id
        JOIN livraria_comercial.livros l ON iv.liv_uuid = l.liv_uuid
        JOIN livraria_comercial.autores a ON l.aut_id = a.aut_id
        LEFT JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
        LEFT JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id AND c.cat_ativo = TRUE
        JOIN livraria_gestao.usuarios u ON v.usu_id = u.usu_id
        WHERE u.usu_uuid = $1
        ORDER BY v.ven_criado_em DESC
        LIMIT 20
      `;

      const resultadoHistorico = await this.pool.query(queryHistorico, [clienteUuid]);

      const historicoCompras = resultadoHistorico.rows.map((row) => ({
        produtoUuid: row.produto_uuid,
        titulo: row.titulo,
        categoria: row.categoria,
        dataCompra: row.data_compra,
      }));

      const categoriasContagem = new Map<string, number>();
      const autoresContagem = new Map<string, number>();
      let precoMin = Infinity;
      let precoMax = 0;

      for (const item of resultadoHistorico.rows) {
        categoriasContagem.set(
          item.categoria,
          (categoriasContagem.get(item.categoria) || 0) + 1
        );
        if (item.autor) {
          autoresContagem.set(item.autor, (autoresContagem.get(item.autor) || 0) + 1);
        }
        const preco = Number(item.preco);
        if (!Number.isNaN(preco) && preco > 0) {
          precoMin = Math.min(precoMin, preco);
          precoMax = Math.max(precoMax, preco);
        }
      }

      const categorias = Array.from(categoriasContagem.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      const autores = Array.from(autoresContagem.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      const faixaPreco = {
        min: precoMin === Infinity ? 0 : precoMin,
        max: precoMax === 0 ? 1000 : precoMax,
      };

      return {
        clienteUuid,
        perfil: {
          nome: rowPerfil.nome ?? undefined,
          idadeAnos,
          genero: rowPerfil.genero ?? undefined,
          estado: rowPerfil.estado ?? undefined,
          cidade: rowPerfil.cidade ?? undefined,
        },
        historicoCompras,
        preferencias: {
          categorias,
          autores,
          faixaPreco,
        },
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao buscar contexto: ${mensagem}`);
      throw erro;
    }
  }

  private calcularIdadeAnos(dataNascimento: Date | string | null): number | undefined {
    if (!dataNascimento) {
      return undefined;
    }
    const nascimento = new Date(dataNascimento);
    if (Number.isNaN(nascimento.getTime())) {
      return undefined;
    }
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesDiff = hoje.getMonth() - nascimento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
      idade -= 1;
    }
    return idade >= 0 ? idade : undefined;
  }

  async salvarMetrica(metrica: ICriarMetricaRecomendacaoDto): Promise<void> {
    try {
      const query = `
        INSERT INTO livraria_comercial.metricas_recomendacao (
          cliente_uuid,
          query,
          produtos_recomendados,
          tempo_resposta_ms,
          precisao,
          recall,
          f1_score,
          relevancia_semantica,
          loj_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
      `;

      await this.pool.query(query, [
        metrica.clienteUuid,
        metrica.query,
        JSON.stringify(metrica.produtosRecomendados),
        metrica.tempoRespostaMs,
        metrica.precisao,
        metrica.recall,
        metrica.f1Score,
        metrica.relevanciaSemantica,
        metrica.lojId,
      ]);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao salvar métrica: ${mensagem}`);
      throw erro;
    }
  }

  async buscarMetricas(periodo: PeriodoMetrica): Promise<IMetricaRecomendacao[]> {
    try {
      const { condicao, params } = this.buildCondicaoPeriodo(periodo);

      const query = `
        SELECT 
          id,
          cliente_uuid,
          query,
          produtos_recomendados,
          tempo_resposta_ms,
          precisao,
          recall,
          f1_score,
          relevancia_semantica,
          data_criacao
        FROM livraria_comercial.metricas_recomendacao
        WHERE ${condicao}
        ORDER BY data_criacao DESC
        LIMIT 100
      `;

      const resultado = await this.pool.query(query, params);

      return resultado.rows.map((row) => ({
        id: row.id,
        clienteUuid: row.cliente_uuid,
        query: row.query,
        produtosRecomendados: JSON.parse(row.produtos_recomendados),
        tempoRespostaMs: row.tempo_resposta_ms,
        precisao: row.precisao,
        recall: row.recall,
        f1Score: row.f1_score,
        relevanciaSemantica: row.relevancia_semantica,
        dataCriacao: row.data_criacao,
      }));
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao buscar métricas: ${mensagem}`);
      throw erro;
    }
  }

  async buscarMetricasAgregadas(periodo: PeriodoMetrica): Promise<IMetricasAgregadas> {
    try {
      const { condicao, params } = this.buildCondicaoPeriodo(periodo);

      const query = `
        SELECT 
          COUNT(*) as total_recomendacoes,
          AVG(tempo_resposta_ms) as tempo_resposta_medio,
          AVG(precisao) as precisao_media,
          AVG(recall) as recall_medio,
          AVG(f1_score) as f1_score_medio,
          AVG(relevancia_semantica) as relevancia_semantica_media,
          SUM(CASE WHEN precisao < 0.5 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as taxa_erro
        FROM livraria_comercial.metricas_recomendacao
        WHERE ${condicao}
      `;

      const resultado = await this.pool.query(query, params);

      const row = resultado.rows[0];

      return {
        periodo,
        totalRecomendacoes: parseInt(row.total_recomendacoes),
        tempoRespostaMedio: parseFloat(row.tempo_resposta_medio) || 0,
        precisaoMedia: parseFloat(row.precisao_media) || 0,
        recallMedio: parseFloat(row.recall_medio) || 0,
        f1ScoreMedio: parseFloat(row.f1_score_medio) || 0,
        relevanciaSemanticaMedia: parseFloat(row.relevancia_semantica_media) || 0,
        taxaErro: parseFloat(row.taxa_erro) || 0,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao buscar métricas agregadas: ${mensagem}`);
      throw erro;
    }
  }

  // ── IRepositorioTendencias ─────────────────────────────────────────────────

  /**
   * Retorna os últimos pedidos do cliente para suporte pós-venda.
   * Inclui status descritivo, total da venda e quantidade de itens.
   */
  async buscarPedidosRecentes(clienteUuid: string): Promise<IPedidoRecenteContexto[]> {
    try {
      const query = `
        SELECT
          v.ven_uuid                AS uuid,
          sv.stv_descricao          AS status,
          v.ven_total_venda         AS total,
          v.ven_criado_em           AS criado_em,
          COUNT(iv.itv_id)::INT     AS qtd_itens
        FROM livraria_comercial.vendas v
        JOIN livraria_comercial.status_venda sv ON sv.stv_id = v.stv_id
        JOIN livraria_gestao.usuarios u ON u.usu_id = v.usu_id
        LEFT JOIN livraria_comercial.itens_venda iv ON iv.ven_id = v.ven_id
        WHERE u.usu_uuid = $1
        GROUP BY v.ven_uuid, v.ven_id, sv.stv_descricao, v.ven_total_venda, v.ven_criado_em
        ORDER BY v.ven_criado_em DESC
        LIMIT $2
      `;

      const resultado = await this.pool.query(query, [clienteUuid, LIMITE_PEDIDOS_RECENTES]);

      return resultado.rows.map((row) => ({
        uuid: row.uuid as string,
        status: row.status as string,
        total: Number(row.total),
        criadoEm: new Date(row.criado_em as string),
        qtdItens: Number(row.qtd_itens),
      }));
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao buscar pedidos recentes: ${mensagem}`);
      return [];
    }
  }

  /**
   * Retorna os livros mais vendidos agrupados por categoria.
   * Considera apenas vendas com status APROVADA ou ENTREGUE.
   *
   * @param categorias Filtro opcional; sem filtro retorna top 5 categorias gerais.
   */
  async buscarTendenciasPorCategoria(categorias?: string[]): Promise<ITendenciaCategoriaContexto[]> {
    try {
      const temFiltro = categorias && categorias.length > 0;

      /*
       * A window function SUM(COUNT(...)) OVER (PARTITION BY categoria) calcula
       * o volume total de vendas por categoria após o GROUP BY, permitindo
       * ordenar as categorias do mais vendido para o menos vendido sem CTE.
       */
      const query = `
        SELECT
          c.cat_nome                                              AS categoria,
          l.liv_titulo                                            AS titulo,
          COUNT(iv.itv_id)                                       AS contagem,
          SUM(COUNT(iv.itv_id)) OVER (PARTITION BY c.cat_nome)  AS volume_categoria
        FROM livraria_comercial.itens_venda iv
        JOIN livraria_comercial.livros l ON l.liv_uuid = iv.liv_uuid
        JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
        JOIN livraria_comercial.categorias c ON c.cat_id = lc.cat_id AND c.cat_ativo = TRUE
        JOIN livraria_comercial.vendas v ON v.ven_id = iv.ven_id
        JOIN livraria_comercial.status_venda sv ON sv.stv_id = v.stv_id
        WHERE sv.stv_descricao = ANY($1::text[])
          ${temFiltro ? 'AND c.cat_nome = ANY($2::text[])' : ''}
        GROUP BY c.cat_nome, l.liv_titulo
        ORDER BY volume_categoria DESC, contagem DESC
      `;

      const params: unknown[] = temFiltro
        ? [STATUS_VENDAS_CONCLUIDOS, categorias]
        : [STATUS_VENDAS_CONCLUIDOS];

      const resultado = await this.pool.query(query, params);

      return this.agruparTitulosPorGrupo<ITendenciaCategoriaContexto>(
        resultado.rows,
        'categoria',
        LIMITE_CATEGORIAS_GERAIS
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao buscar tendências por categoria: ${mensagem}`);
      return [];
    }
  }

  /**
   * Retorna os livros mais vendidos agrupados por faixa etária dos compradores.
   * Faixas calculadas a partir de usu_data_nascimento.
   * Considera apenas vendas APROVADA ou ENTREGUE.
   */
  async buscarTendenciasPorFaixaEtaria(): Promise<ITendenciaFaixaEtariaContexto[]> {
    try {
      const query = `
        SELECT
          CASE
            WHEN EXTRACT(YEAR FROM AGE(NOW(), u.usu_data_nascimento))::INT BETWEEN 0  AND 12 THEN '0-12'
            WHEN EXTRACT(YEAR FROM AGE(NOW(), u.usu_data_nascimento))::INT BETWEEN 13 AND 17 THEN '13-17'
            WHEN EXTRACT(YEAR FROM AGE(NOW(), u.usu_data_nascimento))::INT BETWEEN 18 AND 24 THEN '18-24'
            WHEN EXTRACT(YEAR FROM AGE(NOW(), u.usu_data_nascimento))::INT BETWEEN 25 AND 39 THEN '25-39'
            WHEN EXTRACT(YEAR FROM AGE(NOW(), u.usu_data_nascimento))::INT BETWEEN 40 AND 54 THEN '40-54'
            ELSE '55+'
          END                    AS faixa_etaria,
          l.liv_titulo           AS titulo,
          COUNT(iv.itv_id)       AS contagem
        FROM livraria_comercial.itens_venda iv
        JOIN livraria_comercial.livros l ON l.liv_uuid = iv.liv_uuid
        JOIN livraria_comercial.vendas v ON v.ven_id = iv.ven_id
        JOIN livraria_gestao.usuarios u ON u.usu_id = v.usu_id
        JOIN livraria_comercial.status_venda sv ON sv.stv_id = v.stv_id
        WHERE sv.stv_descricao = ANY($1::text[])
          AND u.usu_data_nascimento IS NOT NULL
        GROUP BY faixa_etaria, l.liv_titulo
        ORDER BY faixa_etaria, contagem DESC
      `;

      const resultado = await this.pool.query(query, [STATUS_VENDAS_CONCLUIDOS]);

      return this.agruparTitulosPorGrupo<ITendenciaFaixaEtariaContexto>(
        resultado.rows,
        'faixa_etaria',
        Infinity
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[RepositorioRecomendacaoPostgres] Erro ao buscar tendências por faixa etária: ${mensagem}`);
      return [];
    }
  }

  /**
   * Agrupa linhas de resultado em grupos com lista de títulos (top N por grupo).
   *
   * @param rows       Linhas do resultado SQL com campos `grupoKey` e `titulo`
   * @param grupoKey   Nome da coluna que identifica o grupo
   * @param limiteGrupos Máximo de grupos distintos retornados
   */
  private agruparTitulosPorGrupo<T extends { titulosTop: string[] }>(
    rows: Record<string, unknown>[],
    grupoKey: string,
    limiteGrupos: number
  ): T[] {
    const mapa = new Map<string, string[]>();

    for (const row of rows) {
      const chave = String(row[grupoKey]);
      if (!mapa.has(chave)) {
        if (mapa.size >= limiteGrupos) {
          continue;
        }
        mapa.set(chave, []);
      }
      const titulos = mapa.get(chave)!;
      if (titulos.length < LIMITE_TITULOS_POR_GRUPO) {
        titulos.push(String(row['titulo']));
      }
    }

    return Array.from(mapa.entries()).map(([chave, titulos]) => {
      const obj: Record<string, unknown> = { titulosTop: titulos };
      // Mapeia a chave para o campo correto de acordo com o tipo de grupo
      if (grupoKey === 'faixa_etaria') {
        obj['faixa'] = chave;
      } else {
        obj['categoria'] = chave;
      }
      return obj as unknown as T;
    });
  }

  // ── IRepositorioMetricasRecomendacao — helpers ─────────────────────────────

  /**
   * Constrói condição SQL baseada no período
   */
  private buildCondicaoPeriodo(periodo: PeriodoMetrica): { condicao: string; params: unknown[] } {
    const agora = new Date();
    let condicao = '1=1';
    const params: unknown[] = [];

    const mapaPeriodo: Record<PeriodoMetrica, () => void> = {
      hoje: () => {
        condicao = 'data_criacao >= $1';
        params.push(new Date(agora.setHours(0, 0, 0, 0)));
      },
      semana: () => {
        condicao = 'data_criacao >= $1';
        params.push(new Date(agora.setDate(agora.getDate() - 7)));
      },
      mes: () => {
        condicao = 'data_criacao >= $1';
        params.push(new Date(agora.setMonth(agora.getMonth() - 1)));
      },
      todos: () => {
        /* sem filtro */
      },
    };

    mapaPeriodo[periodo]();

    return { condicao, params };
  }
}
