import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { ControladorEntrega } from '@/modules/entrega/ControladorEntrega';
import { ServicoNotificacaoEmail } from './adapters/ServicoNotificacaoEmail';

/**
 * Registra as rotas do módulo de entrega.
 */
export function registrarRotasEntrega(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repoEntrega = new RepositorioEntregaPostgres(db);
  const repoVendas = new RepositorioVendasPostgres(db);
  const servicoNotificacao = new ServicoNotificacaoEmail();
  const servico = new ServicoEntrega(repoEntrega, repoVendas, servicoNotificacao);
  const controller = new ControladorEntrega(servico);

  router.post('/entregas', autenticacaoMiddleware, controller.agendarRemessa.bind(controller));
  router.get('/entregas/:entregaUuid', autenticacaoMiddleware, controller.consultarEntrega.bind(controller));
  router.get('/entregas', autenticacaoMiddleware, controller.listarPorVenda.bind(controller));

  // Novas rotas Sprint 3
  router.patch('/entregas/:entregaUuid/falha', autenticacaoMiddleware, controller.registrarFalha.bind(controller));
  router.patch('/entregas/:entregaUuid/confirmar', autenticacaoMiddleware, controller.confirmarRecebimento.bind(controller));
  router.patch('/entregas/:entregaUuid/reagendar', autenticacaoMiddleware, controller.reagendarEntrega.bind(controller));
}
