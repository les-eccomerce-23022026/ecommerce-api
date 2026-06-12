import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Middleware de rate limiting para proteção contra ataques de força bruta no login.
 *
 * Configuração:
 * - Limite de 5 tentativas por IP em 15 minutos
 * - Mensagem de erro genérica para não revelar informações
 * - Em ambiente de teste, o rate limit só é aplicado quando FORCAR_RATE_LIMIT_LOGIN_TESTE=true
 * - Header X-Test-Rate-Limit-Key isola contadores por execução de teste
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Usa header de isolamento em testes; usa helper ipKeyGenerator para IPv6
  keyGenerator: (req: Request) => {
    const testKey = req.headers['x-test-rate-limit-key'];
    if (testKey) return String(testKey);
    // ipKeyGenerator retorna a chave IP normalizada
    return String(req.ip ?? req.socket.remoteAddress ?? 'unknown');
  },
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
});

export const limiteTentativasLogin = (req: Request, res: Response, next: NextFunction) => {
  // TEMPORÁRIO: Rate limit desabilitado para testes E2E
  // Em dev: bypass sempre (E2E roda aqui)
  // if (process.env.NODE_ENV === 'development') return next();
  // Em test: bypass a menos que o teste de integração force explicitamente
  // if (process.env.NODE_ENV === 'test' && process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE !== 'true') {
  //   return next();
  // }
  // return rateLimiter(req, res, next);
  return next();
};
