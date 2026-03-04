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

/**
 * Middleware para garantir que o usuário autenticado seja um Cliente.
 */
export function clienteOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;

  if (!usuario || usuario.role !== 'cliente') {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita a clientes.',
      sucesso: false,
    });
    return;
  }

  next();
}
