import { IRouter } from 'express';
import { ControladorAdmin } from '@/modules/admin/admin.controller';
import { ControladorAdminPainel } from '@/modules/admin/controladorAdminPainel';
import { ControladorTestesAdmin } from '@/modules/admin/controladorTestesAdmin';
import { ServicoDashboardAdmin } from '@/modules/admin/servicoDashboardAdmin';
import { ServicoPedidosAdmin } from '@/modules/admin/servicoPedidosAdmin';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { ServicoNotificacaoEmail } from '@/modules/entrega/adapters/ServicoNotificacaoEmail';
import { ServicoMockCorreios } from '@/modules/logistica-mocks/servicoMockCorreios';
import { ServicoMockLoggi } from '@/modules/logistica-mocks/servicoMockLoggi';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { RepositorioEventoRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioEventoRastreamentoPostgres';
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
  const repoRastreamento = new RepositorioRastreamentoPostgres(db);
  const repoEventoRastreamento = new RepositorioEventoRastreamentoPostgres(db);
  const repoEntrega = new RepositorioEntregaPostgres(db, repoRastreamento);
  const servicoNotificacao = new ServicoNotificacaoEmail();
  const servicoEntrega = new ServicoEntrega(repoEntrega, repoVendas, servicoNotificacao);
  const servicoMockCorreios = new ServicoMockCorreios(repoRastreamento, repoEventoRastreamento);
  const servicoMockLoggi = new ServicoMockLoggi(repoRastreamento, repoEventoRastreamento);
  const servicoPedidosAdmin = new ServicoPedidosAdmin(repoVendas, servicoEntrega, servicoMockCorreios, servicoMockLoggi);
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

  app.patch(
    '/admin/pedidos/:uuid/despachar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.despacharPedido,
  );

  app.patch(
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

  // Atualizar dados cadastrais de administrador (PATCH para atualização parcial)
  app.patch(
    '/admin/administradores/:uuid',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.atualizarAdmin(requisicao, resposta),
  );

  // Endpoint de Bootstrap EXCLUSIVO para ambiente de testes (sandboxed).
  // NÃO UTILIZA autenticacaoMiddleware ou adminOnlyMiddleware porque seu propósito
  // é justamente criar o primeiro admin nos testes automatizados sem intervenção no DB.
  app.post('/admin/bootstrap', (requisicao, resposta) => ControladorAdmin.bootstrapAdmin(requisicao, resposta));

  // Endpoints EXCLUSIVOS para ambiente de testes (sandboxed).
  // Protegidos por NODE_ENV=test no controller.
  // Utilizados para setup de dados de teste sem SQL direto nos testes.
  app.post('/admin/testes/criar-cupom', autenticacaoMiddleware, adminOnlyMiddleware, (requisicao, resposta) => ControladorTestesAdmin.criarCupomTroca(requisicao, resposta));
  app.post('/admin/testes/expirar-intencao', autenticacaoMiddleware, adminOnlyMiddleware, (requisicao, resposta) => ControladorTestesAdmin.expirarIntencao(requisicao, resposta));
  app.post('/admin/testes/mudar-status-venda', autenticacaoMiddleware, adminOnlyMiddleware, (requisicao, resposta) => ControladorTestesAdmin.mudarStatusVenda(requisicao, resposta));
}
