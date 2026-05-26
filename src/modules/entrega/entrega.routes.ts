import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { ControladorEntrega } from '@/modules/entrega/ControladorEntrega';
import { ServicoNotificacaoBanco } from './adapters/ServicoNotificacaoBanco';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { NotificacoesController } from './notificacoes.controller';
import { RepositorioNotificacoes } from './RepositorioNotificacoes';

/**
 * Registra as rotas do módulo de entrega.
 */
export function registrarRotasEntrega(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repoRastreamento = new RepositorioRastreamentoPostgres(db);
  const repoEntrega = new RepositorioEntregaPostgres(db, repoRastreamento);
  const repoVendas = new RepositorioVendasPostgres(db);
  const repoNotificacoes = new RepositorioNotificacoes(db);
  const servicoNotificacao = new ServicoNotificacaoBanco(repoNotificacoes);
  const servico = new ServicoEntrega(repoEntrega, repoVendas, servicoNotificacao);
  const controller = new ControladorEntrega(servico);
  const notificacoesController = new NotificacoesController();

  router.post('/entregas', autenticacaoMiddleware, controller.agendarRemessa.bind(controller));
  router.get('/entregas/:entregaUuid', autenticacaoMiddleware, controller.consultarEntrega.bind(controller));
  router.get('/entregas', autenticacaoMiddleware, controller.listarPorVenda.bind(controller));

  // Novas rotas Sprint 3
  router.patch('/entregas/:entregaUuid/falha', autenticacaoMiddleware, controller.registrarFalha.bind(controller));
  router.patch('/entregas/:entregaUuid/confirmar', autenticacaoMiddleware, controller.confirmarRecebimento.bind(controller));
  router.patch('/entregas/:entregaUuid/reagendar', autenticacaoMiddleware, controller.reagendarEntrega.bind(controller));

  // Rotas de notificações
  router.get('/notificacoes', autenticacaoMiddleware, notificacoesController.listar.bind(notificacoesController));
  router.get('/notificacoes/contar-nao-lidas', autenticacaoMiddleware, notificacoesController.contarNaoLidas.bind(notificacoesController));
  router.put('/notificacoes/:uuid/lida', autenticacaoMiddleware, notificacoesController.marcarComoLida.bind(notificacoesController));
  router.put('/notificacoes/marcar-todas-lidas', autenticacaoMiddleware, notificacoesController.marcarTodasComoLidas.bind(notificacoesController));
}
