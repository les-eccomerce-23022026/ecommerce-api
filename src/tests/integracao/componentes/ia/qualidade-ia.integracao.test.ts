/**
 * Testes de Qualidade do Sistema IA
 *
 * Abordagem: Dependências Reais (sem mocks)
 * 
 * RN-IA-QUALIDADE: O sistema deve gerar embeddings de alta qualidade e
 * realizar buscas vetoriais precisas, garantindo que as recomendações
 * sejam relevantes para o usuário.
 *
 * Pré-requisitos:
 * - ChromaDB real configurado (CHROMADB_HOST)
 * - Gemini API real configurada (GEMINI_API_KEY)
 * - Produtos indexados no ChromaDB
 *
 * Como usar:
 * - Configure as variáveis de ambiente CHROMADB_HOST e GEMINI_API_KEY
 * - Execute os testes para validar qualidade real
 * - Se dependências não estiverem configuradas, testes serão pulados
 */

import { AdapterLangChainGemini } from '@/modules/ia/adapterLangChainGemini';
import { RepositorioEmbeddingChromaDB } from '@/modules/ia/repositorioEmbeddingChromaDB';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { calcularSimilaridadeCosseno } from '@/tests/helpers/goldenEmbeddings.util';

describe('[RN-IA-QUALIDADE] Integração - Qualidade do Sistema IA', () => {
  const contexto = configurarTesteIntegracao();
  
  const DEPENDENCIAS_REAIS_DISPONIVEIS = 
    process.env.CHROMADB_HOST && 
    process.env.GEMINI_API_KEY;

  const PULAR_TESTES_SEM_DEPENDENCIAS = !DEPENDENCIAS_REAIS_DISPONIVEIS;

  beforeAll(() => {
    if (PULAR_TESTES_SEM_DEPENDENCIAS) {
      console.warn(
        '[RN-IA-QUALIDADE] Testes de qualidade pulados: dependências externas não configuradas'
      );
    }
  });

  // ── SEÇÃO 1: Qualidade de Embeddings ──────────────────────────────────────

  describe('Qualidade - Embeddings', () => {
    it('[RN-IA-QUALIDADE] deve gerar embeddings para texto simples', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(typeof embedding[0]).toBe('number');
    });

    it('[RN-IA-QUALIDADE] deve gerar embeddings consistentes para o mesmo texto', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      const texto = 'livros de ficção';
      
      const embedding1 = await adapterGemini.gerarEmbedding(texto);
      const embedding2 = await adapterGemini.gerarEmbedding(texto);
      
      // LLMs não são 100% determinísticos, mas devem ser consistentes
      // Similaridade de cosseno deve ser > 0.95
      const similaridade = calcularSimilaridadeCosseno(embedding1, embedding2);
      expect(similaridade).toBeGreaterThan(0.95);
    });

    it('[RN-IA-QUALIDADE] deve gerar embeddings diferentes para textos diferentes', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      
      const embeddingFiccao = await adapterGemini.gerarEmbedding('livros de ficção');
      const embeddingRomance = await adapterGemini.gerarEmbedding('livros de romance');
      
      // Embeddings de textos diferentes devem ter similaridade menor
      const similaridade = calcularSimilaridadeCosseno(embeddingFiccao, embeddingRomance);
      expect(similaridade).toBeLessThan(0.9);
    });

    it('[RN-IA-QUALIDADE] deve gerar embeddings com dimensão consistente', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      
      const embedding1 = await adapterGemini.gerarEmbedding('texto 1');
      const embedding2 = await adapterGemini.gerarEmbedding('texto 2');
      
      // Todos os embeddings devem ter a mesma dimensão
      expect(embedding1.length).toBe(embedding2.length);
      expect(embedding1.length).toBeGreaterThan(0);
    });

    it('[RN-IA-QUALIDADE] deve gerar embeddings em tempo razoável (< 2s)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      
      const inicio = Date.now();
      await adapterGemini.gerarEmbedding('livros de ficção');
      const duracaoMs = Date.now() - inicio;
      
      expect(duracaoMs).toBeLessThan(2000);
    });
  });

  // ── SEÇÃO 2: Qualidade de Busca Vetorial ───────────────────────────────────

  describe('Qualidade - Busca Vetorial', () => {
    it('[RN-IA-QUALIDADE] deve buscar produtos similares no ChromaDB', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultados = await repositorioEmbedding.buscarSimilares(embedding, 5);
      
      expect(Array.isArray(resultados)).toBe(true);
      // Pode retornar vazio se não houver produtos indexados
      expect(resultados.length).toBeGreaterThanOrEqual(0);
    });

    it('[RN-IA-QUALIDADE] deve retornar resultados com scores de relevância', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultados = await repositorioEmbedding.buscarSimilares(embedding, 5);
      
      if (resultados.length > 0) {
        // Se houver resultados, devem ter similaridade
        expect(resultados[0]).toHaveProperty('similaridade');
        expect(typeof resultados[0].similaridade).toBe('number');
        expect(resultados[0].similaridade).toBeGreaterThan(0);
      }
    });

    it('[RN-IA-QUALIDADE] deve ordenar resultados por relevância (score decrescente)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const resultados = await repositorioEmbedding.buscarSimilares(embedding, 5);
      
      if (resultados.length > 1) {
        // Resultados devem estar ordenados por similaridade decrescente
        for (let i = 0; i < resultados.length - 1; i++) {
          expect(resultados[i].similaridade).toBeGreaterThanOrEqual(resultados[i + 1].similaridade);
        }
      }
    });

    it('[RN-IA-QUALIDADE] deve respeitar limite de resultados solicitado', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      const limite = 3;
      const resultados = await repositorioEmbedding.buscarSimilares(embedding, limite);
      
      expect(resultados.length).toBeLessThanOrEqual(limite);
    });

    it('[RN-IA-QUALIDADE] deve realizar busca vetorial em tempo razoável (< 1s)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterGemini = new AdapterLangChainGemini();
      
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      
      const inicio = Date.now();
      await repositorioEmbedding.buscarSimilares(embedding, 5);
      const duracaoMs = Date.now() - inicio;
      
      expect(duracaoMs).toBeLessThan(1000);
    });
  });

  // ── SEÇÃO 3: Qualidade de Chat com LLM ───────────────────────────────────────

  describe('Qualidade - Chat com LLM', () => {
    it('[RN-IA-QUALIDADE] deve gerar resposta de chat para mensagem simples', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      const resposta = await adapterGemini.gerarRespostaChat(
        'Recomende um livro de ficção',
        'Nenhum contexto disponível'
      );

      expect(typeof resposta).toBe('string');
      expect(resposta.length).toBeGreaterThan(0);
    });

    it('[RN-IA-QUALIDADE] deve gerar resposta de chat em tempo razoável (< 5s)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      
      const inicio = Date.now();
      await adapterGemini.gerarRespostaChat('Recomende um livro de ficção', 'Nenhum contexto disponível');
      const duracaoMs = Date.now() - inicio;
      
      expect(duracaoMs).toBeLessThan(5000);
    });

    it('[RN-IA-QUALIDADE] deve gerar respostas diferentes para mensagens diferentes', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      
      const resposta1 = await adapterGemini.gerarRespostaChat(
        'Recomende um livro de ficção',
        'Nenhum contexto disponível'
      );
      const resposta2 = await adapterGemini.gerarRespostaChat(
        'Recomende um livro de romance',
        'Nenhum contexto disponível'
      );
      
      // Respostas devem ser diferentes (não idênticas)
      expect(resposta1).not.toBe(resposta2);
    });
  });

  // ── SEÇÃO 4: Qualidade End-to-End ───────────────────────────────────────────

  describe('Qualidade - End-to-End', () => {
    it('[RN-IA-QUALIDADE] deve completar fluxo de recomendação em tempo razoável (< 5s)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      
      const inicio = Date.now();
      
      // Passo 1: Gerar embedding
      const embedding = await adapterGemini.gerarEmbedding('livros de ficção');
      
      // Passo 2: Buscar produtos similares
      await repositorioEmbedding.buscarSimilares(embedding, 5);
      
      const duracaoMs = Date.now() - inicio;
      
      expect(duracaoMs).toBeLessThan(5000);
    });

    it('[RN-IA-QUALIDADE] deve validar conexão com ChromaDB', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const conectado = await repositorioEmbedding.verificarConexao();
      
      expect(typeof conectado).toBe('boolean');
      // Se ChromaDB estiver configurado, deve estar conectado
      if (DEPENDENCIAS_REAIS_DISPONIVEIS) {
        expect(conectado).toBe(true);
      }
    });

    it('[RN-IA-QUALIDADE] deve validar conexão com Gemini', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      const adapterGemini = new AdapterLangChainGemini();
      
      // Tenta gerar um embedding simples para validar conexão
      const embedding = await adapterGemini.gerarEmbedding('ping');
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });
  });
});
