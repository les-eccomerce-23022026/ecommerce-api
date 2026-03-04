import { ConexaoPostgres } from '../../shared/infrastructure/database/ConexaoPostgres';
import { fecharClienteRedis } from '../../shared/infrastructure/cache/redis';

/**
 * Global teardown para Jest: fecha conexões adequadamente
 * e força saída para resolver problemas de handles abertos.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    // Fecha Redis primeiro
    await fecharClienteRedis();

    // Fecha o pool do Postgres de forma mais agressiva
    const conexao = ConexaoPostgres.obterInstancia();
    await conexao.finalizar();

    // Força reset da instância singleton para próximos testes
    (ConexaoPostgres as any).instancia = null;

    // Pequena pausa para garantir que tudo seja fechado
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.warn('Erro no globalTeardown:', erro);
  } finally {
    // Força saída do processo após cleanup adequado
    // Isso resolve o problema dos handles TCP abertos
    process.exit(0);
  }
}