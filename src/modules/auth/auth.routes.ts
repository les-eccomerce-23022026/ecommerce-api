import { IRouter } from 'express';
import { ControladorAutenticacao } from '@/modules/auth/auth.controller';

import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { limiteTentativasLogin } from '@/shared/middlewares/limiteTentativasLogin.middleware';

/**
 * Registra as rotas relacionadas à autenticação.
 */
export function registrarRotasAutenticacao(app: IRouter): void {
  app.post('/auth/login', limiteTentativasLogin, (requisicao, resposta) =>
    ControladorAutenticacao.realizarLogin(requisicao, resposta),
  );

  app.post('/auth/logout', (requisicao, resposta) =>
    ControladorAutenticacao.encerrarSessao(requisicao, resposta),
  );

  app.post('/auth/refresh', (requisicao, resposta) =>
    ControladorAutenticacao.renovarToken(requisicao, resposta),
  );

  app.get('/auth/me', autenticacaoMiddleware, (requisicao, resposta) =>
    ControladorAutenticacao.me(requisicao, resposta),
  );
}

