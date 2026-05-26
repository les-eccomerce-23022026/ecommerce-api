import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';
import { di } from '@/shared/infrastructure/di.container';
import { ESCOPOS_ADMIN } from '@/shared/types/escoposAdmin';

/**
 * Interface para dados de associação admin-loja.
 * Representa um registro da tabela admin_lojas.
 */
interface IAssociacaoAdminLoja {
  adl_escopo: string;
  adl_ativo: boolean;
}

/**
 * Middleware de autorização por loja.
 * 
 * Valida se um administrador autenticado tem permissão para acessar a loja solicitada.
 * 
 * Regras de autorização:
 * - Se escopo = 'SISTEMA': permite acesso a qualquer loja
 * - Se escopo = 'LOJA': permite apenas se admin estiver associado à loja
 * - Admin deve estar ativo (adl_ativo = true)
 * 
 * Retorna:
 * - 401: Usuário não autenticado (usu_id ausente no contexto)
 * - 403: Usuário não tem acesso à loja solicitada
 * - 404: Loja não encontrada
 * 
 * IMPORTANTE: Este middleware deve ser usado APÓS autenticacaoMiddleware
 * e contextoLojaMiddleware para garantir que o contexto esteja preenchido.
 */
export async function autorizacaoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Obter contexto da requisição (definido por middlewares anteriores)
    const contexto = ContextoRequisicao.obterContexto();
    const usuId = contexto?.usu_id;
    const lojId = contexto?.loj_id;
    const lojUuid = contexto?.loj_uuid;

    // Validar se usuário está autenticado
    if (!usuId) {
      Logger.warn('[autorizacao-loja] Usuário não autenticado (usu_id ausente no contexto)');
      res.status(401).json({
        mensagem: 'Usuário não autenticado.',
        sucesso: false,
      });
      return;
    }

    // Validar se loja foi selecionada no contexto
    if (!lojId || !lojUuid) {
      Logger.warn('[autorizacao-loja] Loja não selecionada (loj_id ou loj_uuid ausente no contexto)');
      res.status(400).json({
        mensagem: 'Loja não selecionada.',
        sucesso: false,
      });
      return;
    }

    // Verificar se loja existe (usando loj_uuid do contexto)
    const lojaExiste = await di.repoLojas.buscarPorUuid(lojUuid);
    if (!lojaExiste) {
      Logger.warn(`[autorizacao-loja] Loja não encontrada: ${lojUuid}`);
      res.status(404).json({
        mensagem: 'Loja não encontrada.',
        sucesso: false,
      });
      return;
    }

    // Consultar associação admin-loja no banco de dados (usando loj_id)
    const associacao = await consultarAssociacaoAdminLoja(usuId, lojId);

    // Se não houver associação, negar acesso
    if (!associacao) {
      Logger.warn(
        `[autorizacao-loja] Admin sem associação à loja. usu_id=${usuId}, loj_id=${lojId}`
      );
      res.status(403).json({
        mensagem: 'Você não tem permissão para acessar esta loja.',
        sucesso: false,
      });
      return;
    }

    // Validar se associação está ativa
    if (!associacao.adl_ativo) {
      Logger.warn(
        `[autorizacao-loja] Associação admin-loja inativa. usu_id=${usuId}, loj_id=${lojId}`
      );
      res.status(403).json({
        mensagem: 'Seu acesso a esta loja foi desativado.',
        sucesso: false,
      });
      return;
    }

    // Validar escopo de acesso
    const temAcesso = validarEscopoAcesso(associacao.adl_escopo);
    if (!temAcesso) {
      Logger.warn(
        `[autorizacao-loja] Escopo inválido ou insuficiente. usu_id=${usuId}, loj_id=${lojId}, escopo=${associacao.adl_escopo}`
      );
      res.status(403).json({
        mensagem: 'Você não tem permissão para acessar esta loja.',
        sucesso: false,
      });
      return;
    }

    Logger.info(
      `[autorizacao-loja] Acesso autorizado. usu_id=${usuId}, loj_id=${lojId}, escopo=${associacao.adl_escopo}`
    );
    next();
  } catch (erro) {
    Logger.error(
      '[autorizacao-loja] Erro ao validar autorização:',
      erro instanceof Error ? erro.message : String(erro)
    );
    res.status(500).json({
      mensagem: 'Erro ao validar autorização.',
      sucesso: false,
    });
  }
}

/**
 * Consulta a associação entre admin e loja no banco de dados.
 * Retorna os dados da associação se existir, caso contrário retorna null.
 */
async function consultarAssociacaoAdminLoja(
  usuId: number,
  lojId: number
): Promise<IAssociacaoAdminLoja | null> {
  const sql = `
    SELECT adl_escopo, adl_ativo
    FROM livraria_gestao.admin_lojas
    WHERE usu_id = $1 AND loj_id = $2
    LIMIT 1
  `;

  const resultado = await di.db.executar<IAssociacaoAdminLoja>(sql, [usuId, lojId]);
  return resultado.length > 0 ? resultado[0] : null;
}

/**
 * Valida se o escopo de acesso permite o acesso à loja.
 * 
 * Regras:
 * - SISTEMA: sempre permite (admin global)
 * - LOJA: permite se estiver associado à loja (já validado antes desta função)
 * - Qualquer outro valor: nega acesso
 */
function validarEscopoAcesso(escopo: string): boolean {
  // Mapa de validadores de escopo
  const validadores: Record<string, () => boolean> = {
    [ESCOPOS_ADMIN.SISTEMA]: () => true, // Admin de sistema tem acesso global
    [ESCOPOS_ADMIN.LOJA]: () => true, // Admin de loja já foi validado como associado
  };

  const validador = validadores[escopo];
  return validador ? validador() : false;
}
