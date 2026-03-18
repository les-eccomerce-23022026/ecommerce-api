import { Pool, PoolClient } from 'pg';
import { IConexaoBanco } from './IConexaoBanco';
import { obterTipoBancoAtual } from './ContextoBanco';

/**
 * Implementação da interface IConexaoBanco para Postgres utilizando 'pg' Pool.
 * Gerencia pools independentes para produção e teste.
 */
export class ConexaoPostgres implements IConexaoBanco {
  private static instancia: ConexaoPostgres;

  private poolProducao: Pool;

  private poolTeste: Pool | null = null;

  private clienteTransacao: PoolClient | null = null;

  private constructor() {
    this.poolProducao = ConexaoPostgres.criarPoolProducao();
  }

  public static obterInstancia(): ConexaoPostgres {
    if (!ConexaoPostgres.instancia) {
      ConexaoPostgres.instancia = new ConexaoPostgres();
    }
    return ConexaoPostgres.instancia;
  }

  public static resetInstancia(): void {
    if (ConexaoPostgres.instancia) {
      ConexaoPostgres.instancia = (null as unknown) as ConexaoPostgres;
    }
  }

  private static criarPoolProducao(): Pool {
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

  private obterPoolTeste(): Pool {
    if (!this.poolTeste) {
      // Configurações via variáveis de ambiente para a instância de teste
      const host = process.env.POSTGRES_HOST_TEST ?? '172.17.0.1';
      const porta = process.env.POSTGRES_PORT_TEST ?? '5433';
      const usuario = process.env.POSTGRES_USER_TEST ?? 'ecm_user_test';
      const senha = process.env.POSTGRES_PASSWORD_TEST ?? 'ecm_senha_test';
      const banco = process.env.POSTGRES_DB_TEST ?? 'ecm_livraria_test';

      const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;
      this.poolTeste = new Pool({ connectionString });
    }
    return this.poolTeste;
  }

  /**
   * Retorna o pool correto baseado no contexto atual (AsyncLocalStorage).
   */
  private obterPoolAtivo(): Pool {
    const tipo = obterTipoBancoAtual();
    return tipo === 'teste' ? this.obterPoolTeste() : this.poolProducao;
  }

  public async executar<T = unknown>(sql: string, parametros?: unknown[]): Promise<T[]> {
    const executor = this.clienteTransacao || this.obterPoolAtivo();
    const { rows } = await executor.query(sql, parametros);
    return rows as T[];
  }

  public async iniciarTransacao(): Promise<void> {
    if (this.clienteTransacao) {
      throw new Error('Transação já está em andamento nesta conexão.');
    }
    this.clienteTransacao = await this.obterPoolAtivo().connect();
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
    const encerramentos = [this.poolProducao.end()];
    if (this.poolTeste) {
      encerramentos.push(this.poolTeste.end());
    }
    await Promise.all(encerramentos);
  }
}
