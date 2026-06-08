import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';
import { servicoContextoLoja, IResultadoContextoLoja } from '@/shared/services/ServicoContextoLoja';

/**
 * Middleware opcional para definir o contexto de loja quando o header x-loja-uuid está presente.
 * Não exige autenticação, apenas lê o header e define o contexto para uso nos repositórios.
 * 
 * IMPORTANTE: Usa AsyncLocalStorage.run() para garantir que o contexto seja propagado
 * corretamente através das chamadas assíncronas subsequentes (repositórios, serviços, etc).
 * 
 * Estratégia (SOLID + Clean Code):
 * - Externamente (API/frontend): usa loj_uuid (UUID) no header x-loja-uuid
 * - Internamente (repositórios): usa loj_id para performance (evita conversões repetidas)
 * - Contexto: armazena ambos loj_uuid (referência externa) e loj_id (uso interno)
 * - IDs internos NUNCA são expostos nas respostas da API (DTOs)
 * - Se não houver header: usa fallback para loja padrão
 * 
 * Refatoração: Usa ServicoContextoLoja para centralizar lógica de validação e conversão,
 * eliminando duplicação de código com autenticacaoMiddleware.
 */
export async function contextoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const loja_uuid_header = req.headers['x-loja-uuid'] as string | undefined;
  const loja_uuid_cookie = req.cookies?.['x-loja-uuid'] as string | undefined;
  
  Logger.info(`[contexto-loja] Middleware chamado. x-loja-uuid header: ${loja_uuid_header}, cookie: ${loja_uuid_cookie}`);
  
  // Usar serviço centralizado para determinar contexto
  const resultado = await servicoContextoLoja.determinarContextoLoja(loja_uuid_header, loja_uuid_cookie);
  
  if (!resultado.valido) {
    Logger.error(`[contexto-loja] Erro ao determinar contexto: ${resultado.erro}`);
    res.status(500).json({
      mensagem: 'Erro ao determinar contexto de loja.',
      sucesso: false,
    });
    return;
  }
  
  return definirContextoEContinuar(resultado.loj_uuid, resultado.loj_id);
  
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
}
