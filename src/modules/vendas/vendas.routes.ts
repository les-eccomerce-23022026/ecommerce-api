import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { ControladorVendas } from '@/modules/vendas/controllers/ControladorVendas';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioCotacaoFretePostgres } from '@/modules/frete/cotacaoFrete/RepositorioCotacaoFretePostgres';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';

/**
 * Registra rotas de vendas no roteador.
 */
export function registrarRotasVendas(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioVendasPostgres(db);
  const repoCotacao = new RepositorioCotacaoFretePostgres(db);
  const repoPagamentos = new RepositorioPagamentosPostgres(db);
  const servico = new ServicoVendas(repo, repoCotacao);
  const controller = new ControladorVendas(servico, repoPagamentos);

  router.post('/vendas', autenticacaoMiddleware, controller.registrarPedidoVenda);
  router.get('/vendas/:uuid', autenticacaoMiddleware, controller.visualizarDetalhesVenda);
  router.get('/minhas-vendas', autenticacaoMiddleware, controller.listarVendasCliente);

  // Trocas (Cliente)
  router.post('/vendas/:uuid/troca', autenticacaoMiddleware, controller.solicitarTroca);

  // Trocas (Admin)
  router.get('/admin/pedidos/trocas', autenticacaoMiddleware, adminOnlyMiddleware, controller.listarTrocasPendentes);
  router.put('/admin/pedidos/:uuid/autorizar-troca', autenticacaoMiddleware, adminOnlyMiddleware, controller.autorizarTroca);
  router.put('/admin/pedidos/:uuid/rejeitar-troca', autenticacaoMiddleware, adminOnlyMiddleware, controller.rejeitarTroca);
  router.put('/admin/pedidos/:uuid/confirmar-recebimento', autenticacaoMiddleware, adminOnlyMiddleware, controller.confirmarRecebimentoTroca);
}
