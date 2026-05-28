import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Middleware de limitação de requisições para rotas do serviço de recomendações.
 *
 * Protege o catálogo de sugestões contra uso abusivo e sobrecarga de infraestrutura.
 *
 * Configuração:
 * - Limite de 30 requisições por minuto por IP
 * - Headers de controle RFC 6585 habilitados (RateLimit-*)
 * - Desabilitado em ambiente de testes
 */
export const limiteRequisicaoIA = rateLimit({
  windowMs: 60 * 1000, // janela de 1 minuto
  max: 30,
  skip: (req: Request) => {
    // Desabilita em testes para não interferir em suítes automatizadas
    return process.env.NODE_ENV === 'test' || req.headers['x-use-test-db'] === 'true';
  },
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições ao serviço de recomendações. Tente novamente em instantes.',
  },
  standardHeaders: true,  // Retorna informações nos headers RFC padrão (RateLimit-*)
  legacyHeaders: false,   // Desabilita headers legados (X-RateLimit-*)
  keyGenerator: ipKeyGenerator,
  handler: (req: Request, res: Response, _proximo: NextFunction, opcoes: any) => {
    Logger.warn(`[limiteRequisicaoIA] Limite de requisições excedido para IP: ${req.ip}`);
    res.status(429).json(opcoes.message);
  },
  skipSuccessfulRequests: false,
});
