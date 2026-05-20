import rateLimit from 'express-rate-limit';
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
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
  standardHeaders: true, // Retorna informações de rate limit nos headers (RateLimit-*)
  legacyHeaders: false, // Desabilita headers legados (X-RateLimit-*)
  // Usa IP real do cliente (respeitando proxy reverso)
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // Handler personalizado para log de tentativas bloqueadas
  handler: (req: Request, res: Response, next: NextFunction, options: any) => {
    console.warn(`[Rate Limit] Login bloqueado para IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  // Ignora requisições bem-sucedidas (não conta no rate limit)
  skipSuccessfulRequests: false,
});
