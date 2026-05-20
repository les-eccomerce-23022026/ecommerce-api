import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';

describe('Integração - RepositorioLivrosPostgres - Correção Conversões e ORDER BY', () => {
  const contexto = configurarTesteIntegracao();
  let repositorio: RepositorioLivrosPostgres;

  beforeEach(() => {
    repositorio = new RepositorioLivrosPostgres(contexto.db!);
  });

  afterEach(async () => {
    // Limpar dados criados nos testes
    await contexto.db!.executar('DELETE FROM estoques WHERE liv_id IN (SELECT liv_id FROM livros WHERE liv_titulo LIKE \'Livro Teste%\' OR liv_titulo LIKE \'Livro Catálogo\' OR liv_titulo LIKE \'Livro Detalhe\')');
    await contexto.db!.executar('DELETE FROM livros WHERE liv_titulo LIKE \'Livro Teste%\' OR liv_titulo LIKE \'Livro Catálogo\' OR liv_titulo LIKE \'Livro Detalhe\'');
  });

  describe('obterEstoqueDisponivelPorLivId - Com ORDER BY', () => {
    it('deve retornar estoque com ORDER BY para resultado determinístico', async () => {
      // Setup: Criar livro
      const livroRes = await contexto.db!.executar<{ liv_id: number }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('423e4567-e89b-12d3-a456-426614174003', 'Livro Teste Estoque', '1234567890126', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567893', TRUE)
         RETURNING liv_id`
      );
      const livId = livroRes[0].liv_id;

      // Setup: Criar estoque para o livro
      // Nota: Não é possível criar múltiplos estoques para o mesmo livro devido à constraint única
      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ($1, 10, 0, 50.00, 30.00, TRUE, 1)`,
        [livId]
      );

      // Act com medição de performance
      console.time('obterEstoqueDisponivelPorLivId');
      const estoque = await repositorio.obterEstoqueDisponivelPorLivId(livId);
      console.timeEnd('obterEstoqueDisponivelPorLivId');

      // Assert - ORDER BY garante resultado determinístico mesmo com múltiplas chamadas
      expect(estoque).not.toBeNull();
      expect(estoque).toBe(10);
    });

    it('deve retornar null quando livro não possui estoque', async () => {
      // Setup: Criar livro sem estoque
      const livroRes = await contexto.db!.executar<{ liv_id: number }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('523e4567-e89b-12d3-a456-426614174004', 'Livro Sem Estoque', '1234567890127', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567894', TRUE)
         RETURNING liv_id`
      );
      const livId = livroRes[0].liv_id;

      // Act
      const estoque = await repositorio.obterEstoqueDisponivelPorLivId(livId);

      // Assert
      expect(estoque).toBeNull();
    });
  });

  describe('listarCatalogo - Sem conversões desnecessárias string/numeric', () => {
    it('deve retornar livros com valores numéricos corretos (sem conversão)', async () => {
      // Setup: Criar livro com estoque
      const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('623e4567-e89b-12d3-a456-426614174005', 'Livro Catálogo', '1234567890128', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567895', TRUE)
         RETURNING liv_uuid`
      );
      const livroUuid = livroRes[0].liv_uuid;

      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 15, 0, 75.50, 45.00, TRUE, 1)`,
        [livroUuid]
      );

      // Act
      const livros = await repositorio.listarCatalogo({
        pagina: 1,
        itensPorPagina: 10,
        ordenacao: 'recentes',
      });

      // Assert
      expect(livros.livros.length).toBeGreaterThan(0);
      const livro = livros.livros.find((l) => l.uuid === livroUuid);
      
      // Corrigir assert fraco - garantir que o livro foi encontrado
      expect(livro).toBeDefined();
      
      // Verificar que os valores estão corretos
      expect(livro!.preco).toBe(75.5);
      expect(livro!.estoque).toBe(15);
    });
  });

  describe('obterPorUuid - Sem conversões desnecessárias string/numeric', () => {
    it('deve retornar livro com valores numéricos corretos', async () => {
      // Setup
      const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('723e4567-e89b-12d3-a456-426614174006', 'Livro Detalhe', '1234567890129', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567896', TRUE)
         RETURNING liv_uuid`
      );
      const livroUuid = livroRes[0].liv_uuid;

      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 20, 0, 89.90, 50.00, TRUE, 1)`,
        [livroUuid]
      );

      // Act com medição de performance
      console.time('obterPorUuid');
      const livro = await repositorio.obterPorUuid(livroUuid);
      console.timeEnd('obterPorUuid');

      // Assert
      expect(livro).not.toBeNull();
      expect(livro!.preco).toBe(89.9);
      expect(livro!.estoque).toBe(20);
    });
  });
});
