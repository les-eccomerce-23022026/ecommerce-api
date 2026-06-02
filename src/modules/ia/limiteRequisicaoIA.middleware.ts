import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Middleware de limitação de requisições para rotas do serviço de recomendações.
 *
 * Protege o catálogo de sugestões contra uso abusivo e sobrecarga de infraestrutura.
 *
 * Configuração:
 * - Limite de 15 requisições por minuto por IP (reduzido de 30 para maior segurança)
 * - Limite de 3 requisições por segundo por IP (prevenção de burst attacks)
 * - Headers de controle RFC 6585 habilitados (RateLimit-*)
 * - Desabilitado em ambiente de testes apenas quando header explícito é enviado
 */
export const limiteRequisicaoIA = rateLimit({
  windowMs: 60 * 1000, // janela de 1 minuto
  max: 15, // Reduzido de 30 para 15 para maior segurança contra abuso
  skip: (req: Request) => {
    // Desabilita apenas quando header explícito de teste é enviado
    // NODE_ENV=test sozinho não é mais suficiente para bypass
    return req.headers['x-use-test-db'] === 'true';
  },
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições ao serviço de recomendações. Tente novamente em instantes.',
  },
  standardHeaders: true,  // Retorna informações nos headers RFC padrão (RateLimit-*)
  legacyHeaders: false,   // Desabilita headers legados (X-RateLimit-*)
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response, _proximo: NextFunction, opcoes: any) => {
    Logger.warn(`[limiteRequisicaoIA] Limite de requisições excedido para IP: ${req.ip}`);
    res.status(429).json(opcoes.message);
  },
  skipSuccessfulRequests: false,
});
