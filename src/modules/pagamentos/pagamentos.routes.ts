import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { ControladorPagamentos } from './controllers/ControladorPagamentos';
import { ServicoPagamentos } from './services/ServicoPagamentos';
import { RepositorioPagamentosPostgres } from './repositories/RepositorioPagamentosPostgres';

/**
 * Registra rotas de pagamentos no roteador.
 */
export function registrarRotasPagamentos(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioPagamentosPostgres(db);
  const servico = new ServicoPagamentos(repo);
  const controller = new ControladorPagamentos(servico);

  router.post('/pagamentos/selecionar', autenticacaoMiddleware, controller.selecionarFormaPagamento);
  router.post('/pagamentos/:pagamentoUuid/processar', autenticacaoMiddleware, controller.processarPagamento);
  router.get('/pagamentos/:pagamentoUuid', autenticacaoMiddleware, controller.consultarPagamento);
}
