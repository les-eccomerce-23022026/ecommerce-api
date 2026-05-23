import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';
import { di } from '@/shared/infrastructure/di.container';

/**
 * Middleware opcional para definir o contexto de loja quando o header x-loja-uuid está presente.
 * Não exige autenticação, apenas lê o header e define o contexto para uso nos repositórios.
 * 
 * IMPORTANTE: Usa AsyncLocalStorage.run() para garantir que o contexto seja propagado
 * corretamente através das chamadas assíncronas subsequentes (repositórios, serviços, etc).
 * 
 * Estratégia:
 * - Externamente: usa loj_uuid (UUID) no header x-loja-uuid
 * - Internamente: converte UUID para loj_id para uso nos repositórios
 * - Se não houver header: usa fallback para loj_id = 1 (loja padrão)
 */
export async function contextoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const loja_uuid_header = req.headers['x-loja-uuid'] as string | undefined;
  const loja_uuid_cookie = req.cookies?.['x-loja-uuid'] as string | undefined;
  const loja_uuid_contexto = loja_uuid_header || loja_uuid_cookie;
  
  console.log(`[contexto-loja] Middleware chamado. x-loja-uuid header: ${loja_uuid_header}, cookie: ${loja_uuid_cookie}`);
  Logger.info(`[contexto-loja] Middleware chamado. x-loja-uuid header: ${loja_uuid_header}, cookie: ${loja_uuid_cookie}`);
  
  // Fallback para loja padrão quando não há header ou cookie
  if (!loja_uuid_contexto) {
    return definirContextoEContinuar(1);
  }
  
  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(loja_uuid_contexto)) {
    Logger.warn(`[contexto-loja] loj_uuid inválido: ${loja_uuid_contexto}`);
    return definirContextoEContinuar(1);
  }
  
  // Converter UUID para ID interno
  const idInterno = await di.repoLojas.obterIdInternoPorUuid(loja_uuid_contexto);
  if (idInterno === null) {
    Logger.warn(`[contexto-loja] Loja não encontrada para UUID: ${loja_uuid_contexto}`);
    return definirContextoEContinuar(1);
  }
  
  return definirContextoEContinuar(idInterno);
  
  function definirContextoEContinuar(loj_id: number): void {
    ContextoRequisicao.asyncLocalStorage.run(
      {
        loj_id,
        usu_id: undefined,
        usu_uuid: undefined,
      },
      () => {
        console.log(`[contexto-loja] Contexto definido com loj_id=${loj_id}, chamando next()`);
        next();
      }
    );
  }
}
