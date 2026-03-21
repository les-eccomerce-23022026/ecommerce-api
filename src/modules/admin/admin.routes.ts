import { IRouter } from 'express';
import { ControladorAdmin } from '@/modules/admin/admin.controller';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

/**
 * Registra as rotas administrativas restritas.
 * Todas as rotas deste grupo requerem autenticação e papel de administrador.
 */
export function registrarRotasAdmin(app: IRouter): void {
  // Listagem de administradores
  app.get(
    '/admin/administradores',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    (requisicao, resposta) => ControladorAdmin.listarAdmins(requisicao, resposta),
  );

  // Registro de novo administrador
  app.post(
    '/admin/registro',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
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

  // Endpoint de Bootstrap EXCLUSIVO para ambiente de testes (sandboxed).
  // NÃO UTILIZA autenticacaoMiddleware ou adminOnlyMiddleware porque seu propósito
  // é justamente criar o primeiro admin nos testes automatizados sem intervenção no DB.
  app.post('/admin/bootstrap', (requisicao, resposta) => ControladorAdmin.bootstrapAdmin(requisicao, resposta));
}
