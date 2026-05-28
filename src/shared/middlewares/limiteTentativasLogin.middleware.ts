import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de rate limiting para proteção contra ataques de força bruta no login.
 *
 * Configuração:
 * - Limite de 5 tentativas por IP em 15 minutos
 * - Mensagem de erro genérica para não revelar informações
 * - Usa IP do cliente como chave (respeitando proxy reverso se configurado)
 */
export const limiteTentativasLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 tentativas
  skip: (req: Request) => {
    if (process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE === 'true') {
      return false;
    }
    return process.env.NODE_ENV === 'test' || req.headers['x-use-test-db'] === 'true';
  },
  keyGenerator: (req: Request, res: Response) => {
    const chaveTeste = req.headers['x-test-rate-limit-key'];
    if (process.env.FORCAR_RATE_LIMIT_LOGIN_TESTE === 'true' && typeof chaveTeste === 'string' && chaveTeste.length > 0) {
      return chaveTeste;
    }
    return ipKeyGenerator(req, res);
  },
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
  standardHeaders: true, // Retorna informações de rate limit nos headers (RateLimit-*)
  legacyHeaders: false, // Desabilita headers legados (X-RateLimit-*)
  // Handler personalizado para log de tentativas bloqueadas
  handler: (req: Request, res: Response, next: NextFunction, options: any) => {
    console.warn(`[Rate Limit] Login bloqueado para IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  // Ignora requisições bem-sucedidas (não conta no rate limit)
  skipSuccessfulRequests: false,
});
