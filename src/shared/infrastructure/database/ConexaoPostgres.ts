import { Pool } from 'pg';
import { existsSync } from 'node:fs';
import { IConexaoBanco, DbParametro } from './IConexaoBanco';
import { obterTipoBancoAtual, obterTransacaoAtual, contextoBanco, obterContextoAtual, definirTransacaoGlobalParaTestes } from './ContextoBanco';

/**
 * Implementação da interface IConexaoBanco para Postgres utilizando 'pg' Pool.
 * Gerencia pools independentes para produção e teste.
 */
export class ConexaoPostgres implements IConexaoBanco {
  private static instancia: ConexaoPostgres | null = null;

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

  private static criarPoolProducao(): Pool {
    const schema = process.env.POSTGRES_SCHEMA ?? 'les';
    const options = `-c search_path=${schema},public`;

    const urlConfigurada = process.env.POSTGRES_URL;
    if (urlConfigurada) {
      return new Pool({ connectionString: urlConfigurada, options });
    }

    const host = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_HOST', 'POSTGRES_HOST_TEST');
    const porta = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_PORT', 'POSTGRES_PORT_TEST');
    const usuario = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_USER', 'POSTGRES_USER_TEST');
    const senha = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_PASSWORD', 'POSTGRES_PASSWORD_TEST');
    const banco = ConexaoPostgres.requireEnvComFallbackTeste('POSTGRES_DB', 'POSTGRES_DB_TEST');

    const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;
    return new Pool({ connectionString, options });
  }

  private obterPoolTeste(): Pool {
    if (!this.poolTeste) {
      const schema = process.env.POSTGRES_SCHEMA ?? 'les';
      const options = `-c search_path=${schema},public`;

      // Configurações via variáveis de ambiente para a instância de teste
      const hostConfigurado = ConexaoPostgres.requireEnv('POSTGRES_HOST_TEST');
      const executandoEmDocker = existsSync('/.dockerenv');
      const host = executandoEmDocker && ['localhost', '127.0.0.1'].includes(hostConfigurado)
        ? '172.17.0.1'
        : hostConfigurado;
      const porta = ConexaoPostgres.requireEnv('POSTGRES_PORT_TEST');
      const usuario = ConexaoPostgres.requireEnv('POSTGRES_USER_TEST');
      const senha = ConexaoPostgres.requireEnv('POSTGRES_PASSWORD_TEST');
      const banco = ConexaoPostgres.requireEnv('POSTGRES_DB_TEST');

      const connectionString = `postgresql://${usuario}:${senha}@${host}:${porta}/${banco}`;
      this.poolTeste = new Pool({ connectionString, options });
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
    return process.env.POSTGRES_SCHEMA ?? 'les';
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
