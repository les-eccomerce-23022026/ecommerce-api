import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { ControladorVendas } from '@/modules/vendas/controllers/ControladorVendas';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioCotacaoFretePostgres } from '@/modules/frete/cotacaoFrete/RepositorioCotacaoFretePostgres';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';

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
  const repoLivros = new RepositorioLivrosPostgres(db);
  const servico = new ServicoVendas(repo, repoCotacao, repoEntrega, repoLivros);
  const controller = new ControladorVendas(servico, repoPagamentos, repoEntrega, repoLivros);

  router.post('/vendas', autenticacaoMiddleware, controller.registrarPedidoVenda);
  router.get('/vendas/:uuid', autenticacaoMiddleware, controller.visualizarDetalhesVenda);
  router.get('/minhas-vendas', autenticacaoMiddleware, controller.listarVendasCliente);

  // Confirmação de recebimento pelo cliente
  router.patch('/vendas/:uuid/confirmar-entrega', autenticacaoMiddleware, controller.confirmarRecebimentoCliente);

  // Trocas (Cliente)
  router.post('/vendas/:uuid/troca', autenticacaoMiddleware, controller.solicitarTroca);

  // Devoluções (Cliente)
  router.post('/vendas/:uuid/devolucao', autenticacaoMiddleware, controller.solicitarDevolucao);

  // Trocas (Admin)
  // contextoLojaMiddleware removido para permitir que admin_sistema acesse vendas de qualquer loja
  router.get('/admin/pedidos/trocas', autenticacaoMiddleware, adminOnlyMiddleware, controller.listarTrocasPendentes);
  router.patch('/admin/pedidos/:uuid/autorizar-troca', autenticacaoMiddleware, adminOnlyMiddleware, controller.autorizarTroca);
  router.patch('/admin/pedidos/:uuid/rejeitar-troca', autenticacaoMiddleware, adminOnlyMiddleware, controller.rejeitarTroca);
  router.patch('/admin/pedidos/:uuid/confirmar-recebimento', autenticacaoMiddleware, adminOnlyMiddleware, controller.confirmarRecebimentoTroca);

  // Devoluções (Admin)
  router.get('/admin/pedidos/devolucoes', autenticacaoMiddleware, adminOnlyMiddleware, controller.listarDevolucoesPendentes);
  router.patch('/admin/pedidos/:uuid/autorizar-devolucao', autenticacaoMiddleware, adminOnlyMiddleware, controller.autorizarDevolucao);
  router.patch('/admin/pedidos/:uuid/rejeitar-devolucao', autenticacaoMiddleware, adminOnlyMiddleware, controller.rejeitarDevolucao);
  router.patch('/admin/pedidos/:uuid/confirmar-recebimento-devolucao', autenticacaoMiddleware, adminOnlyMiddleware, controller.confirmarRecebimentoDevolucao);

  // Atualizar endereço de entrega (para redespacho após falha)
  router.put('/vendas/:uuid/endereco-entrega', autenticacaoMiddleware, controller.atualizarEnderecoEntrega);
}
