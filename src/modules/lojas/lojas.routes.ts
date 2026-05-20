import { IRouter } from 'express';
import { ControladorLojas } from './controladorLojas';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware, adminMestreOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

/**
 * Registra as rotas de lojas.
 */
export function registrarRotasLojas(app: IRouter): void {
  // Rota pública para obter informações da loja tenante por UUID
  app.get('/loja/tenante/:loj_uuid', (requisicao, resposta) =>
    ControladorLojas.obterLojaPorUuid(requisicao, resposta),
  );

  // Criar loja (apenas admin mestre)
  app.post(
    '/admin/lojas',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    adminMestreOnlyMiddleware,
    (requisicao, resposta) => ControladorLojas.criarLoja(requisicao, resposta),
  );

  // Listar lojas (apenas admin)
  app.get(
    '/admin/lojas',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    (requisicao, resposta) => ControladorLojas.listarLojas(requisicao, resposta),
  );

  // Associar admin a loja (apenas admin mestre)
  app.post(
    '/admin/lojas/associar-admin',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    adminMestreOnlyMiddleware,
    (requisicao, resposta) => ControladorLojas.associarAdminALoja(requisicao, resposta),
  );
}
