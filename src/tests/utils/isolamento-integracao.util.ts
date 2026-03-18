import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';

export type EscopoIsolamentoIntegracao = {
  finalizar: () => Promise<void>;
};

/**
 * Inicia um escopo de isolamento para testes de integração usando TRANSACTION (ROLLBACK).
 * Garante que os dados do teste nunca sejam persistidos, protegendo a base de desenvolvimento.
 */
export async function iniciarEscopoIsolamentoIntegracao(): Promise<EscopoIsolamentoIntegracao> {
  const db = FabricaConexaoBanco.obterConexao();

  // Inicia transação global para o teste
  await db.iniciarTransacao();

  try {
    // Garante que as bandeiras existem (necessário para FK de cartões)
    await db.executar(`
      INSERT INTO ecm_bandeira_cartao (id_bandeira_cartao, dsc_bandeira) VALUES
      (1, 'Visa'),
      (2, 'Mastercard')
      ON CONFLICT (id_bandeira_cartao) DO NOTHING
    `);

    // Insere cliente de teste dentro da transação
    const uuidCliente = '550e8400-e29b-41d4-a716-446655440000'; 
    await db.executar(`
      INSERT INTO ecm_usuario (id_usuario, uuid_usuario, nom_usuario, dsc_email, dsc_cpf, dsc_senha_hash, id_papel, flg_ativo, dat_criacao)
      VALUES (1, $1, 'Cliente Existente', 'existente.teste@email.com', '123.456.789-01', '$2b$10$dummy', 2, true, NOW())
      ON CONFLICT (dsc_email, id_papel) DO NOTHING
    `, [uuidCliente]);

    return {
      finalizar: async () => {
        // SEMPRE reverte tudo no final, limpando o lixo do teste sem afetar outros dados
        await db.reverterTransacao();
      },
    };
  } catch (error) {
    await db.reverterTransacao();
    throw error;
  }
}
