import { Request, Response, NextFunction } from 'express';
import { PAPEL_ADMIN, PAPEL_CLIENTE, PAPEL_ADMIN_SISTEMA } from '../types/papeis';

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

/** Verifica se o usuário da requisição possui papel de administrador. */
export function usuarioTemPapelAdmin(usuario: { papeis?: unknown[]; role?: unknown } | undefined): boolean {
  if (!usuario) {
    return false;
  }
  const temPapel = possuiPapel(usuario, PAPEL_ADMIN.descricao);
  if (process.env.NODE_ENV === 'test' && temPapel) {
    console.log(`[DEBUG-AUTH] Usuário TEM papel admin. Role: ${JSON.stringify(usuario.role)}, Papeis: ${JSON.stringify(usuario.papeis)}`);
  }
  return temPapel;
}

/**
 * Verifica se o usuário é admin sistema.
 * Verifica se o usuário possui o papel admin_sistema.
 */
export function usuarioEhAdminSistema(usuario: { papeis?: unknown[]; role?: unknown } | undefined): boolean {
  if (!usuario) {
    return false;
  }
  return possuiPapel(usuario, PAPEL_ADMIN_SISTEMA.descricao);
}

/**
 * Middleware para garantir que o usuário autenticado tenha permissões de Administrador.
 */
export function adminOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;

  if (!usuarioTemPapelAdmin(usuario)) {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita a administradores.',
      sucesso: false,
    });
    return;
  }

  next();
}

/**
 * Middleware para garantir que o usuário autenticado seja Administrador do Sistema.
 * Rotas exclusivas como criar lojas, gerenciar administradores.
 */
export function adminSistemaOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;

  if (!usuarioEhAdminSistema(usuario)) {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita ao Administrador do Sistema.',
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

  // Um usuário pode ter múltiplos papéis (cliente + admin)
  if (!usuario || !(possuiPapel(usuario, PAPEL_CLIENTE.descricao) || possuiPapel(usuario, PAPEL_ADMIN.descricao))) {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita a clientes.',
      sucesso: false,
    });
    return;
  }

  next();
}
