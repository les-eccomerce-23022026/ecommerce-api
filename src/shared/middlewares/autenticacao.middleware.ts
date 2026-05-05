import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { di } from '@/shared/infrastructure/di.container';
import { Logger } from '@/shared/utils/Logger.util';
import { extrairTokenJwtDaRequisicao } from '@/shared/middlewares/autenticacao-token.util';

/**
 * Middleware para autenticação via JWT no header Authorization Bearer.
 * Anexa as informações decodificadas do token ao objeto da requisição (req.usuario).
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
      isAdminMestre?: boolean;
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

    req.usuario = {
      uuid: decodificado.sub,
      id: usuario.id,
      email: decodificado.email,
      role: decodificado.role,
      isAdminMestre: decodificado.isAdminMestre,
    };

    next();
  } catch (erro) {
    Logger.error('[auth] Erro na verificação do token:', erro instanceof Error ? erro.message : String(erro));
    res.status(401).json({
      mensagem: 'Token inválido ou expirado.',
      sucesso: false,
    });
  }
}
