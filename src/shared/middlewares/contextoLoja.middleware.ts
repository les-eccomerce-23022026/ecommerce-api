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
 * - Externamente (API/frontend): usa loj_uuid (UUID) no header x-loja-uuid
 * - Internamente (repositórios): converte loj_uuid para loj_id para performance
 * - Contexto: armazena ambos loj_uuid (referência externa) e loj_id (uso interno)
 * - Se não houver header: usa fallback para loja padrão (loj_id = 1)
 */
export async function contextoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const loja_uuid_header = req.headers['x-loja-uuid'] as string | undefined;
  const loja_uuid_cookie = req.cookies?.['x-loja-uuid'] as string | undefined;
  const loja_uuid_contexto = loja_uuid_header || loja_uuid_cookie;
  
  Logger.info(`[contexto-loja] Middleware chamado. x-loja-uuid header: ${loja_uuid_header}, cookie: ${loja_uuid_cookie}`);
  
  // Fallback para loja padrão quando não há header ou cookie
  if (!loja_uuid_contexto) {
    // Buscar UUID e ID da loja padrão (loj_id = 1)
    const { uuidPadrao, idPadrao } = await obterLojaPadrao();
    return definirContextoEContinuar(uuidPadrao, idPadrao);
  }
  
  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(loja_uuid_contexto)) {
    Logger.warn(`[contexto-loja] loj_uuid inválido: ${loja_uuid_contexto}`);
    const { uuidPadrao, idPadrao } = await obterLojaPadrao();
    return definirContextoEContinuar(uuidPadrao, idPadrao);
  }
  
  // Converter UUID para ID interno
  const idInterno = await di.repoLojas.obterIdInternoPorUuid(loja_uuid_contexto);
  if (idInterno === null) {
    Logger.warn(`[contexto-loja] Loja não encontrada para UUID: ${loja_uuid_contexto}`);
    const { uuidPadrao, idPadrao } = await obterLojaPadrao();
    return definirContextoEContinuar(uuidPadrao, idPadrao);
  }
  
  return definirContextoEContinuar(loja_uuid_contexto, idInterno);
  
  function definirContextoEContinuar(loj_uuid: string, loj_id: number): void {
    ContextoRequisicao.asyncLocalStorage.run(
      {
        loj_uuid,
        loj_id,
        usu_id: undefined,
        usu_uuid: undefined,
      },
      () => {
        Logger.info(`[contexto-loja] Contexto definido com loj_uuid=${loj_uuid}, loj_id=${loj_id}`);
        next();
      }
    );
  }

  async function obterLojaPadrao(): Promise<{ uuidPadrao: string; idPadrao: number }> {
    // Buscar UUID e ID da loja com loj_id = 1 (loja padrão)
    const sql = 'SELECT loj_uuid, loj_id FROM livraria_gestao.lojas WHERE loj_id = 1 LIMIT 1';
    const rows = await di.db.executar<{ loj_uuid: string; loj_id: number }>(sql, []);
    if (rows.length === 0) {
      throw new Error('Loja padrão (loj_id=1) não encontrada');
    }
    return {
      uuidPadrao: rows[0].loj_uuid,
      idPadrao: rows[0].loj_id,
    };
  }
}
