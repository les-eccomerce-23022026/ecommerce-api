import { Client } from 'pg';
import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

/** ISBN fixo usado apenas nos testes de integração do carrinho (idempotente na mesma transação). */
export const ISBN_LIVRO_TESTE_CARRINHO = '978-77-777-77777-7';

let extensaoUnaccentVerificada = false;

/**
 * Garante a extensão `unaccent` no banco de testes (fora da transação de isolamento).
 * Necessária para os triggers de normalização em `livros` / `autores` ao inserir catálogo mínimo.
 */
export async function garantirExtensaoUnaccentNoBancoDeTeste(): Promise<void> {
  if (extensaoUnaccentVerificada) return;

  const client = new Client({
    host: process.env.POSTGRES_HOST_TEST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT_TEST ?? '5433'),
    user: process.env.POSTGRES_USER_TEST ?? 'ecm_user_test',
    password: process.env.POSTGRES_PASSWORD_TEST ?? 'ecm_senha_test',
    database: process.env.POSTGRES_DB_TEST ?? 'ecm_livraria_test',
  });

  await client.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS unaccent');
  } catch {
    // Sem permissão ou já instalada no template — segue; pode falhar depois nos triggers.
  } finally {
    await client.end();
  }
  extensaoUnaccentVerificada = true;
}

/**
 * Garante a tabela `carrinho_itens` (equivalente à migration 017).
 * Executado dentro da transação de isolamento do teste; o DDL é revertido no ROLLBACK.
 */
export async function garantirTabelaCarrinhoItens(db: IConexaoBanco): Promise<void> {
  await db.executar(
    `CREATE TABLE IF NOT EXISTS carrinho_itens (
      cri_id BIGSERIAL PRIMARY KEY,
      usu_id BIGINT NOT NULL REFERENCES usuarios(usu_id) ON DELETE CASCADE,
      liv_id BIGINT NOT NULL REFERENCES livros(liv_id) ON DELETE CASCADE,
      cri_quantidade INTEGER NOT NULL CHECK (cri_quantidade > 0),
      cri_atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_carrinho_usuario_livro UNIQUE (usu_id, liv_id)
    )`,
    [],
  );
  await db.executar(
    'CREATE INDEX IF NOT EXISTS idx_carrinho_itens_usuario ON carrinho_itens(usu_id)',
    [],
  );
}

/**
 * Garante autor, editora, grupo, livro e estoque mínimos para exercitar o carrinho.
 * Necessário quando o banco de testes não possui seed de catálogo (vendas não exigem `livros`).
 */
export async function garantirLivroComEstoqueParaCarrinho(
  db: IConexaoBanco,
): Promise<{ livUuid: string; estoque: number }> {
  const existentes = await db.executar<{ liv_uuid: string; estoque: string }>(
    `SELECT l.liv_uuid::text AS liv_uuid, e.etq_quantidade_disponivel::text AS estoque
     FROM livros l
     INNER JOIN estoques e ON e.liv_id = l.liv_id
     WHERE l.liv_ativo = TRUE AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
     ORDER BY l.liv_id
     LIMIT 1`,
    [],
  );
  if (existentes.length > 0) {
    return {
      livUuid: existentes[0].liv_uuid,
      estoque: Number(existentes[0].estoque),
    };
  }

  await db.executar(
    `INSERT INTO autores (aut_nome)
     SELECT 'Autor IT Carrinho'
     WHERE NOT EXISTS (SELECT 1 FROM autores WHERE aut_nome = 'Autor IT Carrinho')`,
    [],
  );

  await db.executar(
    `INSERT INTO editoras (edi_nome, edi_cnpj)
     SELECT 'Editora IT Carrinho', '00.000.000/0001-98'
     WHERE NOT EXISTS (SELECT 1 FROM editoras WHERE edi_nome = 'Editora IT Carrinho')`,
    [],
  );

  await db.executar(
    `INSERT INTO grupos_precificacao (gpr_descricao, gpr_margem_lucro_percentual)
     SELECT 'IT Carrinho', 30.00
     WHERE NOT EXISTS (SELECT 1 FROM grupos_precificacao WHERE gpr_descricao = 'IT Carrinho')`,
    [],
  );

  await db.executar(
    `INSERT INTO livros (
       liv_titulo, liv_ano, liv_isbn, liv_numero_paginas,
       aut_id, edi_id, gpr_id, liv_ativo
     )
     SELECT
       'Livro IT Carrinho',
       2020,
       $1::varchar(20),
       100,
       (SELECT aut_id FROM autores WHERE aut_nome = 'Autor IT Carrinho' LIMIT 1),
       (SELECT edi_id FROM editoras WHERE edi_nome = 'Editora IT Carrinho' LIMIT 1),
       (SELECT gpr_id FROM grupos_precificacao WHERE gpr_descricao = 'IT Carrinho' LIMIT 1),
       TRUE
     WHERE NOT EXISTS (SELECT 1 FROM livros WHERE liv_isbn = $1::varchar(20))`,
    [ISBN_LIVRO_TESTE_CARRINHO],
  );

  await db.executar(
    `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_preco_venda, etq_ativo)
     SELECT l.liv_id, 1000, 49.90, TRUE
     FROM livros l
     WHERE l.liv_isbn = $1::varchar(20)
       AND NOT EXISTS (SELECT 1 FROM estoques e WHERE e.liv_id = l.liv_id)`,
    [ISBN_LIVRO_TESTE_CARRINHO],
  );

  const finalRows = await db.executar<{ liv_uuid: string; estoque: string }>(
    `SELECT l.liv_uuid::text AS liv_uuid, e.etq_quantidade_disponivel::text AS estoque
     FROM livros l
     INNER JOIN estoques e ON e.liv_id = l.liv_id
     WHERE l.liv_isbn = $1::varchar(20)`,
    [ISBN_LIVRO_TESTE_CARRINHO],
  );

  if (!finalRows.length) {
    throw new Error('Falha ao criar ou localizar livro de teste do carrinho.');
  }

  return {
    livUuid: finalRows[0].liv_uuid,
    estoque: Number(finalRows[0].estoque),
  };
}
