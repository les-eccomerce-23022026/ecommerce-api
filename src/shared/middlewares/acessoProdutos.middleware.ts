import { Request, Response, NextFunction } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';
import { PAPEL_ADMIN, PAPEL_CLIENTE, PAPEL_ADMIN_SISTEMA } from '../types/papeis';

/**
 * Função auxiliar para obter descrição do papel de um item do array papeis.
 * Suporta ambos os formatos: string ou objeto com descricao.
 */
function obterDescricaoPapel(valor: unknown): string | undefined {
  if (typeof valor === 'string') {
    return valor;
  }
  if (valor && typeof valor === 'object' && 'descricao' in valor) {
    return String((valor as { descricao: string }).descricao);
  }
  return undefined;
}

/**
 * Verifica se o usuário possui um papel específico.
 * Suporta múltiplos papéis através do array papeis.
 * Aceita ambos os formatos: array de strings ou array de objetos com descricao.
 */
function possuiPapel(usuario: { papeis?: unknown[]; role?: unknown }, papel: string): boolean {
  if (usuario.papeis && Array.isArray(usuario.papeis)) {
    const temPapel = usuario.papeis.some((item) => obterDescricaoPapel(item) === papel);
    if (temPapel) {
      return true;
    }
  }

  return obterDescricaoPapel(usuario.role) === papel;
}

/**
 * Middleware para controle de acesso a produtos por tipo de usuário.
 * 
 * Regras de acesso:
 * - Clientes: acesso total a produtos de todas as lojas (filtro opcional via header x-loja-uuid)
 * - Admin sistema: acesso total a produtos de todas as lojas (sem filtro obrigatório)
 * - Admin tenant: acesso apenas aos produtos da sua loja (filtro obrigatório)
 * 
 * Estratégia:
 * - Para clientes e admin sistema: o contexto de loja é opcional (header x-loja-uuid)
 * - Para admin tenant: o contexto de loja é obrigatório (usa loja principal do usuário)
 * - O middleware define o contexto apropriado para uso nos repositórios
 */
export async function acessoProdutosMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { usuario } = req;
  
  // Se não há usuário autenticado, permitir acesso sem contexto (endpoint público)
  if (!usuario) {
    Logger.info('[acesso-produtos] Usuário não autenticado. Acesso público permitido.');
    ContextoRequisicao.asyncLocalStorage.run(
      {
        loj_id: undefined,
        loj_uuid: undefined,
        usu_id: undefined,
        usu_uuid: undefined,
      },
      () => {
        next();
      }
    );
    return;
  }

  // Verificar tipo de usuário e aplicar regras correspondentes
  const ehCliente = possuiPapel(usuario, PAPEL_CLIENTE.descricao);
  const ehAdminSistema = possuiPapel(usuario, PAPEL_ADMIN_SISTEMA.descricao);
  const ehAdminTenant = possuiPapel(usuario, PAPEL_ADMIN.descricao);

  // Clientes: acesso total, contexto de loja opcional via header
  if (ehCliente) {
    const lojUuidHeader = req.headers['x-loja-uuid'] as string | undefined;
    const lojUuidCookie = req.cookies?.['x-loja-uuid'] as string | undefined;
    const lojUuidContexto = lojUuidHeader || lojUuidCookie;
    
    if (lojUuidContexto) {
      // Validar se loj_uuid está no array de lojas acessíveis
      const lojaAcessivel = usuario.lojas?.find(l => l.loj_uuid === lojUuidContexto);
      if (lojaAcessivel) {
        Logger.info(`[acesso-produtos] Cliente acessando loja específica: ${lojUuidContexto}`);
        ContextoRequisicao.asyncLocalStorage.run(
          {
            loj_id: lojaAcessivel.loj_id,
            loj_uuid: lojaAcessivel.loj_uuid,
            usu_id: usuario.id,
            usu_uuid: usuario.uuid,
          },
          () => {
            next();
          }
        );
        return;
      }
    }
    
    // Cliente sem filtro de loja específica: acesso total
    Logger.info('[acesso-produtos] Cliente acessando catálogo completo (sem filtro de loja)');
    ContextoRequisicao.asyncLocalStorage.run(
      {
        loj_id: undefined,
        loj_uuid: undefined,
        usu_id: usuario.id,
        usu_uuid: usuario.uuid,
      },
      () => {
        next();
      }
    );
    return;
  }

  // Admin sistema: acesso total a todas as lojas
  if (ehAdminSistema) {
    const lojUuidHeader = req.headers['x-loja-uuid'] as string | undefined;
    const lojUuidCookie = req.cookies?.['x-loja-uuid'] as string | undefined;
    const lojUuidContexto = lojUuidHeader || lojUuidCookie;
    
    if (lojUuidContexto) {
      // Admin sistema pode acessar qualquer loja via header
      const lojaAcessivel = usuario.lojas?.find(l => l.loj_uuid === lojUuidContexto);
      if (lojaAcessivel) {
        Logger.info(`[acesso-produtos] Admin sistema acessando loja específica: ${lojUuidContexto}`);
        ContextoRequisicao.asyncLocalStorage.run(
          {
            loj_id: lojaAcessivel.loj_id,
            loj_uuid: lojaAcessivel.loj_uuid,
            usu_id: usuario.id,
            usu_uuid: usuario.uuid,
          },
          () => {
            next();
          }
        );
        return;
      }
    }
    
    // Admin sistema sem filtro: acesso total
    Logger.info('[acesso-produtos] Admin sistema acessando catálogo completo (sem filtro de loja)');
    ContextoRequisicao.asyncLocalStorage.run(
      {
        loj_id: undefined,
        loj_uuid: undefined,
        usu_id: usuario.id,
        usu_uuid: usuario.uuid,
      },
      () => {
        next();
      }
    );
    return;
  }

  // Admin tenant: acesso apenas à sua loja
  if (ehAdminTenant) {
    // Usar loja principal do usuário
    const lojaPrincipal = usuario.lojas?.find(l => l.loj_uuid === usuario.loja_uuid_principal);
    
    if (!lojaPrincipal) {
      Logger.error(`[acesso-produtos] Admin tenant sem loja principal configurada: ${usuario.uuid}`);
      res.status(403).json({
        mensagem: 'Administrador sem loja configurada. Entre em contato com o suporte.',
        sucesso: false,
      });
      return;
    }
    
    Logger.info(`[acesso-produtos] Admin tenant acessando apenas sua loja: ${lojaPrincipal.loj_uuid}`);
    ContextoRequisicao.asyncLocalStorage.run(
      {
        loj_id: lojaPrincipal.loj_id,
        loj_uuid: lojaPrincipal.loj_uuid,
        usu_id: usuario.id,
        usu_uuid: usuario.uuid,
      },
      () => {
        next();
      }
    );
    return;
  }

  // Usuário sem papel reconhecido: acesso público
  Logger.warn(`[acesso-produtos] Usuário sem papel reconhecido: ${usuario.uuid}`);
  ContextoRequisicao.asyncLocalStorage.run(
    {
      loj_id: undefined,
      loj_uuid: undefined,
      usu_id: usuario.id,
      usu_uuid: usuario.uuid,
    },
    () => {
      next();
    }
  );
}
