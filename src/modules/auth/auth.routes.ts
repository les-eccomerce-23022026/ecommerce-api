import { IRouter } from 'express';
import { ControladorAutenticacao } from '@/modules/auth/auth.controller';

import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';

/**
 * Registra as rotas relacionadas à autenticação.
 */
export function registrarRotasAutenticacao(app: IRouter): void {
  app.post('/auth/login', (requisicao, resposta) =>
    ControladorAutenticacao.realizarLogin(requisicao, resposta),
  );

  app.get('/auth/me', autenticacaoMiddleware, (requisicao, resposta) =>
    ControladorAutenticacao.me(requisicao, resposta),
  );
}

