import { IRouter } from 'express';
import { ControladorAutenticacao } from '@/modules/auth/auth.controller';

/**
 * Registra as rotas relacionadas à autenticação.
 */
export function registrarRotasAutenticacao(app: IRouter): void {
  app.post('/auth/login', (requisicao, resposta) =>
    ControladorAutenticacao.realizarLogin(requisicao, resposta),
  );
}

