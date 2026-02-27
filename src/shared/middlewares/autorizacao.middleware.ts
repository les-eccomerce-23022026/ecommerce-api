import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para garantir que o usuário autenticado tenha permissões de Administrador.
 */
export function adminOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;

  if (!usuario || usuario.role !== 'admin') {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita a administradores.',
      sucesso: false,
    });
    return;
  }

  next();
}
