import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Cria (se necessário) e retorna uma instância compartilhada de Pool do Postgres.
 *
 * Usa a variável de ambiente POSTGRES_URL quando disponível, ou monta a URL a partir
 * de POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_DB.
 */
export function obterPoolPostgres(): Pool {
  if (pool) {
    return pool;
  }

  const urlConfigurada = process.env.POSTGRES_URL;

  if (urlConfigurada) {
    pool = new Pool({ connectionString: urlConfigurada });
    return pool;
  }

  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const porta = process.env.POSTGRES_PORT ?? '5432';
  const usuario = process.env.POSTGRES_USER ?? 'les_user';
  const senha = process.env.POSTGRES_PASSWORD ?? 'les_senha';
  const banco = process.env.POSTGRES_DB ?? 'les_livraria';

  const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;

  pool = new Pool({ connectionString });

  return pool;
}

