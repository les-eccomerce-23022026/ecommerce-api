import type { Request } from 'express';
import { obterNomeCookieAuth } from '@/shared/constants/auth-cookie';

export function extrairTokenJwtDaRequisicao(req: Request): string | undefined {
  const nomeCookie = obterNomeCookieAuth();
  const tokenDoCookie = req.cookies?.[nomeCookie];
  if (typeof tokenDoCookie === 'string' && tokenDoCookie.length > 0) {
    return tokenDoCookie;
  }
  const { authorization } = req.headers;
  if (!authorization) {
    return undefined;
  }
  const [schema, tokenFromHeader] = authorization.split(' ');
  if (tokenFromHeader && schema === 'Bearer') {
    return tokenFromHeader;
  }
  return undefined;
}
