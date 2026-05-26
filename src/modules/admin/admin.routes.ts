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
import { RepositorioNotificacoes } from '@/modules/entrega/RepositorioNotificacoes';
import { ServicoMockCorreios } from '@/modules/logistica-mocks/servicoMockCorreios';
import { ServicoMockLoggi } from '@/modules/logistica-mocks/servicoMockLoggi';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { RepositorioEventoRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioEventoRastreamentoPostgres';
import { RepositorioEstoque } from '@/modules/estoque/repositorioEstoque';
import { ServicoEstoque } from '@/modules/estoque/servicoEstoque';
import { ControladorEstoque } from '@/modules/estoque/controladorEstoque';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import {
  adminOnlyMiddleware,
  adminSistemaOnlyMiddleware
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
  const repoNotificacoes = new RepositorioNotificacoes(db);
  const servicoNotificacao = new ServicoNotificacaoEmail(repoNotificacoes);
  const servicoEntrega = new ServicoEntrega(repoEntrega, repoVendas, servicoNotificacao);
  const servicoMockCorreios = new ServicoMockCorreios(repoRastreamento, repoEventoRastreamento);
  const servicoMockLoggi = new ServicoMockLoggi(repoRastreamento, repoEventoRastreamento);
  const servicoPedidosAdmin = new ServicoPedidosAdmin(repoVendas, servicoEntrega, servicoMockCorreios, servicoMockLoggi, servicoNotificacao);
  const servicoDashboardAdmin = new ServicoDashboardAdmin(db);
  const controladorPainel = new ControladorAdminPainel(servicoDashboardAdmin, servicoPedidosAdmin);
  
  // Estoque
  const repoEstoque = new RepositorioEstoque(db);
  const servicoEstoque = new ServicoEstoque(repoEstoque);
  const controladorEstoque = new ControladorEstoque(servicoEstoque);

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

  app.put(
    '/admin/pedidos/:uuid/falha-entrega',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.marcarFalhaEntrega,
  );

  app.put(
    '/admin/pedidos/:uuid/redespachar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.redespacharPedido,
  );

  app.post(
    '/admin/pedidos/:uuid/solicitar-reconfirmacao-endereco',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorPainel.solicitarReconfirmacaoEndereco,
  );

  // Listagem de administradores (apenas admin sistema)
  app.get(
    '/admin/administradores',
    autenticacaoMiddleware,
    adminSistemaOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.listarAdmins(requisicao, resposta),
  );

  // Registro de novo administrador (apenas admin sistema)
  app.post(
    '/admin/registro',
    autenticacaoMiddleware,
    adminSistemaOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.registrarAdmin(requisicao, resposta),
  );

  // Inativar administrador
  app.patch(
    '/admin/administradores/:uuid/inativar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.inativarAdmin(requisicao, resposta),
  );

  // Ativar administrador
  app.patch(
    '/admin/administradores/:uuid/ativar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
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
  app.post('/admin/testes/preparar-tabelas-pagamento', autenticacaoMiddleware, adminOnlyMiddleware, (requisicao, resposta) => ControladorTestesAdmin.prepararTabelasPagamento(requisicao, resposta));
  app.post('/admin/testes/obter-cliente-id', autenticacaoMiddleware, adminOnlyMiddleware, (requisicao, resposta) => ControladorTestesAdmin.obterClienteIdPorEmail(requisicao, resposta));

  // Rotas de Estoque
  app.get(
    '/admin/estoque',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorEstoque.listarEstoque,
  );

  app.get(
    '/admin/estoque/critico',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorEstoque.listarEstoqueCritico,
  );

  app.get(
    '/admin/estoque/kpis',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorEstoque.obterKpis,
  );

  app.post(
    '/admin/estoque/entrada',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controladorEstoque.registrarEntrada,
  );
}
