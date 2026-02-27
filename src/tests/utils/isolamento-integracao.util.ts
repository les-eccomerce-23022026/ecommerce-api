import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';

export type EscopoIsolamentoIntegracao = {
  finalizar: () => Promise<void>;
};

/**
 * Inicia um escopo de isolamento para testes de integração usando TRUNCATE
 * em vez de transações, para evitar problemas com conexões abertas no Jest.
 */
export async function iniciarEscopoIsolamentoIntegracao(): Promise<EscopoIsolamentoIntegracao> {
  const db = FabricaConexaoBanco.obterConexao();

  // Limpa todas as tabelas relevantes para garantir isolamento
  await db.executar('TRUNCATE TABLE ecm_usuario CASCADE');

  return {
    finalizar: async () => {
      // Limpa novamente após o teste para manter consistência
      await db.executar('TRUNCATE TABLE ecm_usuario CASCADE');
    },
  };
}
