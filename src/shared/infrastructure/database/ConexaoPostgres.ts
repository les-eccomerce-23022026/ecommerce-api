import { Client, Pool, type PoolClient } from 'pg';
import { existsSync } from 'node:fs';
import { IConexaoBanco, DbParametro } from './IConexaoBanco';
import { obterTipoBancoAtual, obterTransacaoAtual, contextoBanco, obterContextoAtual, definirTransacaoGlobalParaTestes } from './ContextoBanco';
import { Logger } from '../../utils/Logger.util';

/**
 * Implementação da interface IConexaoBanco para Postgres utilizando 'pg' Pool.
 * Gerencia pools independentes para produção e teste.
 */
export class ConexaoPostgres implements IConexaoBanco {
  private static instancia: ConexaoPostgres | null = null;

  private static searchPathPorPool = new WeakMap<Pool, string>();

  private static searchPathPromessaPorPool = new WeakMap<Pool, Promise<string>>();

  private static connectionStringPorPool = new WeakMap<Pool, string>();

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

  public static possuiInstancia(): boolean {
    return ConexaoPostgres.instancia !== null;
  }

  public static resetInstancia(): void {
    ConexaoPostgres.instancia = null;
  }

  /**
   * Descobre schemas a partir de POSTGRES_SCHEMA (ex.: livraria → livraria_* + public).
   * O parâmetro libpq `options` não aceita vírgulas no search_path (corta em "livraria_comercial,").
   */
  private static async descobrirSearchPathNoBanco(cliente: Client | PoolClient): Promise<string> {
    const prefixo = process.env.POSTGRES_SCHEMA ?? 'livraria';
    if (prefixo === 'public') {
      return 'public';
    }

    const { rows } = await cliente.query<{ path: string }>(
      `SELECT coalesce(string_agg(quote_ident(schema_name), ', ' ORDER BY
          CASE WHEN schema_name = 'public' THEN 2
               WHEN schema_name = $1 THEN 1
               ELSE 0 END,
          schema_name), 'public') AS path
       FROM information_schema.schemata
       WHERE schema_name LIKE $1 || '%' OR schema_name = 'public'`,
      [prefixo],
    );

    return rows[0]?.path ?? 'public';
  }

  private static resolverSearchPathParaPool(pool: Pool): Promise<string> {
    const emCache = ConexaoPostgres.searchPathPorPool.get(pool);
    if (emCache) {
      return Promise.resolve(emCache);
    }

    let promessa = ConexaoPostgres.searchPathPromessaPorPool.get(pool);
    if (!promessa) {
      const connectionString = ConexaoPostgres.connectionStringPorPool.get(pool);
      if (!connectionString) {
        return Promise.reject(new Error('[ConexaoPostgres] connectionString do pool não registrada.'));
      }

      promessa = (async () => {
        const clienteAvulso = new Client({ connectionString });
        await clienteAvulso.connect();
        try {
          const path = await ConexaoPostgres.descobrirSearchPathNoBanco(clienteAvulso);
          ConexaoPostgres.searchPathPorPool.set(pool, path);
          Logger.info(`[ConexaoPostgres] search_path (${process.env.POSTGRES_SCHEMA ?? 'livraria'}): ${path}`);
          return path;
        } finally {
          await clienteAvulso.end();
        }
      })();
      ConexaoPostgres.searchPathPromessaPorPool.set(pool, promessa);
    }

    return promessa;
  }

  private static async aplicarSearchPath(pool: Pool, cliente: PoolClient): Promise<void> {
    const path = await ConexaoPostgres.resolverSearchPathParaPool(pool);
    await cliente.query(`SET search_path TO ${path}`);
  }

  private static registrarSearchPathNoPool(pool: Pool): void {
    pool.on('connect', (cliente) => {
      void ConexaoPostgres.aplicarSearchPath(pool, cliente);
    });
  }

  private static criarPool(config: { connectionString: string }): Pool {
    const pool = new Pool(config);
    ConexaoPostgres.connectionStringPorPool.set(pool, config.connectionString);
    ConexaoPostgres.registrarSearchPathNoPool(pool);
    return pool;
  }

  private static criarPoolProducao(): Pool {
    const urlConfigurada = process.env.POSTGRES_URL;

    if (urlConfigurada) {
      return ConexaoPostgres.criarPool({ connectionString: urlConfigurada });
    }

    const host = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_HOST', 'POSTGRES_HOST_TEST');
    const porta = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_PORT', 'POSTGRES_PORT_TEST');
    const usuario = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_USER', 'POSTGRES_USER_TEST');
    const senha = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_PASSWORD', 'POSTGRES_PASSWORD_TEST');
    const banco = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_DB', 'POSTGRES_DB_TEST');

    const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;
    Logger.info(`[ConexaoPostgres] Criando pool de produção: ${host}:${porta}/${banco}`);
    return ConexaoPostgres.criarPool({ connectionString });
  }

  private obterPoolTeste(): Pool {
    if (!this.poolTeste) {
      // Configurações via variáveis de ambiente para a instância de teste
      const hostConfigurado = process.env.POSTGRES_HOST_TEST ?? 'localhost';
      const executandoEmDocker = existsSync('/.dockerenv');
      const host = executandoEmDocker && ['localhost', '127.0.0.1'].includes(hostConfigurado)
        ? '172.17.0.1'
        : hostConfigurado;
      const porta = process.env.POSTGRES_PORT_TEST ?? '5433';
      const usuario = process.env.POSTGRES_USER_TEST ?? 'ecm_user_test';
      const senha = process.env.POSTGRES_PASSWORD_TEST ?? 'ecm_senha_test';
      const banco = process.env.POSTGRES_DB_TEST ?? 'ecm_livraria_test';

      const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;
      this.poolTeste = ConexaoPostgres.criarPool({ connectionString });
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

  private static obterSchemaPadrao(): string {
    return process.env.POSTGRES_SCHEMA ?? 'livraria';
  }

  public async executar<T = unknown>(sql: string, parametros?: DbParametro[], opcoes?: { searchPath?: string }): Promise<T[]> {
    const transacao = obterTransacaoAtual();
    const pool = this.obterPoolAtivo();

    if (opcoes?.searchPath) {
      // Validação básica contra SQL injection no nome do schema
      if (!/^[a-z0-9_, ]+$/i.test(opcoes.searchPath)) {
        throw new Error(`searchPath inválido: ${opcoes.searchPath}`);
      }

      const schemaPadrao = ConexaoPostgres.obterSchemaPadrao();
      const pathFull = `${opcoes.searchPath}, ${schemaPadrao}, public`;

      if (transacao) {
        await transacao.query(`SET LOCAL search_path = ${pathFull}`);
        const { rows } = await transacao.query(sql, parametros);
        return rows as T[];
      }

      const cliente = await pool.connect();
      try {
        await cliente.query(`SET LOCAL search_path = ${pathFull}`);
        const { rows } = await cliente.query(sql, parametros);
        return rows as T[];
      } finally {
        cliente.release();
      }
    }

    const executor = transacao || pool;
    const { rows } = await executor.query(sql, parametros);
    return rows as T[];
  }

  public async transacao<T>(callback: (cliente: IConexaoBanco) => Promise<T>): Promise<T> {
    await this.iniciarTransacao();
    try {
      const resultado = await callback(this);
      await this.confirmarTransacao();
      return resultado;
    } catch (erro) {
      await this.reverterTransacao();
      throw erro;
    }
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
      Logger.error('REVERTER FALHOU. ContextoAtual:', JSON.stringify(transacaoExistente));
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

  private static requireEnv(nome: string): string {
    const valor = process.env[nome];
    if (!valor || valor.trim().length === 0) {
      throw new Error(`Variável de ambiente obrigatória ausente: ${nome}`);
    }
    return valor;
  }

  private static requireEnvComFallbackTeste(nomePrincipal: string, nomeTeste: string): string {
    const principal = process.env[nomePrincipal];
    if (principal && principal.trim().length > 0) {
      return principal;
    }

    if (process.env.NODE_ENV === 'test') {
      const teste = process.env[nomeTeste];
      if (teste && teste.trim().length > 0) {
        return teste;
      }
    }

    throw new Error(`Variável de ambiente obrigatória ausente: ${nomePrincipal}`);
  }
}
