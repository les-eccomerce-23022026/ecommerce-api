/**
 * Testes Unitários — Métricas de Avaliação do Motor de Recomendação (Fase 9)
 *
 * Valida os cálculos determinísticos de qualidade do motor de sugestões de livros:
 *
 * - Precision@K: proporção de recomendações que existem no catálogo da livraria
 * - Recall@K: cobertura dos produtos relevantes retornados ao cliente
 * - F1-Score: balanceamento harmônico entre precisão e recall
 * - Relevância Semântica: similaridade de cosseno entre vetores de embedding
 * - Consistência: determinismo das recomendações para a mesma entrada
 * - SLA de Resposta: limite máximo de 5 segundos por recomendação
 * - Taxa de Erro: máximo tolerado de 5% de falhas em recomendações
 *
 * RN-IA-001: Motor retorna apenas produtos existentes no catálogo
 * RN-IA-002: Recomendações devem ser semanticamente relevantes
 * RN-IA-003: Respostas dentro do SLA definido de 5 segundos
 * RN-IA-005: Taxa de erro tolerável de no máximo 5%
 */

import { ServicoValidacaoProdutos } from '@/modules/ia/domain/services/ServicoValidacaoProdutos';
import { ServicoGeracaoEmbedding } from '@/modules/ia/domain/services/ServicoGeracaoEmbedding';
import { ServicoRecomendacaoRAG } from '@/modules/ia/domain/services/ServicoRecomendacaoRAG';
import { ServicoRecomendacaoApplication } from '@/modules/ia/application/services/ServicoRecomendacaoApplication';
import { IRepositorioEmbedding } from '@/modules/ia/domain/repositories/IRepositorioEmbedding';
import { IRepositorioRecomendacao } from '@/modules/ia/domain/repositories/IRepositorioRecomendacao';
import { AdapterLangChainGemini } from '@/modules/ia/infrastructure/config/AdapterLangChainGemini';
import { ServicoIndexacaoProdutos } from '@/modules/ia/application/services/ServicoIndexacaoProdutos';
import { IContextoRecomendacao } from '@/modules/ia/domain/entities/IContextoRecomendacao.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Funções auxiliares para cálculo de métricas determinísticas
// Encapsulam as fórmulas padrão de IR (Information Retrieval)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recall@K — proporção dos produtos relevantes que foram recuperados
 *
 * recall = |recomendados ∩ relevantes| / |relevantes|
 *
 * @param recomendados UUIDs dos produtos sugeridos pelo motor
 * @param relevantes   UUIDs dos produtos que deveriam ter sido sugeridos
 */
function calcularRecall(recomendados: string[], relevantes: string[]): number {
  if (relevantes.length === 0) return 0;
  const recuperados = recomendados.filter((uuid) => relevantes.includes(uuid));
  return recuperados.length / relevantes.length;
}

/**
 * F1-Score — média harmônica entre precisão e recall
 *
 * f1 = 2 × (precisao × recall) / (precisao + recall)
 *
 * @param precisao Precision@K calculada pelo ServicoValidacaoProdutos
 * @param recall   Recall@K calculado pela função auxiliar acima
 */
function calcularF1Score(precisao: number, recall: number): number {
  if (precisao + recall === 0) return 0;
  return (2 * precisao * recall) / (precisao + recall);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fábrica de mocks para evitar duplicação nos blocos de SLA e Taxa de Erro
// ─────────────────────────────────────────────────────────────────────────────

function criarMockRepositorioEmbedding(
  resultadoSimilares: { produtoUuid: string; similaridade: number; metadados: unknown }[] = [],
): jest.Mocked<IRepositorioEmbedding> {
  return {
    criar: jest.fn(),
    buscarPorProdutoUuid: jest.fn(),
    buscarSimilares: jest.fn().mockResolvedValue(resultadoSimilares),
    atualizar: jest.fn(),
    remover: jest.fn(),
    indexarCatalogo: jest.fn(),
    limparColecao: jest.fn(),
  } as jest.Mocked<IRepositorioEmbedding>;
}

function criarMockRepositorioRecomendacao(): jest.Mocked<IRepositorioRecomendacao> {
  return {
    buscarContexto: jest.fn().mockResolvedValue(null),
    salvarMetrica: jest.fn().mockResolvedValue(undefined),
    buscarMetricas: jest.fn().mockResolvedValue([]),
    buscarMetricasAgregadas: jest.fn().mockResolvedValue({}),
  } as jest.Mocked<IRepositorioRecomendacao>;
}

type MockAdapter = jest.Mocked<
  Pick<AdapterLangChainGemini, 'gerarEmbedding' | 'gerarRespostaChat' | 'gerarEmbeddingsLote' | 'validarConexao'>
>;

function criarMockAdapter(embeddingRetornado: number[] = [0.1, 0.2, 0.3]): MockAdapter {
  return {
    gerarEmbedding: jest.fn().mockResolvedValue(embeddingRetornado),
    gerarRespostaChat: jest.fn().mockResolvedValue('Resposta simulada de recomendação.'),
    gerarEmbeddingsLote: jest.fn().mockResolvedValue([embeddingRetornado]),
    validarConexao: jest.fn().mockResolvedValue(true),
  };
}

function criarServicoApplication(
  repositorioEmbedding: IRepositorioEmbedding,
  repositorioRecomendacao: IRepositorioRecomendacao,
  adapterOverride?: MockAdapter,
): ServicoRecomendacaoApplication {
  const servicoEmbedding = new ServicoGeracaoEmbedding();
  const servicoValidacao = new ServicoValidacaoProdutos();
  const servicoRAG = new ServicoRecomendacaoRAG(repositorioEmbedding, servicoEmbedding, servicoValidacao);
  const adapter = adapterOverride ?? criarMockAdapter();
  const indexacaoMock = { indexarCatalogo: jest.fn().mockResolvedValue(0) };

  return new ServicoRecomendacaoApplication(
    repositorioEmbedding,
    repositorioRecomendacao,
    servicoEmbedding,
    servicoValidacao,
    servicoRAG,
    adapter as unknown as AdapterLangChainGemini,
    indexacaoMock as unknown as ServicoIndexacaoProdutos,
  );
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Métricas de Avaliação do Motor de Recomendação de Livros', () => {
  const servicoValidacao = new ServicoValidacaoProdutos();
  const servicoEmbedding = new ServicoGeracaoEmbedding();

  // ─── Precision@K ──────────────────────────────────────────────────────────
  describe('Precision@K — proporção de sugestões existentes no catálogo', () => {
    it('deve calcular Precision@5 = 1.0 quando todos os 5 produtos recomendados existem', () => {
      const recomendados = ['uuid-a', 'uuid-b', 'uuid-c', 'uuid-d', 'uuid-e'];
      const catalogo = new Set(['uuid-a', 'uuid-b', 'uuid-c', 'uuid-d', 'uuid-e', 'uuid-f']);

      const precisao = servicoValidacao.calcularPrecisao(recomendados, catalogo);

      expect(precisao).toBe(1.0);
    });

    it('deve calcular Precision@5 = 0.6 quando 3 de 5 produtos recomendados existem no catálogo', () => {
      const recomendados = ['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4', 'uuid-5'];
      const catalogo = new Set(['uuid-1', 'uuid-3', 'uuid-5']); // 3 de 5 existem

      const precisao = servicoValidacao.calcularPrecisao(recomendados, catalogo);

      expect(precisao).toBeCloseTo(3 / 5, 10);
    });

    it('deve calcular Precision@3 = 1/3 quando apenas 1 de 3 produtos existe no catálogo', () => {
      const recomendados = ['uuid-x', 'uuid-y', 'uuid-z'];
      const catalogo = new Set(['uuid-z']); // apenas o último existe

      const precisao = servicoValidacao.calcularPrecisao(recomendados, catalogo);

      expect(precisao).toBeCloseTo(1 / 3, 5);
    });

    it('deve calcular Precision@K = 0.0 quando nenhum produto recomendado existe no catálogo', () => {
      const recomendados = ['uuid-fantasma-1', 'uuid-fantasma-2', 'uuid-fantasma-3'];
      const catalogo = new Set(['uuid-real-1', 'uuid-real-2']);

      const precisao = servicoValidacao.calcularPrecisao(recomendados, catalogo);

      expect(precisao).toBe(0);
    });

    it('deve retornar Precision@K = 0 para lista de recomendados vazia', () => {
      const catalogo = new Set(['uuid-existente-1']);

      const precisao = servicoValidacao.calcularPrecisao([], catalogo);

      expect(precisao).toBe(0);
    });

    it('deve calcular precisão correta para uma única recomendação existente', () => {
      const recomendados = ['uuid-unico'];
      const catalogo = new Set(['uuid-unico']);

      const precisao = servicoValidacao.calcularPrecisao(recomendados, catalogo);

      expect(precisao).toBe(1.0);
    });

    it('deve filtrar apenas produtos existentes ao validar lista de recomendações', () => {
      const recomendados = ['uuid-a', 'uuid-b', 'uuid-c', 'uuid-d'];
      const catalogo = new Set(['uuid-a', 'uuid-c']);

      const validos = servicoValidacao.filtrarProdutosExistentes(recomendados, catalogo);

      expect(validos).toHaveLength(2);
      expect(validos).toContain('uuid-a');
      expect(validos).toContain('uuid-c');
      expect(validos).not.toContain('uuid-b');
      expect(validos).not.toContain('uuid-d');
    });
  });

  // ─── Recall@K ─────────────────────────────────────────────────────────────
  describe('Recall@K — cobertura dos produtos relevantes na lista de sugestões', () => {
    it('deve calcular Recall@3 = 1.0 quando todos os produtos relevantes foram recomendados', () => {
      const recomendados = ['uuid-a', 'uuid-b', 'uuid-c'];
      const relevantes = ['uuid-a', 'uuid-b', 'uuid-c'];

      const recall = calcularRecall(recomendados, relevantes);

      expect(recall).toBe(1.0);
    });

    it('deve calcular Recall@K = 0.5 quando metade dos produtos relevantes foi recuperada', () => {
      const recomendados = ['uuid-a', 'uuid-c', 'uuid-x']; // 2 de 4 relevantes
      const relevantes = ['uuid-a', 'uuid-b', 'uuid-c', 'uuid-d'];

      const recall = calcularRecall(recomendados, relevantes);

      expect(recall).toBeCloseTo(0.5, 10);
    });

    it('deve calcular Recall@K = 0.25 quando 1 de 4 relevantes foi recuperado', () => {
      const recomendados = ['uuid-a', 'uuid-x', 'uuid-y'];
      const relevantes = ['uuid-a', 'uuid-b', 'uuid-c', 'uuid-d'];

      const recall = calcularRecall(recomendados, relevantes);

      expect(recall).toBeCloseTo(0.25, 10);
    });

    it('deve calcular Recall@K = 0.0 quando nenhum produto relevante foi recomendado', () => {
      const recomendados = ['uuid-x', 'uuid-y', 'uuid-z'];
      const relevantes = ['uuid-a', 'uuid-b'];

      const recall = calcularRecall(recomendados, relevantes);

      expect(recall).toBe(0);
    });

    it('deve retornar Recall@K = 0 quando a lista de relevantes está vazia', () => {
      const recomendados = ['uuid-a'];

      const recall = calcularRecall(recomendados, []);

      expect(recall).toBe(0);
    });

    it('deve calcular recall = 1/3 quando 1 de 3 produtos relevantes está nas sugestões', () => {
      const recomendados = ['uuid-a', 'uuid-fora-1', 'uuid-fora-2'];
      const relevantes = ['uuid-a', 'uuid-b', 'uuid-c'];

      const recall = calcularRecall(recomendados, relevantes);

      expect(recall).toBeCloseTo(1 / 3, 5);
    });
  });

  // ─── F1-Score ─────────────────────────────────────────────────────────────
  describe('F1-Score — balanceamento harmônico entre precisão e recall', () => {
    it('deve calcular F1-Score = 1.0 quando precisão e recall são ambos perfeitos', () => {
      const f1 = calcularF1Score(1.0, 1.0);

      expect(f1).toBe(1.0);
    });

    it('deve calcular F1-Score ≈ 0.6315 para precisão 0.6 e recall 2/3', () => {
      // F1 = 2 × (0.6 × 0.667) / (0.6 + 0.667) ≈ 0.6315
      const f1 = calcularF1Score(0.6, 2 / 3);

      expect(f1).toBeGreaterThan(0.63);
      expect(f1).toBeLessThan(0.64);
    });

    it('deve calcular F1-Score = 0.5 quando precisão = 1.0 e recall = 1/3', () => {
      // F1 = 2 × (1.0 × 0.333) / (1.0 + 0.333) = 0.667 / 1.333 = 0.5
      const f1 = calcularF1Score(1.0, 1 / 3);

      expect(f1).toBeCloseTo(0.5, 5);
    });

    it('deve retornar F1-Score = 0 quando a precisão é zero', () => {
      const f1 = calcularF1Score(0, 0.8);

      expect(f1).toBe(0);
    });

    it('deve retornar F1-Score = 0 quando o recall é zero', () => {
      const f1 = calcularF1Score(0.9, 0);

      expect(f1).toBe(0);
    });

    it('deve retornar F1-Score = 0 quando ambos precisão e recall são zero', () => {
      const f1 = calcularF1Score(0, 0);

      expect(f1).toBe(0);
    });

    it('deve validar que F1-Score fica entre min e max de (precisão, recall) para vários cenários', () => {
      const cenarios = [
        { precisao: 0.8, recall: 0.6 },
        { precisao: 0.5, recall: 0.5 },
        { precisao: 1.0, recall: 0.2 },
        { precisao: 0.3, recall: 0.9 },
        { precisao: 0.7, recall: 0.7 },
      ];

      for (const { precisao, recall } of cenarios) {
        const f1 = calcularF1Score(precisao, recall);
        expect(f1).toBeGreaterThanOrEqual(Math.min(precisao, recall));
        expect(f1).toBeLessThanOrEqual(Math.max(precisao, recall));
      }
    });

    it('deve calcular F1-Score simétrico: inverter precisão e recall produz o mesmo resultado', () => {
      const f1Direto = calcularF1Score(0.4, 0.8);
      const f1Invertido = calcularF1Score(0.8, 0.4);

      expect(f1Direto).toBeCloseTo(f1Invertido, 10);
    });
  });

  // ─── Relevância Semântica ─────────────────────────────────────────────────
  describe('Relevância Semântica — similaridade de cosseno entre embeddings', () => {
    it('deve retornar similaridade = 1.0 para vetores idênticos (produto idêntico à query)', () => {
      const vetor = [0.1, 0.5, 0.3, 0.8, 0.2];

      const similaridade = servicoEmbedding.calcularSimilaridadeCosseno(vetor, vetor);

      expect(similaridade).toBeCloseTo(1.0, 5);
    });

    it('deve retornar similaridade = 0.0 para vetores ortogonais (sem relação semântica)', () => {
      const vetorQuery = [1, 0, 0];
      const vetorProduto = [0, 1, 0];

      const similaridade = servicoEmbedding.calcularSimilaridadeCosseno(vetorQuery, vetorProduto);

      expect(similaridade).toBeCloseTo(0.0, 10);
    });

    it('deve retornar similaridade no intervalo [0, 1] para vetores com componentes positivas', () => {
      const vetor1 = [0.2, 0.4, 0.6, 0.8];
      const vetor2 = [0.8, 0.6, 0.4, 0.2];

      const similaridade = servicoEmbedding.calcularSimilaridadeCosseno(vetor1, vetor2);

      expect(similaridade).toBeGreaterThanOrEqual(0);
      expect(similaridade).toBeLessThanOrEqual(1);
    });

    it('deve calcular similaridade ≈ 0.8165 para vetores [1,1,1] e [1,1,0]', () => {
      // cos θ = (1×1 + 1×1 + 1×0) / (√3 × √2) = 2 / √6 ≈ 0.8165
      const vetor1 = [1, 1, 1];
      const vetor2 = [1, 1, 0];

      const similaridade = servicoEmbedding.calcularSimilaridadeCosseno(vetor1, vetor2);

      expect(similaridade).toBeCloseTo(2 / Math.sqrt(6), 5);
    });

    it('deve retornar similaridade = 0 quando um dos vetores tem norma zero', () => {
      const vetorNulo = [0, 0, 0];
      const vetorNormal = [1, 0, 0];

      const similaridade = servicoEmbedding.calcularSimilaridadeCosseno(vetorNulo, vetorNormal);

      expect(similaridade).toBe(0);
    });

    it('deve lançar erro ao comparar embeddings com dimensões diferentes', () => {
      const vetor3D = [1, 2, 3];
      const vetor2D = [1, 2];

      expect(() => servicoEmbedding.calcularSimilaridadeCosseno(vetor3D, vetor2D)).toThrow(
        'Embeddings devem ter o mesmo tamanho',
      );
    });

    it('deve validar embedding com todos os valores finitos como válido', () => {
      const embeddingValido = [0.1, 0.2, 0.3, 0.4, 0.5];

      expect(servicoEmbedding.validarEmbedding(embeddingValido)).toBe(true);
    });

    it('deve rejeitar embedding contendo valores NaN', () => {
      expect(servicoEmbedding.validarEmbedding([0.1, NaN, 0.3])).toBe(false);
    });

    it('deve rejeitar embedding contendo valores Infinity', () => {
      expect(servicoEmbedding.validarEmbedding([0.1, Infinity, 0.3])).toBe(false);
    });

    it('deve rejeitar embedding vazio (array sem elementos)', () => {
      expect(servicoEmbedding.validarEmbedding([])).toBe(false);
    });

    it('deve rejeitar input que não é array', () => {
      expect(servicoEmbedding.validarEmbedding(null as unknown as number[])).toBe(false);
    });

    it('deve calcular similaridade alta (> 0.9) para vetores semanticamente próximos', () => {
      const base = [0.5, 0.5, 0.5, 0.5];
      const similar = [0.51, 0.49, 0.50, 0.50];

      const similaridade = servicoEmbedding.calcularSimilaridadeCosseno(base, similar);

      expect(similaridade).toBeGreaterThan(0.9);
    });

    it('deve gerar texto de produto com todos os campos obrigatórios para embedding', () => {
      const metadados = {
        titulo: 'Clean Code',
        autor: 'Robert C. Martin',
        categoria: 'Engenharia de Software',
        isbn: '978-0132350884',
        sinopse: 'Boas práticas de desenvolvimento',
      };

      const texto = servicoEmbedding.gerarTextoProduto(metadados);

      expect(texto).toContain('Clean Code');
      expect(texto).toContain('Robert C. Martin');
      expect(texto).toContain('Engenharia de Software');
      expect(texto).toContain('978-0132350884');
      expect(texto).toContain('Boas práticas de desenvolvimento');
    });

    it('deve gerar texto de produto sem sinopse quando campo opcional não é fornecido', () => {
      const metadados = {
        titulo: 'O Programador Pragmático',
        autor: 'Dave Thomas',
        categoria: 'Desenvolvimento',
        isbn: '978-0135957059',
      };

      const texto = servicoEmbedding.gerarTextoProduto(metadados);

      expect(texto).toContain('O Programador Pragmático');
      expect(texto).toContain('Dave Thomas');
      expect(texto).not.toContain('Sinopse');
    });
  });

  // ─── Consistência das Recomendações ───────────────────────────────────────
  describe('Consistência — determinismo para a mesma entrada de busca', () => {
    const produtosSimilaresFixos = [
      {
        produtoUuid: 'uuid-livro-ts',
        similaridade: 0.95,
        metadados: { titulo: 'TypeScript Avançado', autor: 'Autor A', categoria: 'Programação', preco: 89.9 },
      },
      {
        produtoUuid: 'uuid-livro-js',
        similaridade: 0.87,
        metadados: { titulo: 'JavaScript Moderno', autor: 'Autor B', categoria: 'Programação', preco: 59.9 },
      },
      {
        produtoUuid: 'uuid-livro-node',
        similaridade: 0.78,
        metadados: { titulo: 'Node.js na Prática', autor: 'Autor C', categoria: 'Backend', preco: 49.9 },
      },
    ];

    let repositorioEmbeddingMock: jest.Mocked<IRepositorioEmbedding>;
    let servicoRAG: ServicoRecomendacaoRAG;

    beforeEach(() => {
      repositorioEmbeddingMock = criarMockRepositorioEmbedding(produtosSimilaresFixos);
      servicoRAG = new ServicoRecomendacaoRAG(repositorioEmbeddingMock, servicoEmbedding, servicoValidacao);
    });

    it('deve retornar a mesma ordem de produtos para a mesma query e mesmo embedding', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const catalogoExistentes = new Set(['uuid-livro-ts', 'uuid-livro-js', 'uuid-livro-node']);

      const resultado1 = await servicoRAG.gerarRecomendacao(
        'programação TypeScript',
        queryEmbedding,
        null,
        catalogoExistentes,
        3,
      );
      const resultado2 = await servicoRAG.gerarRecomendacao(
        'programação TypeScript',
        queryEmbedding,
        null,
        catalogoExistentes,
        3,
      );

      expect(resultado1.produtos.map((p) => p.uuid)).toEqual(resultado2.produtos.map((p) => p.uuid));
      expect(resultado1.produtos.map((p) => p.similaridade)).toEqual(
        resultado2.produtos.map((p) => p.similaridade),
      );
    });

    it('deve retornar a mesma quantidade de produtos para a mesma entrada', async () => {
      const queryEmbedding = [0.5, 0.5, 0.5, 0.5, 0.5];
      const catalogoExistentes = new Set(['uuid-livro-ts', 'uuid-livro-js', 'uuid-livro-node']);

      const resultado1 = await servicoRAG.gerarRecomendacao('backend', queryEmbedding, null, catalogoExistentes, 2);
      const resultado2 = await servicoRAG.gerarRecomendacao('backend', queryEmbedding, null, catalogoExistentes, 2);

      expect(resultado1.totalEncontrados).toBe(resultado2.totalEncontrados);
      expect(resultado1.totalValidos).toBe(resultado2.totalValidos);
      expect(resultado1.produtos.length).toBe(resultado2.produtos.length);
    });

    it('deve preservar contextoUsado = false quando nenhum contexto de cliente é fornecido', async () => {
      const catalogoExistentes = new Set(['uuid-livro-ts']);

      const resultado = await servicoRAG.gerarRecomendacao(
        'livros de programação',
        [0.1, 0.2],
        null,
        catalogoExistentes,
        1,
      );

      expect(resultado.contextoUsado).toBe(false);
    });

    it('deve preservar contextoUsado = true quando contexto do cliente é fornecido', async () => {
      const contextoCliente: IContextoRecomendacao = {
        clienteUuid: 'uuid-cliente-teste',
        historicoCompras: [],
        preferencias: {
          categorias: ['Programação'],
          autores: ['Autor A'],
          faixaPreco: { min: 30, max: 100 },
        },
      };
      const catalogoExistentes = new Set(['uuid-livro-ts', 'uuid-livro-js', 'uuid-livro-node']);

      const resultado = await servicoRAG.gerarRecomendacao(
        'livros técnicos',
        [0.1, 0.2],
        contextoCliente,
        catalogoExistentes,
        3,
      );

      expect(resultado.contextoUsado).toBe(true);
    });

    it('deve retornar totalEncontrados igual ao total retornado pelo índice semântico', async () => {
      const catalogoExistentes = new Set(['uuid-livro-ts', 'uuid-livro-js', 'uuid-livro-node']);

      const resultado = await servicoRAG.gerarRecomendacao('tech', [0.1], null, catalogoExistentes, 10);

      // ChromaDB retornou 3 produtos (produtosSimilaresFixos)
      expect(resultado.totalEncontrados).toBe(produtosSimilaresFixos.length);
    });

    it('deve ordenar produtos por similaridade decrescente quando não há contexto de preferências', async () => {
      const catalogoExistentes = new Set(['uuid-livro-ts', 'uuid-livro-js', 'uuid-livro-node']);

      const resultado = await servicoRAG.gerarRecomendacao('programação', [0.1], null, catalogoExistentes, 3);

      const similaridades = resultado.produtos.map((p) => p.similaridade);
      for (let i = 1; i < similaridades.length; i++) {
        expect(similaridades[i - 1]).toBeGreaterThanOrEqual(similaridades[i]);
      }
    });

    it('deve filtrar produtos que não estão no catálogo antes de retornar ao cliente', async () => {
      const catalogoExistentes = new Set(['uuid-livro-ts']); // apenas 1 de 3 existe

      const resultado = await servicoRAG.gerarRecomendacao('programação', [0.1], null, catalogoExistentes, 3);

      expect(resultado.totalEncontrados).toBe(3);
      expect(resultado.totalValidos).toBe(1);
      expect(resultado.produtos).toHaveLength(1);
      expect(resultado.produtos[0].uuid).toBe('uuid-livro-ts');
    });
  });

  // ─── SLA de Tempo de Resposta ─────────────────────────────────────────────
  describe('SLA de Tempo de Resposta — recomendações devem responder em até 5 segundos', () => {
    const SLA_MAXIMO_MS = 5_000;

    let servicoApplication: ServicoRecomendacaoApplication;

    beforeEach(() => {
      const repositorioEmbedding = criarMockRepositorioEmbedding();
      const repositorioRecomendacao = criarMockRepositorioRecomendacao();
      servicoApplication = criarServicoApplication(repositorioEmbedding, repositorioRecomendacao);
    });

    it('deve responder dentro do SLA de 5 segundos para uma query de livros simples', async () => {
      const inicio = Date.now();

      await servicoApplication.recomendar({ query: 'livros de Python' });

      const duracao = Date.now() - inicio;
      expect(duracao).toBeLessThan(SLA_MAXIMO_MS);
    });

    it('deve retornar tempoRespostaMs menor que o SLA de 5 segundos', async () => {
      const resultado = await servicoApplication.recomendar({ query: 'romances brasileiros' });

      expect(resultado.tempoRespostaMs).toBeLessThan(SLA_MAXIMO_MS);
    });

    it('deve retornar tempoRespostaMs como número não-negativo', async () => {
      const resultado = await servicoApplication.recomendar({ query: 'ficção científica clássica' });

      expect(typeof resultado.tempoRespostaMs).toBe('number');
      expect(resultado.tempoRespostaMs).toBeGreaterThanOrEqual(0);
    });

    it('deve incluir tempoRespostaMs na resposta independente de o catálogo estar vazio', async () => {
      const resultado = await servicoApplication.recomendar({ query: 'qualquer busca' });

      expect(resultado).toHaveProperty('tempoRespostaMs');
      expect(resultado.tempoRespostaMs).not.toBeNaN();
    });
  });

  // ─── Taxa de Erro ─────────────────────────────────────────────────────────
  describe('Taxa de Erro — máximo de 5% de falhas toleradas nas recomendações', () => {
    const TAXA_ERRO_MAXIMA = 0.05;
    const TOTAL_REQUISICOES = 20;

    it('deve manter taxa de erro = 0% para adapter confiável em 20 requisições consecutivas', async () => {
      const repositorioEmbedding = criarMockRepositorioEmbedding();
      const repositorioRecomendacao = criarMockRepositorioRecomendacao();
      const servicoApp = criarServicoApplication(repositorioEmbedding, repositorioRecomendacao);

      let falhas = 0;
      const queries = Array.from({ length: TOTAL_REQUISICOES }, (_, i) => `livro de categoria ${i + 1}`);

      for (const query of queries) {
        try {
          await servicoApp.recomendar({ query });
        } catch {
          falhas++;
        }
      }

      const taxaErro = falhas / TOTAL_REQUISICOES;
      expect(taxaErro).toBeLessThanOrEqual(TAXA_ERRO_MAXIMA);
    });

    it('deve contabilizar como falha quando o adapter lança exceção na geração de embedding', async () => {
      const repositorioEmbedding = criarMockRepositorioEmbedding();
      const repositorioRecomendacao = criarMockRepositorioRecomendacao();
      const adapterComFalha = criarMockAdapter();
      adapterComFalha.gerarEmbedding.mockRejectedValue(new Error('Falha de conexão com Gemini API'));

      const servicoComFalha = criarServicoApplication(repositorioEmbedding, repositorioRecomendacao, adapterComFalha);

      await expect(servicoComFalha.recomendar({ query: 'qualquer busca' })).rejects.toThrow();
    });

    it('deve calcular taxa de erro = 0% quando todas as 20 chamadas paralelas são bem-sucedidas', async () => {
      const repositorioEmbedding = criarMockRepositorioEmbedding();
      const repositorioRecomendacao = criarMockRepositorioRecomendacao();
      const servicoApp = criarServicoApplication(repositorioEmbedding, repositorioRecomendacao);

      const resultados = await Promise.allSettled(
        Array.from({ length: TOTAL_REQUISICOES }, (_, i) =>
          servicoApp.recomendar({ query: `busca paralela ${i + 1}` }),
        ),
      );

      const falhas = resultados.filter((r) => r.status === 'rejected').length;
      const taxaErro = falhas / TOTAL_REQUISICOES;

      expect(taxaErro).toBe(0);
      expect(taxaErro).toBeLessThanOrEqual(TAXA_ERRO_MAXIMA);
    });

    it('deve validar que 5% é o limite máximo aceitável (1 falha em 20 = limite exato)', () => {
      const totalChamadas = 20;
      const totalFalhas = 1;

      const taxaErro = totalFalhas / totalChamadas;

      expect(taxaErro).toBe(TAXA_ERRO_MAXIMA);
      expect(taxaErro).toBeLessThanOrEqual(TAXA_ERRO_MAXIMA);
    });

    it('deve detectar violação do SLA de erros quando 2 de 20 chamadas falham (10% > 5%)', () => {
      const totalChamadas = 20;
      const totalFalhas = 2;

      const taxaErro = totalFalhas / totalChamadas;

      // 10% ultrapassa o limite tolerado de 5%
      expect(taxaErro).toBeGreaterThan(TAXA_ERRO_MAXIMA);
    });
  });
});
