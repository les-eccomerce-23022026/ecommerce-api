import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';
import { contextoBanco, TipoAmbienteBanco } from '@/shared/infrastructure/database/ContextoBanco';

import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export type EscopoIsolamentoIntegracao = {
  db: IConexaoBanco;
  finalizar: () => Promise<void>;
  criarSavepoint: (nome: string) => Promise<void>;
  restaurarSavepoint: (nome: string) => Promise<void>;
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

  // Garante que o status 'FALHA NA ENTREGA' exista para testes de Sprint 3
  // Tenta inserir em ambos os schemas possíveis (compatibilidade com migrações antigas/novas)
  try {
    await db.executar(`
      INSERT INTO livraria_comercial.status_vendas (stv_descricao) VALUES ('FALHA NA ENTREGA')
      ON CONFLICT (stv_descricao) DO NOTHING
    `);
  } catch (erro) {
    // Tenta schema antigo se falhar
    try {
      await db.executar(`
        INSERT INTO ecm_status_venda (stv_descricao) VALUES ('FALHA NA ENTREGA')
        ON CONFLICT (stv_descricao) DO NOTHING
      `);
    } catch (erro2) {
      // Ignora se tabela não existir - não é crítico para testes de logística
      console.warn('Não foi possível inserir status FALHA NA ENTREGA:', erro2);
    }
  }

  return {
    db,
    finalizar: async () => {
      await db.reverterTransacao();
    },
    criarSavepoint: async (nome: string) => {
      await db.executar(`SAVEPOINT ${nome}`);
    },
    restaurarSavepoint: async (nome: string) => {
      await db.executar(`ROLLBACK TO SAVEPOINT ${nome}`);
    },
  };
}
