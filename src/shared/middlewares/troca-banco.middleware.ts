import { Request, Response, NextFunction } from 'express';
import { contextoBanco, TipoAmbienteBanco } from '../infrastructure/database/ContextoBanco';

/**
 * Middleware para identificar se a requisição deve usar o banco de testes.
 * Verifica o cabeçalho 'x-use-test-db'. Se presente e for 'true', muda o contexto.
 */
export const middlewareTrocaBanco = (req: Request, _res: Response, next: NextFunction): void => {
  const usarBancoTeste = req.headers['x-use-test-db'] === 'true';
  const ambiente: TipoAmbienteBanco = usarBancoTeste ? 'teste' : 'producao';

  // O run() garante que todo o fluxo assíncrono desta requisição tenha acesso ao contexto
  contextoBanco.run(ambiente, () => {
    next();
  });
};
