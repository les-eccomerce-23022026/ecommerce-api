import { Request, Response, NextFunction } from 'express';
import { contextoBanco, TipoAmbienteBanco, obterContextoAtual } from '../infrastructure/database/ContextoBanco';
import { Logger } from '../utils/Logger.util';

/**
 * Middleware para identificar se a requisição deve usar o banco de testes.
 * Verifica o cabeçalho 'x-use-test-db'. Se presente e for 'true', muda o contexto.
 */
export const middlewareTrocaBanco = (req: Request, _res: Response, next: NextFunction): void => {
  const headerBancoTeste = String(req.headers['x-use-test-db'] ?? '').trim().toLowerCase();
  const switchExplcitoHabilitado = process.env.ENABLE_TEST_DB_SWITCH === 'true';
  const usarBancoTeste = process.env.NODE_ENV === 'test'
    || (switchExplcitoHabilitado && headerBancoTeste === 'true');
  const ambiente: TipoAmbienteBanco = usarBancoTeste ? 'teste' : 'producao';

  const contextoExistente = obterContextoAtual();

  // Se já existe uma transação (ex: teste de integração), mantemos o contexto original.
  // Isso garante que a requisição supertest use a mesma conexão/transação do teste.
  if (contextoExistente?.transacao) {
    return next();
  }

  // O run() garante que todo o fluxo assíncrono desta requisição tenha acesso ao contexto
  return contextoBanco.run({ tipo: ambiente }, () => {
    if (process.env.NODE_ENV !== 'production') {
      Logger.debug('[troca-banco.middleware] Contexto de banco aplicado', {
        rota: req.path,
        metodo: req.method,
        ambiente,
        headerBancoTeste,
        switchExplcitoHabilitado,
      });
    }
    next();
  });
};
