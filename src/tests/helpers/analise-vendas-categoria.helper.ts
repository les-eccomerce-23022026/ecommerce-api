import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { di } from '@/shared/infrastructure/di.container';

/**
 * Helper para criação de dados reais de vendas para testes de integração
 * da Entrega 9 (Análise de Vendas por Categoria - Gráfico de Linhas).
 *
 * Este helper cria dados reais no banco de dados sem usar mocks, seguindo
 * as boas práticas de testes de integração do projeto.
 */

export interface DadosVendaCriada {
  ven_uuid: string;
  ven_id: number;
  data_criacao: Date;
  categoria: string;
  quantidade: number;
}

/**
 * Cria vendas reais com status ENTREGUE distribuídas ao longo de um período
 * para testar a funcionalidade de análise de vendas por categoria.
 *
 * @param db Conexão com o banco de dados
 * @param opcoes Opções de configuração das vendas
 * @returns Lista de vendas criadas
 */
export async function criarVendasParaAnalise(
  db: IConexaoBanco,
  opcoes: {
    dataInicio: Date;
    dataFim: Date;
    quantidadeVendas?: number;
    categorias?: string[];
  }
): Promise<DadosVendaCriada[]> {
  const {
    dataInicio,
    dataFim,
    quantidadeVendas = 30,
    categorias,
  } = opcoes;

  // Se categorias não foram fornecidas, obter categorias disponíveis no banco
  let categoriasParaUsar = categorias;
  if (!categoriasParaUsar || categoriasParaUsar.length === 0) {
    categoriasParaUsar = await obterCategoriasDisponiveis(db);
    if (categoriasParaUsar.length === 0) {
      throw new Error('Nenhuma categoria disponível no banco de dados');
    }
  }

  const vendasCriadas: DadosVendaCriada[] = [];

  // Obter loja padrão
  const lojaRows = await db.executar<{ loj_id: number; loj_uuid: string }>(
    `SELECT loj_id, loj_uuid FROM livraria_gestao.lojas WHERE loj_ativo = TRUE LIMIT 1`
  );

  if (lojaRows.length === 0) {
    throw new Error('Nenhuma loja ativa encontrada no banco de dados');
  }

  const lojId = lojaRows[0].loj_id;

  // Obter usuário cliente para associar às vendas
  const usuarioRows = await db.executar<{ usu_id: number }>(
    `SELECT usu_id FROM livraria_gestao.usuarios 
     WHERE pap_id = (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente' LIMIT 1)
     LIMIT 1`
  );

  if (usuarioRows.length === 0) {
    throw new Error('Nenhum usuário cliente encontrado no banco de dados');
  }

  const usuId = usuarioRows[0].usu_id;

  // Obter status ENTREGUE
  const statusRows = await db.executar<{ stv_id: number }>(
    `SELECT stv_id FROM livraria_comercial.status_venda WHERE stv_descricao = 'ENTREGUE' LIMIT 1`
  );

  if (statusRows.length === 0) {
    throw new Error('Status ENTREGUE não encontrado no banco de dados');
  }

  const stvId = statusRows[0].stv_id;

  // Criar vendas distribuídas ao longo do período
  const periodoMs = dataFim.getTime() - dataInicio.getTime();
  const intervaloMs = periodoMs / quantidadeVendas;

  for (let i = 0; i < quantidadeVendas; i++) {
    const dataVenda = new Date(dataInicio.getTime() + (i * intervaloMs));
    const categoria = categoriasParaUsar[i % categoriasParaUsar.length];

    // Obter livro da categoria com estoque na loja correta
    const livroRows = await db.executar<{ liv_uuid: string; liv_id: number }>(
      `SELECT l.liv_uuid, l.liv_id 
       FROM livraria_comercial.livros l
       JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
       JOIN livraria_comercial.categorias c ON c.cat_id = lc.cat_id
       JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id AND e.loj_id = $2
       WHERE c.cat_nome = $1 AND e.etq_quantidade_disponivel > 0
       LIMIT 1`,
      [categoria, lojId]
    );

    if (livroRows.length === 0) {
      console.warn(`Nenhum livro encontrado para categoria: ${categoria}`);
      continue;
    }

    const livroUuid = livroRows[0].liv_uuid;
    const quantidade = Math.floor(Math.random() * 3) + 1; // 1-3 unidades

    // Obter preço do estoque
    const estoqueRows = await db.executar<{ etq_preco_venda: string }>(
      `SELECT etq_preco_venda FROM livraria_comercial.estoques 
       WHERE liv_id = $1 AND loj_id = $2 LIMIT 1`,
      [livroRows[0].liv_id, lojId]
    );

    const precoUnitario = estoqueRows.length > 0 
      ? Number(estoqueRows[0].etq_preco_venda) 
      : 45.00;

    const valorFrete = 10.00;
    const valorTotalItens = precoUnitario * quantidade;
    const valorTotal = valorTotalItens + valorFrete;

    // Inserir venda
    const vendaRows = await db.executar<{ ven_uuid: string; ven_id: number }>(
      `INSERT INTO livraria_comercial.vendas 
       (ven_uuid, usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, 
        ven_criado_em, ven_atualizado_em, loj_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, $7)
       RETURNING ven_uuid, ven_id`,
      [usuId, stvId, valorTotalItens, valorFrete, valorTotal, dataVenda, lojId]
    );

    const venUuid = vendaRows[0].ven_uuid;
    const venId = vendaRows[0].ven_id;

    // Inserir item de venda
    await db.executar(
      `INSERT INTO livraria_comercial.itens_venda 
       (itv_uuid, ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, 
        itv_criado_em, itv_atualizado_em, loj_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $5, $6)`,
      [venId, livroUuid, quantidade, precoUnitario, dataVenda, lojId]
    );

    vendasCriadas.push({
      ven_uuid: venUuid,
      ven_id: venId,
      data_criacao: dataVenda,
      categoria,
      quantidade,
    });
  }

  return vendasCriadas;
}

/**
 * Limpa vendas criadas pelo helper para isolamento de testes.
 *
 * @param db Conexão com o banco de dados
 * @param vendaUuids Lista de UUIDs de vendas para remover
 */
export async function limparVendasCriadas(
  db: IConexaoBanco,
  vendaUuids: string[]
): Promise<void> {
  if (vendaUuids.length === 0) return;

  await db.executar(
    `DELETE FROM livraria_comercial.itens_venda 
     WHERE ven_id IN (SELECT ven_id FROM livraria_comercial.vendas WHERE ven_uuid = ANY($1))`,
    [vendaUuids]
  );

  await db.executar(
    `DELETE FROM livraria_comercial.vendas WHERE ven_uuid = ANY($1)`,
    [vendaUuids]
  );
}

/**
 * Obtém categorias disponíveis no banco de dados para testes.
 * Retorna apenas categorias que têm livros com estoque disponível.
 *
 * @param db Conexão com o banco de dados
 * @returns Lista de nomes de categorias
 */
export async function obterCategoriasDisponiveis(
  db: IConexaoBanco
): Promise<string[]> {
  const rows = await db.executar<{ cat_nome: string }>(
    `SELECT DISTINCT c.cat_nome 
     FROM livraria_comercial.categorias c
     JOIN livraria_comercial.livro_categorias lc ON lc.cat_id = c.cat_id
     JOIN livraria_comercial.livros l ON l.liv_id = lc.liv_id
     JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
     WHERE c.cat_nome IS NOT NULL 
       AND e.etq_quantidade_disponivel > 0
     ORDER BY c.cat_nome 
     LIMIT 10`
  );

  return rows.map(r => r.cat_nome);
}
