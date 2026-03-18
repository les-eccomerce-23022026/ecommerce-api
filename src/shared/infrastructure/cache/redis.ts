import Redis from 'ioredis';
import { obterTipoBancoAtual } from '../database/ContextoBanco';

let clienteRedisProducao: Redis | null = null;
let clienteRedisTeste: Redis | null = null;

/**
 * Cria (se necessário) e retorna um cliente Redis compartilhado baseado no contexto.
 */
export function obterClienteRedis(): Redis {
  const tipo = obterTipoBancoAtual();

  if (tipo === 'teste') {
    if (!clienteRedisTeste) {
      const url = process.env.REDIS_URL_TEST ?? 'redis://172.17.0.1:6380';
      clienteRedisTeste = new Redis(url);
    }
    return clienteRedisTeste;
  }

  if (!clienteRedisProducao) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    clienteRedisProducao = new Redis(url);
  }
  return clienteRedisProducao;
}

/**
 * Fecha todas as conexões com Redis.
 * Deve ser chamado no teardown global dos testes.
 */
export async function fecharClienteRedis(): Promise<void> {
  const fechar = [];
  if (clienteRedisProducao) fechar.push(clienteRedisProducao.quit());
  if (clienteRedisTeste) fechar.push(clienteRedisTeste.quit());
  
  await Promise.all(fechar);
  clienteRedisProducao = null;
  clienteRedisTeste = null;
}
