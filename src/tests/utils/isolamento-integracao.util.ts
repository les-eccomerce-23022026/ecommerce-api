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

  // SAVEPOINT evita abortar a transação quando um INSERT opcional falha (PostgreSQL aborta o bloco inteiro)
  const executarSqlOpcional = async (sql: string, rotulo: string): Promise<void> => {
    const savepoint = `sp_setup_${rotulo}`;
    await db.executar(`SAVEPOINT ${savepoint}`);
    try {
      await db.executar(sql);
    } catch {
      await db.executar(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    }
  };

  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES ('FALHA NA ENTREGA')
     ON CONFLICT (stv_descricao) DO NOTHING`,
    'status_venda_comercial',
  );
  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.papeis (pap_descricao) VALUES ('admin'), ('cliente')
     ON CONFLICT (pap_descricao) DO NOTHING`,
    'papeis_comercial',
  );
  await executarSqlOpcional(
    `INSERT INTO livraria_gestao.lojas (loj_uuid, loj_nome, loj_slug, loj_ativo)
     VALUES ('00000000-0000-0000-0000-000000000001', 'Loja Padrão Teste', 'loja-padrao-teste', TRUE)
     ON CONFLICT (loj_slug) DO NOTHING`,
    'loja_padrao',
  );
  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.tipo_frete (tfr_descricao) VALUES
       ('PAC'), ('SEDEX'), ('LOGGI EXPRESS'), ('LOGGI ECONOMICO')
     ON CONFLICT (tfr_descricao) DO NOTHING`,
    'tipos_frete',
  );

  // Seeds para testes de livros (RF0031+)
  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.autores (aut_nome) 
     SELECT 'Autor Teste' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.autores WHERE aut_nome = 'Autor Teste')`,
    'autor_teste',
  );
  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.editoras (edi_nome) 
     SELECT 'Editora Teste' WHERE NOT EXISTS (SELECT 1 FROM livraria_comercial.editoras WHERE edi_nome = 'Editora Teste')`,
    'editora_teste',
  );
  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.categorias (cat_nome) VALUES
       ('ficcao'), ('Tecnologia'), ('Fantasia')
     ON CONFLICT (cat_nome) DO NOTHING`,
    'categorias_teste',
  );
  await executarSqlOpcional(
    `INSERT INTO livraria_comercial.grupos_precificacao (gpr_descricao, gpr_margem_lucro_percentual) VALUES
       ('Grupo 1', 50.00), ('Varejo', 30.00), ('Padrão', 50.00)
     ON CONFLICT (gpr_descricao) DO NOTHING`,
    'grupos_precificacao_teste',
  );

  await executarSqlOpcional(
    `ALTER TABLE livraria_financeiro.pagamento_pix_simulado
       ADD COLUMN IF NOT EXISTS pps_segredo_confirmacao VARCHAR(128)`,
    'pix_segredo_coluna',
  );

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
