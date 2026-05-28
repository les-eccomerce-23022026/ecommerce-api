import { Request, Response } from 'express';
import { ServicoRecomendacaoApplication } from '../../application/services/ServicoRecomendacaoApplication';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { Logger } from '@/shared/utils/Logger.util';
import {
  IRecomendarRequestDTO,
  IRecomendarResponseDTO,
  IChatRequestDTO,
  IChatResponseDTO,
  IReindexarRequestDTO,
  IReindexarResponseDTO,
} from '../../application/dtos/IRecomendacaoDTO';
import { PeriodoMetrica } from '../../domain/repositories/IRepositorioRecomendacao';

/** Períodos válidos para filtro de métricas de recomendação */
const PERIODOS_VALIDOS: ReadonlySet<string> = new Set<PeriodoMetrica>([
  'hoje',
  'semana',
  'mes',
  'todos',
]);

/**
 * Controller de Recomendação de Produtos com IA
 * 
 * Expõe endpoints para recomendação de produtos usando RAG com ChromaDB e Gemini.
 */
export class ControladorRecomendacao {
  constructor(private servicoRecomendacao: ServicoRecomendacaoApplication) {}

  /**
   * Endpoint POST /api/ia/recomendar
   * 
   * Gera recomendações de produtos baseadas na query do usuário.
   */
  recomendar = async (req: Request, res: Response): Promise<void> => {
    try {
      const dados: IRecomendarRequestDTO = req.body;

      // Validações básicas
      if (!dados.query || typeof dados.query !== 'string' || dados.query.trim().length === 0) {
        RespostaPadrao.enviarErro(res, 400, 'Query é obrigatória e não pode ser vazia');
        return;
      }

      if (dados.limite !== undefined && (typeof dados.limite !== 'number' || dados.limite < 1 || dados.limite > 20)) {
        RespostaPadrao.enviarErro(res, 400, 'Limite deve ser entre 1 e 20');
        return;
      }

      const resultado = await this.servicoRecomendacao.recomendar(dados);
      RespostaPadrao.enviarSucesso(res, 200, resultado);
    } catch (erro) {
      const msg = RespostaPadrao.obterMensagemErro(erro, 'Erro ao gerar recomendações');
      Logger.error(`[ControladorRecomendacao.recomendar] Erro: ${msg}`, erro instanceof Error ? erro.stack : String(erro));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  /**
   * Endpoint POST /api/ia/chat
   * 
   * Gera resposta de chat com recomendações integradas.
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const dados: IChatRequestDTO = req.body;

      // Validações básicas
      if (!dados.mensagem || typeof dados.mensagem !== 'string' || dados.mensagem.trim().length === 0) {
        RespostaPadrao.enviarErro(res, 400, 'Mensagem é obrigatória e não pode ser vazia');
        return;
      }

      if (dados.historico && !Array.isArray(dados.historico)) {
        RespostaPadrao.enviarErro(res, 400, 'Histórico deve ser um array');
        return;
      }

      const resultado = await this.servicoRecomendacao.chat(dados);
      RespostaPadrao.enviarSucesso(res, 200, resultado);
    } catch (erro) {
      const msg = RespostaPadrao.obterMensagemErro(erro, 'Erro no chat');
      Logger.error(`[ControladorRecomendacao.chat] Erro: ${msg}`, erro instanceof Error ? erro.stack : String(erro));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  /**
   * Endpoint POST /api/ia/reindexar (Admin only)
   * 
   * Reindexa todos os produtos no ChromaDB.
   */
  reindexar = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verifica se é admin (será implementado com middleware de autorização)
      // if (!usuarioTemPapelAdmin(req.usuario)) {
      //   RespostaPadrao.enviarErro(res, 403, 'Acesso negado. Esta rota é restrita a administradores.');
      //   return;
      // }

      const dados: IReindexarRequestDTO = req.body;
      const resultado = await this.servicoRecomendacao.reindexarCatalogo(dados.forcarReindexacao || false);

      const resposta: IReindexarResponseDTO = {
        mensagem: 'Catálogo reindexado com sucesso',
        produtosIndexados: resultado.produtosIndexados,
        tempoExecucaoMs: resultado.tempoExecucaoMs,
      };

      RespostaPadrao.enviarSucesso(res, 200, resposta);
    } catch (erro) {
      const msg = RespostaPadrao.obterMensagemErro(erro, 'Erro ao reindexar catálogo');
      Logger.error(`[ControladorRecomendacao.reindexar] Erro: ${msg}`, erro instanceof Error ? erro.stack : String(erro));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  /**
   * Endpoint GET /api/ia/metricas
   * Endpoint GET /api/ia/metricas/:periodo
   *
   * Retorna o histórico detalhado de métricas de recomendação registradas no período.
   * O parâmetro :periodo é opcional; quando ausente, retorna todos os registros.
   * Valores aceitos: hoje, semana, mes, todos.
   */
  buscarMetricas = async (req: Request, res: Response): Promise<void> => {
    try {
      const periodoParam = (req.params.periodo ?? 'todos').toLowerCase();

      if (!PERIODOS_VALIDOS.has(periodoParam)) {
        RespostaPadrao.enviarErro(
          res,
          400,
          `Período inválido. Valores aceitos: ${Array.from(PERIODOS_VALIDOS).join(', ')}`,
        );
        return;
      }

      const periodo = periodoParam as PeriodoMetrica;
      const metricas = await this.servicoRecomendacao.buscarMetricas(periodo);

      // Omite o id interno para não expor BIGSERIAL conforme regra U4
      const metricasPublicas = metricas.map((m) => ({
        clienteUuid: m.clienteUuid,
        query: m.query,
        produtosRecomendados: m.produtosRecomendados,
        tempoRespostaMs: m.tempoRespostaMs,
        precisao: m.precisao,
        recall: m.recall,
        f1Score: m.f1Score,
        relevanciaSemantica: m.relevanciaSemantica,
        dataCriacao: m.dataCriacao,
      }));

      RespostaPadrao.enviarSucesso(res, 200, {
        periodo,
        total: metricasPublicas.length,
        metricas: metricasPublicas,
      });
    } catch (erro) {
      const msg = RespostaPadrao.obterMensagemErro(erro, 'Erro ao buscar métricas de recomendação');
      Logger.error(
        `[ControladorRecomendacao.buscarMetricas] Erro: ${msg}`,
        erro instanceof Error ? erro.stack : String(erro),
      );
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  /**
   * Endpoint GET /api/ia/metricas/agregadas
   *
   * Retorna médias e totais consolidados das métricas de recomendação.
   * Aceita query param opcional ?periodo= (hoje, semana, mes, todos).
   * Quando omitido, consolida todos os registros históricos.
   */
  buscarMetricasAgregadas = async (req: Request, res: Response): Promise<void> => {
    try {
      const periodoParam = ((req.query.periodo as string) ?? 'todos').toLowerCase();

      if (!PERIODOS_VALIDOS.has(periodoParam)) {
        RespostaPadrao.enviarErro(
          res,
          400,
          `Período inválido. Valores aceitos: ${Array.from(PERIODOS_VALIDOS).join(', ')}`,
        );
        return;
      }

      const periodo = periodoParam as PeriodoMetrica;
      const agregadas = await this.servicoRecomendacao.buscarMetricasAgregadas(periodo);

      RespostaPadrao.enviarSucesso(res, 200, agregadas);
    } catch (erro) {
      const msg = RespostaPadrao.obterMensagemErro(erro, 'Erro ao buscar métricas agregadas de recomendação');
      Logger.error(
        `[ControladorRecomendacao.buscarMetricasAgregadas] Erro: ${msg}`,
        erro instanceof Error ? erro.stack : String(erro),
      );
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  /**
   * Endpoint GET /api/ia/saude
   * 
   * Verifica saúde do serviço de IA.
   */
  saude = async (_req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Implementar verificação real de conexão com ChromaDB e Gemini
      RespostaPadrao.enviarSucesso(res, 200, {
        status: 'ok',
        servico: 'ia-recomendacao',
        timestamp: new Date().toISOString(),
      });
    } catch (erro) {
      const msg = RespostaPadrao.obterMensagemErro(erro, 'Erro ao verificar saúde');
      Logger.error(`[ControladorRecomendacao.saude] Erro: ${msg}`);
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };
}