import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { di } from '@/shared/infrastructure/di.container';
import { Logger } from '@/shared/utils/Logger.util';
import { extrairTokenJwtDaRequisicao } from '@/shared/middlewares/autenticacao-token.util';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { MENSAGENS_ERRO } from '@/shared/constants/mensagens-erro.constants';
import { servicoContextoLoja } from '@/shared/services/ServicoContextoLoja';

/**
 * Interface para payload decodificado do JWT.
 */
interface IJwtPayload {
  sub: string;
  email: string;
  role: string;
  lojas?: Array<{ loj_id: number; loj_uuid: string }>;
  loja_uuid_principal?: string;
  ip?: string;
  fingerprint?: string;
}

/**
 * Middleware para autenticação via JWT no header Authorization Bearer.
 * Anexa as informações decodificadas do token ao objeto da requisição (req.usuario).
 * Define o contexto de requisição com loj_id atual para uso nos repositórios.
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * - Valida papéis do token vs banco para prevenir bypass
 * - Usa ServicoContextoLoja para centralizar lógica de tenant
 * - Remove duplicação de validação de loja
 * - Simplifica determinação de loj_id
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

    const decodificado = jwt.verify(token, segredo) as IJwtPayload;

    const usuario = await di.repoUsuarios.buscarPorUuid(decodificado.sub);
    if (!usuario) {
      Logger.error(`[auth] Usuário não encontrado no banco: ${decodificado.sub}`);
      res.status(401).json({
        mensagem: MENSAGENS_ERRO.USUARIO_NAO_ENCONTRADO,
        sucesso: false,
      });
      return;
    }

    // CORREÇÃO: Validar papéis do token vs banco para prevenir bypass
    // Se o token contiver array de papéis, validar contra o banco
    if (decodificado.lojas && Array.isArray(decodificado.lojas)) {
      const papeisBanco = new Set(usuario.papeis.map(p => p.descricao));
      
      // Verificar se o role principal do token está no banco
      if (!papeisBanco.has(decodificado.role)) {
        Logger.warn(`[auth] Papel no token não corresponde ao banco. Token: ${decodificado.role}, Banco: ${Array.from(papeisBanco).join(', ')}`);
        res.status(401).json({
          mensagem: 'Token inválido: papel não autorizado.',
          sucesso: false,
        });
        return;
      }
    }

    // Validar IP e fingerprint (proteção contra replay attack)
    // Desabilitado em desenvolvimento para facilitar automação de testes
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;
    const fingerprint = userAgent ? require('crypto').createHash('sha256').update(userAgent).digest('hex') : undefined;

    if (process.env.NODE_ENV !== 'development' && decodificado.ip && ipAddress && decodificado.ip !== ipAddress) {
      Logger.warn(`[auth] IP mismatch. Esperado: ${decodificado.ip}, Recebido: ${ipAddress}`);
      res.status(401).json({
        mensagem: 'IP não corresponde ao original. Por segurança, faça login novamente.',
        sucesso: false,
      });
      return;
    }

    if (process.env.NODE_ENV !== 'development' && decodificado.fingerprint && fingerprint && decodificado.fingerprint !== fingerprint) {
      Logger.warn(`[auth] Fingerprint mismatch. Esperado: ${decodificado.fingerprint}, Recebido: ${fingerprint}`);
      res.status(401).json({
        mensagem: 'Dispositivo não reconhecido. Por segurança, faça login novamente.',
        sucesso: false,
      });
      return;
    }

    // CORREÇÃO: Usar ServicoContextoLoja para determinar loj_id
    // Isso elimina duplicação de código com contextoLojaMiddleware
    let loj_id_atual: number;
    
    const loj_uuid_header = req.headers['x-loja-uuid'] as string | undefined;
    const loj_uuid_cookie = req.cookies?.['x-loja-uuid'] as string | undefined;
    
    if (decodificado.lojas && decodificado.lojas.length > 0) {
      // Se o token tem lojas, validar se o header/cookie corresponde a uma loja acessível
      if (loj_uuid_header || loj_uuid_cookie) {
        const loj_uuid_contexto = loj_uuid_header || loj_uuid_cookie;
        if (!loj_uuid_contexto) {
          // Se por algum motivo for undefined, usar loja principal do token
          loj_id_atual = decodificado.lojas[0].loj_id;
        } else {
          const loj_id_validado = await servicoContextoLoja.validarLojaAcessivel(loj_uuid_contexto, decodificado.lojas);
        
          if (loj_id_validado === null) {
            Logger.warn(`[auth] Usuário tentando acessar loja não autorizada: ${loj_uuid_contexto}`);
            res.status(403).json({
              mensagem: 'Acesso não autorizado a esta loja.',
              sucesso: false,
            });
            return;
          }
        
          loj_id_atual = loj_id_validado;
        }
      } else {
        // Usar loja principal do token
        loj_id_atual = decodificado.lojas[0].loj_id;
      }
    } else {
      // CORREÇÃO: Se o token não tem lojas (JWT minimalista), usar ServicoContextoLoja
      const resultado = await servicoContextoLoja.determinarContextoLoja(loj_uuid_header, loj_uuid_cookie);
      
      if (!resultado.valido) {
        // Em desenvolvimento/teste, usar loja_id = 1 como fallback para não bloquear E2E
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          Logger.warn(`[auth] Erro ao determinar contexto (${resultado.erro}), usando fallback loj_id=1 para dev/test`);
          loj_id_atual = 1;
        } else {
          Logger.error(`[auth] Erro ao determinar contexto: ${resultado.erro}`);
          res.status(500).json({
            mensagem: 'Erro ao determinar contexto de loja.',
            sucesso: false,
          });
          return;
        }
      } else {
        loj_id_atual = resultado.loj_id;
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

      // CORREÇÃO: Atualizar o contexto existente (criado pelo contextoLojaMiddleware) com informações de autenticação
      // em vez de sobrescrever com run()
      const contextoExistente = ContextoRequisicao.obterContexto();
      if (contextoExistente) {
        // Contexto já existe (criado por contextoLojaMiddleware), apenas atualiza
        ContextoRequisicao.definirContexto({
          ...contextoExistente,
          usu_id: usuario.id,
          usu_uuid: usuario.uuid,
          papeis: req.usuario.papeis,
        });
        next();
      } else {
        // CORREÇÃO: Fallback simplificado - se não houver contexto, cria um novo
        // Isso não deveria acontecer se contextoLojaMiddleware for usado corretamente
        ContextoRequisicao.asyncLocalStorage.run(
          {
            loj_id: loj_id_atual,
            usu_id: usuario.id,
            usu_uuid: usuario.uuid,
            papeis: req.usuario.papeis,
          },
          () => {
            next();
          }
        );
      }
  } catch (erro) {
    Logger.error('[auth] Erro na verificação do token:', erro instanceof Error ? erro.message : String(erro));
    res.status(401).json({
      mensagem: 'Token inválido ou expirado.',
      sucesso: false,
    });
  }
}
