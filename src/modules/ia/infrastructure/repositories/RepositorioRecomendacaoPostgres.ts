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
  implements IRepositorioContextoCliente, IRepositorioMetricasRecomendacao {
  constructor(private pool: Pool) {}

  async buscarContexto(clienteUuid: string): Promise<IContextoRecomendacao | null> {
    try {
      // Busca histórico de compras do cliente
      const queryHistorico = `
        SELECT 
          l.liv_uuid as produto_uuid,
          l.liv_titulo as titulo,
          c.cat_nome as categoria,
          v.ven_criado_em as data_compra
        FROM livraria_comercial.vendas v
        JOIN livraria_comercial.itens_venda iv ON v.ven_id = iv.ven_id
        JOIN livraria_comercial.livros l ON iv.liv_id = l.liv_id
        JOIN livraria_comercial.categorias c ON l.cat_id = c.cat_id
        JOIN livraria_gestao.usuarios u ON v.usu_id = u.usu_id
        WHERE u.usu_uuid = $1
        ORDER BY v.ven_criado_em DESC
        LIMIT 20
      `;

      const resultadoHistorico = await this.pool.query(queryHistorico, [clienteUuid]);

      if (resultadoHistorico.rows.length === 0) {
        return null;
      }

      const historicoCompras = resultadoHistorico.rows.map((row) => ({
        produtoUuid: row.produto_uuid,
        titulo: row.titulo,
        categoria: row.categoria,
        dataCompra: row.data_compra,
      }));

      // Calcula preferências baseado no histórico
      const categoriasContagem = new Map<string, number>();
      const autoresContagem = new Map<string, number>();
      let precoMin = Infinity;
      let precoMax = 0;

      for (const item of historicoCompras) {
        categoriasContagem.set(
          item.categoria,
          (categoriasContagem.get(item.categoria) || 0) + 1
        );
        // TODO: Adicionar contagem de autores quando disponível
        // TODO: Calcular faixa de preço baseado nos produtos comprados
      }

      const categorias = Array.from(categoriasContagem.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      const autores = Array.from(autoresContagem.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      // Valores padrão para faixa de preço
      const faixaPreco = {
        min: precoMin === Infinity ? 0 : precoMin,
        max: precoMax === 0 ? 1000 : precoMax,
      };

      return {
        clienteUuid,
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
  private buildCondicaoPeriodo(periodo: PeriodoMetrica): { condicao: string; params: any[] } {
    const agora = new Date();
    let condicao = '1=1';
    const params: any[] = [];

    switch (periodo) {
      case 'hoje':
        condicao = 'data_criacao >= $1';
        params.push(new Date(agora.setHours(0, 0, 0, 0)));
        break;
      case 'semana':
        condicao = 'data_criacao >= $1';
        params.push(new Date(agora.setDate(agora.getDate() - 7)));
        break;
      case 'mes':
        condicao = 'data_criacao >= $1';
        params.push(new Date(agora.setMonth(agora.getMonth() - 1)));
        break;
      case 'todos':
      default:
        // Sem filtro
        break;
    }

    return { condicao, params };
  }
}