import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Verifica variáveis de ambiente do Postgres. Fallback é null; lança erro seguro
 * (sem expor valores sensíveis) se alguma configuração obrigatória estiver ausente.
 */
function validarVariaveisPostgres(): void {
  const urlConfigurada = process.env.POSTGRES_URL;
  if (urlConfigurada) {
    return;
  }

  const host = process.env.POSTGRES_HOST ?? null;
  const porta = process.env.POSTGRES_PORT ?? null;
  const usuario = process.env.POSTGRES_USER ?? null;
  const senha = process.env.POSTGRES_PASSWORD ?? null;
  const banco = process.env.POSTGRES_DB ?? null;

  const faltando: string[] = [];
  if (host == null) faltando.push('POSTGRES_HOST');
  if (porta == null) faltando.push('POSTGRES_PORT');
  if (usuario == null) faltando.push('POSTGRES_USER');
  if (senha == null) faltando.push('POSTGRES_PASSWORD');
  if (banco == null) faltando.push('POSTGRES_DB');

  if (faltando.length > 0) {
    throw new Error(
      `Configuração de banco indisponível: variáveis de ambiente ausentes ou inválidas: ${faltando.join(', ')}. Defina POSTGRES_URL ou todas as variáveis individuais.`,
    );
  }
}

/**
 * Cria (se necessário) e retorna uma instância compartilhada de Pool do Postgres.
 *
 * Usa a variável de ambiente POSTGRES_URL quando disponível, ou monta a URL a partir
 * de POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_DB.
 * Não utiliza fallbacks para valores sensíveis; lança erro seguro se alguma estiver ausente.
 */
export function obterPoolPostgres(): Pool {
  if (pool) {
    return pool;
  }

  validarVariaveisPostgres();

  const urlConfigurada = process.env.POSTGRES_URL;

  if (urlConfigurada) {
    pool = new Pool({ connectionString: urlConfigurada });
    return pool;
  }

  const host = process.env.POSTGRES_HOST as string;
  const porta = process.env.POSTGRES_PORT as string;
  const usuario = process.env.POSTGRES_USER as string;
  const senha = process.env.POSTGRES_PASSWORD as string;
  const banco = process.env.POSTGRES_DB as string;

  const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;

  pool = new Pool({ connectionString });

  return pool;
}

