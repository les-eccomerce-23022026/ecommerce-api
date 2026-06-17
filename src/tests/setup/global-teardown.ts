import { ConexaoPostgres } from '../../shared/infrastructure/database/ConexaoPostgres';

/**
 * Global teardown para Jest: fecha conexões adequadamente
 * e força saída para resolver problemas de handles abertos.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    // Fecha o pool do Postgres de forma mais agressiva
    if (ConexaoPostgres.possuiInstancia()) {
      const conexao = ConexaoPostgres.obterInstancia();
      await conexao.finalizar();
    }

    // Força reset da instância singleton para próximos testes
    ConexaoPostgres.resetInstancia();

    // Pequena pausa para garantir que tudo seja fechado
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.warn('Erro no globalTeardown:', erro);
  }
}