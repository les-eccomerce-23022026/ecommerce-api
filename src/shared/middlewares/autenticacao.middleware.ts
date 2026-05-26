import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { di } from '@/shared/infrastructure/di.container';
import { Logger } from '@/shared/utils/Logger.util';
import { extrairTokenJwtDaRequisicao } from '@/shared/middlewares/autenticacao-token.util';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

/**
 * Middleware para autenticação via JWT no header Authorization Bearer.
 * Anexa as informações decodificadas do token ao objeto da requisição (req.usuario).
 * Define o contexto de requisição com loj_id atual para uso nos repositórios.
 * 
 * IMPORTANTE: Usa AsyncLocalStorage.run() para garantir que o contexto seja propagado
 * corretamente através das chamadas assíncronas subsequentes (repositórios, serviços, etc).
 */
export async function autenticacaoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extrairTokenJwtDaRequisicao(req);

  if (!token) {
    res.status(401).json({
      mensagem: 'Token não fornecido.',
      sucesso: false,
    });
    return;
  }

  try {
    const segredo = process.env.JWT_SEGREDO;
    if (!segredo) {
      throw new Error('Configuração de JWT ausente.');
    }

    const decodificado = jwt.verify(token, segredo) as {
      sub: string;
      email: string;
      role: string;
      lojas?: Array<{ loj_id: number; loj_uuid: string }>;
      loja_uuid_principal?: string;
      ip?: string;
      fingerprint?: string;
    };

    const usuario = await di.repoUsuarios.buscarPorUuid(decodificado.sub);
    if (!usuario) {
      Logger.error(`[auth] Usuário não encontrado no banco: ${decodificado.sub}`);
      res.status(401).json({
        mensagem: 'Usuário não encontrado.',
        sucesso: false,
      });
      return;
    }

    // Validar IP e fingerprint (proteção contra replay attack)
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;
    const fingerprint = userAgent ? require('crypto').createHash('sha256').update(userAgent).digest('hex') : undefined;

    if (decodificado.ip && ipAddress && decodificado.ip !== ipAddress) {
      Logger.warn(`[auth] IP mismatch. Esperado: ${decodificado.ip}, Recebido: ${ipAddress}`);
      res.status(401).json({
        mensagem: 'IP não corresponde ao original. Por segurança, faça login novamente.',
        sucesso: false,
      });
      return;
    }

    if (decodificado.fingerprint && fingerprint && decodificado.fingerprint !== fingerprint) {
      Logger.warn(`[auth] Fingerprint mismatch. Esperado: ${decodificado.fingerprint}, Recebido: ${fingerprint}`);
      res.status(401).json({
        mensagem: 'Dispositivo não reconhecido. Por segurança, faça login novamente.',
        sucesso: false,
      });
      return;
    }

    // Determinar loj_id atual: do header x-loja-uuid, cookie x-loja-uuid, ou usar loja principal
    const loj_uuid_header = req.headers['x-loja-uuid'] as string | undefined;
    const loj_uuid_cookie = req.cookies?.['x-loja-uuid'] as string | undefined;
    const loj_uuid_contexto = loj_uuid_header || loj_uuid_cookie;
    let loj_id_atual: number;
    
    if (loj_uuid_contexto) {
      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(loj_uuid_contexto)) {
        Logger.warn(`[auth] loj_uuid inválido: ${loj_uuid_contexto}`);
        res.status(400).json({
          mensagem: 'loj_uuid inválido.',
          sucesso: false,
        });
        return;
      }
      
      // Validar se loj_uuid está no array de lojas acessíveis
      const loja_acessivel = decodificado.lojas?.find(l => l.loj_uuid === loj_uuid_contexto);
      if (!loja_acessivel) {
        Logger.warn(`[auth] Usuário tentando acessar loja não autorizada: ${loj_uuid_contexto}`);
        res.status(403).json({
          mensagem: 'Acesso não autorizado a esta loja.',
          sucesso: false,
        });
        return;
      }
      
      loj_id_atual = loja_acessivel.loj_id;
    } else {
      // Usar loja principal do token ou loja padrão
      if (decodificado.loja_uuid_principal) {
        const loja_principal = decodificado.lojas?.find(l => l.loj_uuid === decodificado.loja_uuid_principal);
        if (loja_principal) {
          loj_id_atual = loja_principal.loj_id;
        } else {
          const defaultLojaId = process.env.DEFAULT_LOJA_ID;
          if (!defaultLojaId) {
            Logger.error('[auth] Variável de ambiente DEFAULT_LOJA_ID é obrigatória quando loja_uuid_principal não está definido');
            throw new Error('Variável de ambiente DEFAULT_LOJA_ID é obrigatória');
          }
          loj_id_atual = parseInt(defaultLojaId);
        }
      } else {
        const defaultLojaId = process.env.DEFAULT_LOJA_ID;
        if (!defaultLojaId) {
          Logger.error('[auth] Variável de ambiente DEFAULT_LOJA_ID é obrigatória quando loja_uuid_principal não está definido');
          throw new Error('Variável de ambiente DEFAULT_LOJA_ID é obrigatória');
        }
        loj_id_atual = parseInt(defaultLojaId);
      }
    }

    req.usuario = {
        uuid: decodificado.sub,
        id: usuario.id,
        email: decodificado.email,
        role: decodificado.role,
        papeis: (usuario.papeis ?? []).map((p) => p.descricao).filter(Boolean),
        lojas: decodificado.lojas || [{ loj_id: loj_id_atual, loj_uuid: '' }],
        loja_uuid_principal: decodificado.loja_uuid_principal || '',
        loj_id_atual: loj_id_atual,
      };

      if (process.env.NODE_ENV === 'test') {
        console.log(`[DEBUG-AUTH-MID] Autenticado: ${req.usuario.email}, Role: ${req.usuario.role}, Papeis: ${JSON.stringify(req.usuario.papeis)}`);
      }

      // Usar run() para criar um novo contexto que será propagado através de chamadas assíncronas
      ContextoRequisicao.asyncLocalStorage.run(
        {
          loj_id: loj_id_atual,
          usu_id: usuario.id,
          usu_uuid: usuario.uuid,
        },
        () => {
          next();
        }
      );
  } catch (erro) {
    Logger.error('[auth] Erro na verificação do token:', erro instanceof Error ? erro.message : String(erro));
    res.status(401).json({
      mensagem: 'Token inválido ou expirado.',
      sucesso: false,
    });
  }
}
