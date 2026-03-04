import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware para autenticação via JWT no header Authorization Bearer.
 * Anexa as informações decodificadas do token ao objeto da requisição (req.usuario).
 */
export async function autenticacaoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { authorization } = req.headers;
  const tokenCookie = req.cookies?.token;

  let token: string | undefined;

  // Verificar primeiro no header Authorization Bearer
  if (authorization) {
    const [schema, tokenFromHeader] = authorization.split(' ');

    if (tokenFromHeader && schema === 'Bearer') {
      token = tokenFromHeader;
    }
  }

  // Se não encontrou no header, verificar no cookie
  if (!token && tokenCookie) {
    token = tokenCookie;
  }

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

    const decodificado = jwt.verify(token, segredo) as { sub: string; role: string };

    req.usuario = {
      uuid: decodificado.sub,
      role: decodificado.role,
    };

    next();
  } catch {
    res.status(401).json({
      mensagem: 'Token inválido ou expirado.',
      sucesso: false,
    });
  }
}
