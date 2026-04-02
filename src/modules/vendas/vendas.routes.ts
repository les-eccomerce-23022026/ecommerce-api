import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { ControladorVendas } from '@/modules/vendas/controllers/ControladorVendas';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioCotacaoFretePostgres } from '@/modules/frete/cotacaoFrete/RepositorioCotacaoFretePostgres';

/**
 * Registra rotas de vendas no roteador.
 */
export function registrarRotasVendas(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioVendasPostgres(db);
  const repoCotacao = new RepositorioCotacaoFretePostgres(db);
  const servico = new ServicoVendas(repo, repoCotacao);
  const controller = new ControladorVendas(servico);

  router.post('/vendas', autenticacaoMiddleware, controller.registrarPedidoVenda);
  router.get('/vendas/:uuid', autenticacaoMiddleware, controller.visualizarDetalhesVenda);
  router.get('/minhas-vendas', autenticacaoMiddleware, controller.listarVendasCliente);
}
