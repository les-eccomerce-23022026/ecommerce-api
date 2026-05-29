import { Pool } from 'pg';
import {
  IRepositorioContextoCliente,
  IRepositorioMetricasRecomendacao,
  IMetricaRecomendacao,
  ICriarMetricaRecomendacaoDto,
  PeriodoMetrica,
  IMetricasAgregadas,
} from '../../domain/repositories/IRepositorioRecomendacao';
import { IContextoRecomendacao } from '../../domain/entities/IContextoRecomendacao.entity';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Implementação do Repositório de Recomendação usando PostgreSQL
 *
 * Implementa IRepositorioContextoCliente (contexto do cliente) e
 * IRepositorioMetricasRecomendacao (métricas de avaliação) de forma segregada,
 * respeitando o Princípio da Segregação de Interfaces (ISP).
 */
export class RepositorioRecomendacaoPostgres
  implements IRepositorioContextoCliente, IRepositorioMetricasRecomendacao
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
