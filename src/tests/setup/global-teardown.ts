import { ConexaoPostgres } from '../../shared/infrastructure/database/ConexaoPostgres';
import { fecharClienteRedis } from '../../shared/infrastructure/cache/redis';

/**
 * Global teardown para Jest: fecha conexões e força saída do processo
 * para resolver o problema de handles TCP abertos do pool do Postgres.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    // Fecha Redis primeiro
    await fecharClienteRedis();

    // Tenta fechar o pool do Postgres
    const conexao = ConexaoPostgres.obterInstancia();
    await conexao.finalizar();
  } catch (erro) {
    console.warn('Erro no globalTeardown:', erro);
  } finally {
    // Força a saída do processo para garantir que o Jest termine
    // Isso resolve o problema dos handles TCP abertos do pool pg
    process.exit(0);
  }
}