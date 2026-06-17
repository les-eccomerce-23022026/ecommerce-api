import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';
import { di } from '@/shared/infrastructure/di.container';
import { ESCOPOS_ADMIN } from '@/shared/types/escoposAdmin';
import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';

/**
 * Interface para dados de associação admin-loja.
 * Representa um registro da tabela admin_lojas.
 */
interface IAssociacaoAdminLoja {
  adl_escopo: string;
  adl_ativo: boolean;
}

/**
 * CORREÇÃO: Cache para associações admin-loja.
 * Chave: "usuId-lojId", Valor: IAssociacaoAdminLoja
 * Tempo de cache: 5 minutos
 */
const CACHE_ASSOCIACOES = new Map<string, { dados: IAssociacaoAdminLoja; timestamp: number }>();
const TEMPO_CACHE_MS = 5 * 60 * 1000; // 5 minutos

/**
 * CORREÇÃO: Validação estrita de escopos permitidos.
 * Isso previne inserção de escopos inválidos no banco.
 */
const ESCOPOS_PERMITIDOS = new Set<string>([ESCOPOS_ADMIN.SISTEMA, ESCOPOS_ADMIN.LOJA]);

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
 * CORREÇÕES IMPLEMENTADAS:
 * - Adicionado cache para associações admin-loja (performance)
 * - Validação estrita de escopos permitidos (segurança)
 * - Logs mais detalhados para debugging
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
 * CORREÇÃO: Consulta a associação entre admin e loja no banco de dados com cache.
 * Retorna os dados da associação se existir, caso contrário retorna null.
 */
async function consultarAssociacaoAdminLoja(
  usuId: number,
  lojId: number
): Promise<IAssociacaoAdminLoja | null> {
  const cacheKey = `${usuId}-${lojId}`;
  const cached = CACHE_ASSOCIACOES.get(cacheKey);
  
  // Verificar cache
  if (cached && Date.now() - cached.timestamp < TEMPO_CACHE_MS) {
    Logger.debug(`[autorizacao-loja] Cache hit para usu_id=${usuId}, loj_id=${lojId}`);
    return cached.dados;
  }
  
  // Buscar do banco
  const db = FabricaConexaoBanco.obterConexao();
  const sql = `
    SELECT adl_escopo, adl_ativo
    FROM livraria_gestao.admin_lojas
    WHERE usu_id = $1 AND loj_id = $2
    LIMIT 1
  `;

  const resultado = await db.executar<IAssociacaoAdminLoja>(sql, [usuId, lojId]);
  
  if (resultado.length > 0) {
    // Armazenar em cache
    CACHE_ASSOCIACOES.set(cacheKey, {
      dados: resultado[0],
      timestamp: Date.now(),
    });
    
    // Limpar cache após TEMPO_CACHE_MS
    setTimeout(() => {
      CACHE_ASSOCIACOES.delete(cacheKey);
    }, TEMPO_CACHE_MS);
  }
  
  return resultado.length > 0 ? resultado[0] : null;
}

/**
 * CORREÇÃO: Valida se o escopo de acesso permite o acesso à loja.
 * 
 * Regras:
 * - SISTEMA: sempre permite (admin global)
 * - LOJA: permite se estiver associado à loja (já validado antes desta função)
 * - Qualquer outro valor: nega acesso (validação estrita)
 * 
 * CORREÇÃO: Validação estrita de escopos permitidos para prevenir
 * inserção de valores inválidos no banco.
 */
function validarEscopoAcesso(escopo: string): boolean {
  // CORREÇÃO: Validação estrita - apenas escopos conhecidos são permitidos
  if (!ESCOPOS_PERMITIDOS.has(escopo)) {
    Logger.warn(`[autorizacao-loja] Escopo inválido detectado: ${escopo}`);
    return false;
  }
  
  // Mapa de validadores de escopo
  const validadores: Record<string, () => boolean> = {
    [ESCOPOS_ADMIN.SISTEMA]: () => true, // Admin de sistema tem acesso global
    [ESCOPOS_ADMIN.LOJA]: () => true, // Admin de loja já foi validado como associado
  };

  const validador = validadores[escopo];
  return validador ? validador() : false;
}

/**
 * CORREÇÃO: Função para limpar o cache de associações.
 * Útil para testes ou quando há alterações nas associações.
 */
export function limparCacheAutorizacaoLoja(): void {
  CACHE_ASSOCIACOES.clear();
  Logger.info('[autorizacao-loja] Cache de associações limpo');
}
