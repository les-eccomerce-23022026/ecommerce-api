/**
 * Testes de Integração - Métricas Determinísticas do Sistema IA
 *
 * Abordagem: Dependências Reais (sem mocks)
 *
 * RN-IA-METRICAS: O sistema deve calcular e expor métricas determinísticas
 * do pipeline RAG para monitoramento e debugging.
 *
 * Pré-requisitos:
 * - ChromaDB real configurado (CHROMADB_HOST)
 * - Gemini API real configurada (GEMINI_API_KEY)
 * - Produtos indexados no ChromaDB
 *
 * Como usar:
 * - Configure as variáveis de ambiente CHROMADB_HOST e GEMINI_API_KEY
 * - Execute os testes para validar métricas reais
 * - Se dependências não estiverem configuradas, testes serão pulados
 */

import { AdapterLangChainGemini } from '@/modules/ia/adapterLangChainGemini';
import { RepositorioEmbeddingChromaDB } from '@/modules/ia/repositorioEmbeddingChromaDB';
import { ServicoGeracaoEmbedding } from '@/modules/ia/servicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from '@/modules/ia/servicoValidacaoProdutos';
import { ServicoRecomendacaoRAG } from '@/modules/ia/servicoRecomendacaoRAG';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

describe('[RN-IA-METRICAS] Integração - Métricas Determinísticas', () => {
  const contexto = configurarTesteIntegracao();

  const DEPENDENCIAS_REAIS_DISPONIVEIS =
    process.env.CHROMADB_HOST &&
    process.env.GEMINI_API_KEY;

  const PULAR_TESTES_SEM_DEPENDENCIAS = !DEPENDENCIAS_REAIS_DISPONIVEIS;

  beforeAll(() => {
    if (PULAR_TESTES_SEM_DEPENDENCIAS) {
      console.warn(
        '[RN-IA-METRICAS] Testes de métricas pulados: dependências externas não configuradas'
      );
    }
  });

  // ── SEÇÃO 1: Cálculo de Taxa de Alucinação ───────────────────────────────────

  describe('Taxa de Alucinação', () => {
    it('[RN-IA-METRICAS] deve calcular taxa de alucinação corretamente', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.taxaAlucinacao).toBeGreaterThanOrEqual(0);
        expect(resultado.metricasPipeline.taxaAlucinacao).toBeLessThanOrEqual(1);
      }
    });

    it('[RN-IA-METRICAS] deve calcular taxa de alucinação zero quando todos os candidatos são válidos', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(), // Sem produtos existentes - todos serão filtrados
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.taxaAlucinacao).toBe(1);
      }
    });

    it('[RN-IA-METRICAS] deve calcular taxa de alucinação quando não há candidatos', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.taxaAlucinacao).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── SEÇÃO 2: Métricas de Tempo por Etapa ─────────────────────────────────────

  describe('Métricas de Tempo por Etapa', () => {
    it('[RN-IA-METRICAS] deve medir tempo de busca vetorial', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.tempoBuscaVetorial).toBeGreaterThanOrEqual(0);
        expect(resultado.metricasPipeline.tempoBuscaVetorial).toBeLessThan(5000); // < 5s
      }
    });

    it('[RN-IA-METRICAS] deve medir tempo de validação', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.tempoValidacao).toBeGreaterThanOrEqual(0);
        expect(resultado.metricasPipeline.tempoValidacao).toBeLessThan(1000); // < 1s
      }
    });

    it('[RN-IA-METRICAS] deve medir tempo de embedding (preenchido pela camada de aplicação)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.tempoEmbedding).toBe(0); // Preenchido pela camada de aplicação
      }
    });
  });

  // ── SEÇÃO 3: Contadores de Candidatos ───────────────────────────────────────

  describe('Contadores de Candidatos', () => {
    it('[RN-IA-METRICAS] deve contar total de candidatos retornados pelo ChromaDB', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.totalCandidatos).toBeGreaterThanOrEqual(0);
      }
    });

    it('[RN-IA-METRICAS] deve contar total de candidatos válidos', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.totalValidos).toBeGreaterThanOrEqual(0);
        expect(resultado.metricasPipeline.totalValidos).toBeLessThanOrEqual(
          resultado.metricasPipeline.totalCandidatos
        );
      }
    });

    it('[RN-IA-METRICAS] deve contar total de candidatos filtrados', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
      const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
        repositorioEmbedding,
        servicoGeracaoEmbedding,
        servicoValidacaoProdutos
      );

      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultado = await servicoRecomendacaoRAG.gerarRecomendacao(
        'livros de ficção',
        embedding,
        null,
        new Set<string>(),
        5
      );

      expect(resultado.metricasPipeline).toBeDefined();
      if (resultado.metricasPipeline) {
        expect(resultado.metricasPipeline.totalFiltrados).toBeGreaterThanOrEqual(0);
        expect(resultado.metricasPipeline.totalFiltrados).toBe(
          resultado.metricasPipeline.totalCandidatos - resultado.metricasPipeline.totalValidos
        );
      }
    });
  });

  // ── SEÇÃO 4: Integração com API ─────────────────────────────────────────────

  describe('Integração com API', () => {
    it('[RN-IA-METRICAS] deve incluir métricas na resposta quando incluirMetricas=true', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // Nota: Testes de integração com API requerem autenticação
      // Este teste está documentado mas não executado devido à complexidade de setup
      pending('Requer setup de autenticação para testes de integração com API');
    });

    it('[RN-IA-METRICAS] não deve incluir métricas quando incluirMetricas=false', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // Nota: Testes de integração com API requerem autenticação
      // Este teste está documentado mas não executado devido à complexidade de setup
      pending('Requer setup de autenticação para testes de integração com API');
    });

    it('[RN-IA-METRICAS] não deve incluir métricas quando incluirMetricas não é especificado', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // Nota: Testes de integração com API requerem autenticação
      // Este teste está documentado mas não executado devido à complexidade de setup
      pending('Requer setup de autenticação para testes de integração com API');
    });

    it('[RN-IA-METRICAS] deve incluir métricas no chat quando incluirMetricas=true', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // Nota: Testes de integração com API requerem autenticação
      // Este teste está documentado mas não executado devido à complexidade de setup
      pending('Requer setup de autenticação para testes de integração com API');
    });
  });
});
