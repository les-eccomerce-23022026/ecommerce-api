import { Application } from 'express';
import { ControladorAutenticacao } from '@/modules/auth/auth.controller';

/**
 * Registra as rotas relacionadas à autenticação.
 */
export function registrarRotasAutenticacao(app: Application): void {
  app.post('/api/auth/login', (requisicao, resposta) =>
    ControladorAutenticacao.realizarLogin(requisicao, resposta),
  );
}

