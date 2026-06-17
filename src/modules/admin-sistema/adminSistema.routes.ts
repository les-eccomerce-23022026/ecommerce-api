import { IRouter } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { ServicoDashboardAdminSistema } from '@/modules/admin-sistema/ServicoDashboardAdminSistema';
import { ControladorDashboardAdminSistema } from '@/modules/admin-sistema/ControladorDashboardAdminSistema';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminSistemaOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

export function registrarRotasAdminSistema(app: IRouter): void {
  const db = ConexaoPostgres.obterInstancia();
  const servico = new ServicoDashboardAdminSistema(db);
  const controlador = new ControladorDashboardAdminSistema(servico);

  app.get(
    '/admin-sistema/dashboard',
    autenticacaoMiddleware,
    adminSistemaOnlyMiddleware,
    controlador.obterDashboard,
  );
}
