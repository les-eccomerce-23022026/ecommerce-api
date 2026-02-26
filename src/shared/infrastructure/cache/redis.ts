import Redis from 'ioredis';

let clienteRedis: Redis | null = null;

/**
 * Cria (se necessário) e retorna um cliente Redis compartilhado.
 *
 * Usa a variável de ambiente REDIS_URL quando disponível, ou assume redis://localhost:6379.
 */
export function obterClienteRedis(): Redis {
  if (clienteRedis) {
    return clienteRedis;
  }

  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

  clienteRedis = new Redis(url);

  return clienteRedis;
}

