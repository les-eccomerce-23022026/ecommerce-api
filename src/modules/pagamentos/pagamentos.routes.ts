import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { ControladorPagamentos } from '@/modules/pagamentos/ControladorPagamentos';
import { ServicoPagamentos } from '@/modules/pagamentos/ServicoPagamentos';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/RepositorioPagamentosPostgres';
import { FabricaProvedorPagamento } from '@/modules/pagamentos/provedoresPagamento/FabricaProvedorPagamento';
import { RepositorioIntencaoPagamentoPostgres } from '@/modules/pagamentos/intencaoPagamento/RepositorioIntencaoPagamentoPostgres';

/**
 * Registra rotas de pagamentos no roteador.
 */
export function registrarRotasPagamentos(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioPagamentosPostgres(db);
  const repositorioIntencao = new RepositorioIntencaoPagamentoPostgres(db);
  const provedorPagamento = FabricaProvedorPagamento.criar(repositorioIntencao);
  const servico = new ServicoPagamentos(repo, provedorPagamento, repositorioIntencao);
  const controller = new ControladorPagamentos(servico);

  // Endpoints tradicionais (DDD) para gerenciamento de pagamento
  router.post('/pagamentos/selecionar', autenticacaoMiddleware, controller.definirMetodoLiquidacao);
  router.post(
    '/pagamentos/intencao-pagamento',
    autenticacaoMiddleware,
    controller.registrarIntencaoPagamento
  );
  router.patch(
    '/pagamentos/intencao-pagamento/:inpUuid/venda',
    autenticacaoMiddleware,
    controller.vincularIntencaoVenda
  );
  router.post('/pagamentos/:pagamentoUuid/processar', autenticacaoMiddleware, controller.solicitarAutorizacaoFinanceira);
  router.get('/pagamentos/:pagamentoUuid', autenticacaoMiddleware, controller.consultarPagamento);

  // Endpoints compatíveis com frontend atual (contratos simplificados)
  router.get('/pagamento/info', autenticacaoMiddleware, controller.obterPagamentoInfo);
  router.post('/pagamento/processar', autenticacaoMiddleware, controller.solicitarAutorizacaoFinanceiraCheckout);
}
