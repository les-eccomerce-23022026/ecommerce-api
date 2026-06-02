import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Middleware de auditoria para rotas do serviço de recomendações.
 *
 * Registra entrada e saída de cada requisição com método, caminho,
 * IP do solicitante, código de status HTTP e duração total de resposta.
 * Usado para monitoramento de uso, diagnóstico de problemas e rastreabilidade
 * de acessos ao módulo de recomendações.
 */
export function logAuditoriaIA(req: Request, res: Response, proximo: NextFunction): void {
  const inicio = Date.now();
  const metodo = req.method;
  const caminho = req.originalUrl;
  const ip = req.ip ?? 'desconhecido';

  Logger.info(`[AuditoriaIA] Entrada: ${metodo} ${caminho} | IP: ${ip}`);

  res.on('finish', () => {
    const duracaoMs = Date.now() - inicio;
    Logger.info(
      `[AuditoriaIA] Saída: ${metodo} ${caminho} | Status: ${res.statusCode} | Duração: ${duracaoMs}ms | IP: ${ip}`,
    );
  });

  proximo();
}
