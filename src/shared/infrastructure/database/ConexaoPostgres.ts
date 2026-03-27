import { Pool } from 'pg';
import { IConexaoBanco, DbParametro } from './IConexaoBanco';
import { obterTipoBancoAtual, obterTransacaoAtual, contextoBanco, obterContextoAtual, definirTransacaoGlobalParaTestes } from './ContextoBanco';

/**
 * Implementação da interface IConexaoBanco para Postgres utilizando 'pg' Pool.
 * Gerencia pools independentes para produção e teste.
 */
export class ConexaoPostgres implements IConexaoBanco {
  private static instancia: ConexaoPostgres;

  private poolProducao: Pool;

  private poolTeste: Pool | null = null;

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
      ConexaoPostgres.instancia = null!;
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

  public async executar<T = unknown>(sql: string, parametros?: DbParametro[]): Promise<T[]> {
    const tipo = obterTipoBancoAtual();
    const transacao = obterTransacaoAtual();
    const executor = transacao || this.obterPoolAtivo();

    const { rows } = await executor.query(sql, parametros);
    return rows as T[];
  }

  public async iniciarTransacao(): Promise<void> {
    const transacaoExistente = obterTransacaoAtual();
    if (transacaoExistente) {
      throw new Error('Transação já está em andamento neste contexto.');
    }

    const cliente = await this.obterPoolAtivo().connect();
    await cliente.query('BEGIN');

    // Define fallback global para testes onde o contexto assíncrono é perdido
    definirTransacaoGlobalParaTestes(cliente);

    const contextoAtual = obterContextoAtual() || { tipo: obterTipoBancoAtual() };
    contextoBanco.enterWith({
      ...contextoAtual,
      transacao: cliente,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async confirmarTransacao(): Promise<void> {
    const cliente = obterTransacaoAtual();
    if (!cliente) {
      throw new Error('Nenhuma transação ativa para confirmar.');
    }
    try {
      await cliente.query('COMMIT');
    } finally {
      cliente.release();
      definirTransacaoGlobalParaTestes(undefined); // Limpa fallback global
      const contextoAtual = obterContextoAtual();
      if (contextoAtual) {
        delete contextoAtual.transacao;
        contextoBanco.enterWith(contextoAtual);
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async reverterTransacao(): Promise<void> {
    const cliente = obterTransacaoAtual();
    const transacaoExistente = obterContextoAtual();
    if (!cliente) {
      // eslint-disable-next-line no-console
      console.log('REVERTER FALHOU. ContextoAtual:', JSON.stringify(transacaoExistente));
      throw new Error('Nenhuma transação ativa para reverter.');
    }
    try {
      await cliente.query('ROLLBACK');
    } finally {
      cliente.release();
      definirTransacaoGlobalParaTestes(undefined); // Limpa fallback global
      const contextoAtual = obterContextoAtual();
      if (contextoAtual) {
        delete contextoAtual.transacao;
        contextoBanco.enterWith(contextoAtual);
      }
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
