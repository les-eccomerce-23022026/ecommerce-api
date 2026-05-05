import { IRouter } from 'express';
import { ControladorAdmin } from '@/modules/admin/admin.controller';
import { ControladorAdminPainel } from '@/modules/admin/controlador-admin-painel';
import { ServicoDashboardAdmin } from '@/modules/admin/servico-dashboard-admin';
import { ServicoPedidosAdmin } from '@/modules/admin/servico-pedidos-admin';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { ServicoNotificacaoEmail } from '@/modules/entrega/adapters/ServicoNotificacaoEmail';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { 
  adminOnlyMiddleware, 
  adminMestreOnlyMiddleware 
} from '@/shared/middlewares/autorizacao.middleware';

/**
 * Registra as rotas administrativas restritas.
 * Todas as rotas deste grupo requerem autenticação e papel de administrador.
 */
export function registrarRotasAdmin(app: IRouter): void {
  const db = ConexaoPostgres.obterInstancia();
  const repoVendas = new RepositorioVendasPostgres(db);
  const repoEntrega = new RepositorioEntregaPostgres(db);
  const servicoNotificacao = new ServicoNotificacaoEmail();
  const servicoEntrega = new ServicoEntrega(repoEntrega, repoVendas, servicoNotificacao);
  const servicoPedidosAdmin = new ServicoPedidosAdmin(repoVendas, servicoEntrega);
  const servicoDashboardAdmin = new ServicoDashboardAdmin(db);
  const controladorPainel = new ControladorAdminPainel(servicoDashboardAdmin, servicoPedidosAdmin);

  app.get(
    '/admin/dashboard',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.obterDashboard,
  );

  app.get(
    '/admin/pedidos',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.listarPedidosAdmin,
  );

  app.put(
    '/admin/pedidos/:uuid/despachar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.despacharPedido,
  );

  app.put(
    '/admin/pedidos/:uuid/entrega',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.confirmarEntregaPedido,
  );

  // Listagem de administradores
  app.get(
    '/admin/administradores',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    adminMestreOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.listarAdmins(requisicao, resposta),
  );

  // Registro de novo administrador
  app.post(
    '/admin/registro',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    adminMestreOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.registrarAdmin(requisicao, resposta),
  );

  // Inativar administrador
  app.patch(
    '/admin/administradores/:uuid/inativar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    adminMestreOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.inativarAdmin(requisicao, resposta),
  );

  // Ativar administrador
  app.patch(
    '/admin/administradores/:uuid/ativar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    adminMestreOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.ativarAdmin(requisicao, resposta),
  );

  // Endpoint de Bootstrap EXCLUSIVO para ambiente de testes (sandboxed).
  // NÃO UTILIZA autenticacaoMiddleware ou adminOnlyMiddleware porque seu propósito
  // é justamente criar o primeiro admin nos testes automatizados sem intervenção no DB.
  app.post('/admin/bootstrap', (requisicao, resposta) => ControladorAdmin.bootstrapAdmin(requisicao, resposta));
}
