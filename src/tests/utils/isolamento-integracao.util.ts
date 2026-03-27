import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';
import { contextoBanco, TipoAmbienteBanco } from '@/shared/infrastructure/database/ContextoBanco';

import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export type EscopoIsolamentoIntegracao = {
  db: IConexaoBanco;
  finalizar: () => Promise<void>;
};

/**
 * Inicia um escopo de isolamento para testes de integração usando transações.
 * Cada teste roda dentro de um BEGIN, e no final é feito um ROLLBACK.
 */
export async function iniciarEscopoIsolamentoIntegracao(
  tipo: TipoAmbienteBanco = 'teste'
): Promise<EscopoIsolamentoIntegracao> {
  // Inicializa o contexto com o tipo de banco desejado.
  contextoBanco.enterWith({ tipo });

  const db = FabricaConexaoBanco.obterConexao();
  await db.iniciarTransacao();

  return {
    db,
    finalizar: async () => {
      await db.reverterTransacao();
    },
  };
}
