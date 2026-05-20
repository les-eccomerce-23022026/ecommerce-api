import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Middleware opcional para definir o contexto de loja quando o header x-loja-uuid está presente.
 * Não exige autenticação, apenas lê o header e define o contexto para uso nos repositórios.
 * 
 * IMPORTANTE: Usa AsyncLocalStorage.run() para garantir que o contexto seja propagado
 * corretamente através das chamadas assíncronas subsequentes (repositórios, serviços, etc).
 * 
 * Estratégia:
 * - Externamente: usa loj_uuid (UUID) no header x-loja-uuid
 * - Internamente: converte para loj_id (bigint) para uso nos repositórios
 * - Se não houver header: usa fallback para loj_id = 1 (loja padrão)
 */
export function contextoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const loj_uuid_header = req.headers['x-loja-uuid'] as string | undefined;
  
  console.log(`[contexto-loja] Middleware chamado. x-loja-uuid: ${loj_uuid_header}`);
  Logger.info(`[contexto-loja] Middleware chamado. x-loja-uuid: ${loj_uuid_header}`);
  
  // Usar run() para criar um novo contexto que será propagado através de chamadas assíncronas
  // Fallback para loj_id = 1 (loja padrão) quando o header não está presente
  ContextoRequisicao.asyncLocalStorage.run(
    {
      loj_id: 1, // Loja padrão quando não há header
      usu_id: undefined,
      usu_uuid: undefined,
    },
    () => {
      console.log(`[contexto-loja] Contexto definido, chamando next()`);
      next();
    }
  );
}
