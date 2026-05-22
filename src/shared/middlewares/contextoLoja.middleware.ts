import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Middleware opcional para definir o contexto de loja quando o header x-loja-id está presente.
 * Não exige autenticação, apenas lê o header e define o contexto para uso nos repositórios.
 * 
 * IMPORTANTE: Usa AsyncLocalStorage.run() para garantir que o contexto seja propagado
 * corretamente através das chamadas assíncronas subsequentes (repositórios, serviços, etc).
 * 
 * Estratégia:
 * - Externamente: usa loj_id (número) no header x-loja-id
 * - Internamente: usa loj_id diretamente para uso nos repositórios
 * - Se não houver header: usa fallback para loj_id = 1 (loja padrão)
 */
export function contextoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const loj_id_header = req.headers['x-loja-id'] as string | undefined;
  const loj_id_cookie = req.cookies?.['x-loja-id'] as string | undefined;
  const loj_id_contexto = loj_id_header || loj_id_cookie;
  
  console.log(`[contexto-loja] Middleware chamado. x-loja-id header: ${loj_id_header}, cookie: ${loj_id_cookie}`);
  Logger.info(`[contexto-loja] Middleware chamado. x-loja-id header: ${loj_id_header}, cookie: ${loj_id_cookie}`);
  
  let loj_id: number;
  
  if (loj_id_contexto) {
    const loj_id_num = parseInt(loj_id_contexto);
    if (isNaN(loj_id_num)) {
      Logger.warn(`[contexto-loja] loj_id inválido: ${loj_id_contexto}`);
      loj_id = 1; // Fallback para loja padrão
    } else {
      loj_id = loj_id_num;
    }
  } else {
    loj_id = 1; // Loja padrão quando não há header ou cookie
  }
  
  // Usar run() para criar um novo contexto que será propagado através de chamadas assíncronas
  ContextoRequisicao.asyncLocalStorage.run(
    {
      loj_id: loj_id,
      usu_id: undefined,
      usu_uuid: undefined,
    },
    () => {
      console.log(`[contexto-loja] Contexto definido com loj_id=${loj_id}, chamando next()`);
      next();
    }
  );
}
