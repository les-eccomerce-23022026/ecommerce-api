import { Pool, PoolClient } from 'pg';
import { IConexaoBanco } from './IConexaoBanco';

/**
 * Implementação da interface IConexaoBanco para Postgres utilizando 'pg' Pool.
 */
export class ConexaoPostgres implements IConexaoBanco {
  private static instancia: ConexaoPostgres;

  private pool: Pool;

  private clienteTransacao: PoolClient | null = null;

  private constructor() {
    this.pool = ConexaoPostgres.criarPool();
  }

  public static obterInstancia(): ConexaoPostgres {
    if (!ConexaoPostgres.instancia) {
      ConexaoPostgres.instancia = new ConexaoPostgres();
    }
    return ConexaoPostgres.instancia;
  }

  private static criarPool(): Pool {
    const urlConfigurada = process.env.POSTGRES_URL;
    if (urlConfigurada) {
      return new Pool({ connectionString: urlConfigurada });
    }

    const host = process.env.POSTGRES_HOST ?? 'localhost';
    const porta = process.env.POSTGRES_PORT ?? '5432';
    const usuario = process.env.POSTGRES_USER ?? 'ecm_user';
    const senha = process.env.POSTGRES_PASSWORD ?? 'ecm_senha';
    const banco = process.env.POSTGRES_DB ?? 'ecm_livraria';

    const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;
    return new Pool({ connectionString });
  }

  public async executar<T = unknown>(sql: string, parametros?: unknown[]): Promise<T[]> {
    const executor = this.clienteTransacao || this.pool;
    const { rows } = await executor.query(sql, parametros);
    return rows;
  }

  public async iniciarTransacao(): Promise<void> {
    if (this.clienteTransacao) {
      throw new Error('Transação já está em andamento nesta conexão.');
    }
    this.clienteTransacao = await this.pool.connect();
    await this.clienteTransacao.query('BEGIN');
  }

  public async confirmarTransacao(): Promise<void> {
    if (!this.clienteTransacao) {
      throw new Error('Nenhuma transação ativa para confirmar.');
    }
    try {
      await this.clienteTransacao.query('COMMIT');
    } finally {
      this.clienteTransacao.release();
      this.clienteTransacao = null;
    }
  }

  public async reverterTransacao(): Promise<void> {
    if (!this.clienteTransacao) {
      throw new Error('Nenhuma transação ativa para reverter.');
    }
    try {
      await this.clienteTransacao.query('ROLLBACK');
    } finally {
      this.clienteTransacao.release();
      this.clienteTransacao = null;
    }
  }

  public async finalizar(): Promise<void> {
    // Fecha o pool normalmente, mas com timeout para evitar travamentos
    await new Promise<void>((resolve) => {
      this.pool.end(() => resolve());
      // Timeout de 5 segundos para forçar resolução se o pool não fechar
      setTimeout(resolve, 5000);
    });
  }
}
