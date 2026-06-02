import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { ControladorVendas } from '@/modules/vendas/controllers/ControladorVendas';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioCotacaoFretePostgres } from '@/modules/frete/cotacaoFrete/RepositorioCotacaoFretePostgres';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';

/**
 * Registra rotas de vendas no roteador.
 */
export function registrarRotasVendas(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioVendasPostgres(db);
  const repoCotacao = new RepositorioCotacaoFretePostgres(db);
  const repoPagamentos = new RepositorioPagamentosPostgres(db);
  const repoRastreamento = new RepositorioRastreamentoPostgres(db);
  const repoEntrega = new RepositorioEntregaPostgres(db, repoRastreamento);
  const servico = new ServicoVendas(repo, repoCotacao, repoEntrega);
  const controller = new ControladorVendas(servico, repoPagamentos, repoEntrega);

  router.post('/vendas', autenticacaoMiddleware, controller.registrarPedidoVenda);
  router.get('/vendas/:uuid', autenticacaoMiddleware, controller.visualizarDetalhesVenda);
  router.get('/minhas-vendas', autenticacaoMiddleware, controller.listarVendasCliente);

  // Trocas (Cliente)
  router.post('/vendas/:uuid/troca', autenticacaoMiddleware, controller.solicitarTroca);

  // Trocas (Admin)
  router.get('/admin/pedidos/trocas', autenticacaoMiddleware, contextoLojaMiddleware, adminOnlyMiddleware, controller.listarTrocasPendentes);
  router.patch('/admin/pedidos/:uuid/autorizar-troca', autenticacaoMiddleware, contextoLojaMiddleware, adminOnlyMiddleware, controller.autorizarTroca);
  router.patch('/admin/pedidos/:uuid/rejeitar-troca', autenticacaoMiddleware, contextoLojaMiddleware, adminOnlyMiddleware, controller.rejeitarTroca);
  router.patch('/admin/pedidos/:uuid/confirmar-recebimento', autenticacaoMiddleware, contextoLojaMiddleware, adminOnlyMiddleware, controller.confirmarRecebimentoTroca);

  // Atualizar endereço de entrega (para redespacho após falha)
  router.put('/vendas/:uuid/endereco-entrega', autenticacaoMiddleware, controller.atualizarEnderecoEntrega);
}
