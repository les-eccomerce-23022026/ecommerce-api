import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { ControladorPagamentos } from '@/modules/pagamentos/controllers/ControladorPagamentos';
import { ServicoPagamentos } from '@/modules/pagamentos/services/ServicoPagamentos';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';
import { FabricaProvedorPagamento } from '@/modules/pagamentos/provedoresPagamento/FabricaProvedorPagamento';
import { RepositorioIntencaoPagamentoPostgres } from '@/modules/pagamentos/intencaoPagamento/RepositorioIntencaoPagamentoPostgres';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { FabricaProvedorFrete } from '@/modules/frete/provedoresFrete/FabricaProvedorFrete';
import { RepositorioCotacaoFretePostgres } from '@/modules/frete/cotacaoFrete/RepositorioCotacaoFretePostgres';
import { ServicoFrete } from '@/modules/frete/ServicoFrete';
import { di } from '@/shared/infrastructure/di.container';

/**
 * Registra rotas de pagamentos no roteador.
 */
export function registrarRotasPagamentos(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioPagamentosPostgres(db);
  const repositorioIntencao = new RepositorioIntencaoPagamentoPostgres(db);
  const repositorioVendas = new RepositorioVendasPostgres(db);
  const provedorPagamento = FabricaProvedorPagamento.criar(repositorioIntencao);
  const servico = new ServicoPagamentos(repo, provedorPagamento, repositorioIntencao, repositorioVendas, db);
  const repoCotacaoFrete = new RepositorioCotacaoFretePostgres(db);
  const provedorFrete = FabricaProvedorFrete.criar();
  const servicoFrete = new ServicoFrete(provedorFrete, repoCotacaoFrete);
  const controller = new ControladorPagamentos(servico, servicoFrete, repo, di.gestaoIdentidadeCliente);

  router.post('/webhooks/pagamento-pix-simulado', controller.webhookPagamentoPixSimulado);

  // Endpoints tradicionais (DDD) para gerenciamento de pagamento
  router.post('/pagamentos/selecionar', autenticacaoMiddleware, controller.definirMetodoLiquidacao);
  router.get(
    '/pagamentos/venda/:vendaUuid/resumo',
    autenticacaoMiddleware,
    controller.obterResumoPagamentosVenda
  );
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
