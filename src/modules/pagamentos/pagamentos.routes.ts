import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { ControladorPagamentos } from '@/modules/pagamentos/ControladorPagamentos';
import { ServicoPagamentos } from '@/modules/pagamentos/ServicoPagamentos';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/RepositorioPagamentosPostgres';

/**
 * Registra rotas de pagamentos no roteador.
 */
export function registrarRotasPagamentos(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioPagamentosPostgres(db);
  const servico = new ServicoPagamentos(repo);
  const controller = new ControladorPagamentos(servico);

  // Endpoints tradicionais (DDD) para gerenciamento de pagamento
  router.post('/pagamentos/selecionar', autenticacaoMiddleware, controller.definirMetodoLiquidacao);
  router.post('/pagamentos/:pagamentoUuid/processar', autenticacaoMiddleware, controller.solicitarAutorizacaoFinanceira);
  router.get('/pagamentos/:pagamentoUuid', autenticacaoMiddleware, controller.consultarPagamento);

  // Endpoints compatíveis com frontend atual (contratos simplificados)
  router.get('/pagamento/info', autenticacaoMiddleware, controller.obterPagamentoInfo);
  router.post('/pagamento/processar', autenticacaoMiddleware, controller.solicitarAutorizacaoFinanceiraCheckout);
}
