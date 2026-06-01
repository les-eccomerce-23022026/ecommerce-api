/**
 * Testes de Integração — Chat Tendências (intenção tendencias)
 *
 * Verifica que o assistente monta o contexto de tendências com dados reais
 * de vendas (agregados SQL via buscarTendenciasPorCategoria e
 * buscarTendenciasPorFaixaEtaria), e que o RAG complementar é acionado
 * apenas quando o cliente menciona uma categoria específica.
 *
 * RN-IA-004: Modo tendencias usa agregados de vendas reais; RAG é opcional por categoria.
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockBuscarSimilares,
  mockBuscarTendenciasPorCategoria,
  mockBuscarTendenciasPorFaixaEtaria,
  mockGerarRespostaChat,
  mockInterpretarIntencao,
} from '@/tests/helpers/setupMocksIA.util';

import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenClienteParaIa, postIaChat } from '@/tests/helpers/ia-integracao.helper';
import type {
  ITendenciaCategoriaContexto,
  ITendenciaFaixaEtariaContexto,
} from '@/modules/ia/domain/entities/IContextoRecomendacao.entity';

/** Intenção de tendências sem filtro de categoria (consulta geral). */
const intencaoTendenciasGeral = {
  tipo: 'tendencias' as const,
  generos: [],
  quantidadeLivros: 5,
  precisaEsclarecer: false,
  queryBusca: 'livros mais vendidos',
  confianca: 0.92,
};

/** Intenção de tendências com categoria explícita (aciona RAG). */
const intencaoTendenciasComGenero = {
  tipo: 'tendencias' as const,
  generos: ['romance'],
  quantidadeLivros: 3,
  precisaEsclarecer: false,
  queryBusca: 'romances mais vendidos',
  confianca: 0.90,
};

describe('[RF-IA-06] Integração - Chat Tendências (intenção tendencias)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  beforeEach(async () => {
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
    mockInterpretarIntencao.mockResolvedValue(intencaoTendenciasGeral);
  });

  // ── Roteamento de intenção ──────────────────────────────────────────────────

  describe('Roteamento de Intenção', () => {
    it('[RN-IA-004] deve retornar tipoResposta "tendencias" quando intenção é tendencias', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais são os livros mais vendidos?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.tipoResposta).toBe('tendencias');
    });

    it('[RN-IA-004] deve retornar estrutura completa (resposta, produtosRecomendados, tipoResposta) em tendencias', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais são os best-sellers do momento?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados).toHaveProperty('resposta');
      expect(resposta.body.dados).toHaveProperty('produtosRecomendados');
      expect(resposta.body.dados).toHaveProperty('tipoResposta');
      expect(resposta.body.dados).toHaveProperty('tempoRespostaMs');
      expect(Array.isArray(resposta.body.dados.produtosRecomendados)).toBe(true);
    });
  });

  // ── Consulta dos agregados SQL ─────────────────────────────────────────────

  describe('Consulta de Agregados SQL', () => {
    it('[RN-IA-004] deve acionar buscarTendenciasPorCategoria para montar contexto de vendas', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais categorias mais vendem?' });

      expect(mockBuscarTendenciasPorCategoria).toHaveBeenCalledTimes(1);
    });

    it('[RN-IA-004] deve acionar buscarTendenciasPorFaixaEtaria para enriquecer contexto com perfil etário', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais livros fazem sucesso entre jovens adultos?' });

      expect(mockBuscarTendenciasPorFaixaEtaria).toHaveBeenCalledTimes(1);
    });

    it('[RN-IA-004] deve consultar as duas dimensões (categoria e faixa etária) em todo fluxo de tendências', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Me mostre os mais vendidos' });

      expect(mockBuscarTendenciasPorCategoria).toHaveBeenCalled();
      expect(mockBuscarTendenciasPorFaixaEtaria).toHaveBeenCalled();
    });

    it('[RN-IA-004] deve chamar buscarTendenciasPorCategoria sem filtro quando intenção não tem gênero', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais os livros mais populares este mês?' });

      // Sem gênero na intenção → chama com undefined (busca geral, top 5 categorias)
      expect(mockBuscarTendenciasPorCategoria).toHaveBeenCalledWith(undefined);
    });

    it('[RN-IA-004] deve chamar buscarTendenciasPorCategoria com filtro quando intenção tem gênero', async () => {
      mockInterpretarIntencao.mockResolvedValueOnce(intencaoTendenciasComGenero);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais são os romances mais vendidos?' });

      expect(mockBuscarTendenciasPorCategoria).toHaveBeenCalledWith(['romance']);
    });

    it('[RN-IA-004] deve montar contexto com seção "Mais vendidos por categoria" quando há dados', async () => {
      const tendenciasMock: ITendenciaCategoriaContexto[] = [
        { categoria: 'Romance', titulosTop: ['O Alquimista', 'Orgulho e Preconceito'] },
        { categoria: 'Fantasia', titulosTop: ['O Senhor dos Anéis'] },
      ];
      mockBuscarTendenciasPorCategoria.mockResolvedValueOnce(tendenciasMock);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais categorias mais vendem?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Mais vendidos por categoria'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-004] deve incluir nomes de categorias e títulos no contexto enviado ao Gemini', async () => {
      const tendenciasMock: ITendenciaCategoriaContexto[] = [
        { categoria: 'Autoajuda', titulosTop: ['O Poder do Hábito', 'Mindset'] },
      ];
      mockBuscarTendenciasPorCategoria.mockResolvedValueOnce(tendenciasMock);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais os mais vendidos em autoajuda?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Autoajuda'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-004] deve montar contexto com seção "Mais vendidos por faixa etária" quando há dados', async () => {
      const faixasMock: ITendenciaFaixaEtariaContexto[] = [
        { faixa: '25-39', titulosTop: ['Sapiens', 'O Poder do Hábito'] },
        { faixa: '18-24', titulosTop: ['Harry Potter'] },
      ];
      mockBuscarTendenciasPorFaixaEtaria.mockResolvedValueOnce(faixasMock);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'O que adultos jovens estão lendo?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Mais vendidos por faixa etária'),
        undefined,
        expect.anything(),
      );
    });
  });

  // ── RAG opcional por categoria ─────────────────────────────────────────────

  describe('RAG Opcional por Categoria', () => {
    it('[RN-IA-004] não deve acionar RAG quando intenção não especifica gênero', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais os livros mais populares este mês?' });

      expect(mockBuscarSimilares).not.toHaveBeenCalled();
    });

    it('[RN-IA-004] deve retornar produtosRecomendados vazio quando não há gênero na intenção', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais os mais vendidos da semana?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosRecomendados).toEqual([]);
    });

    it('[RN-IA-004] deve acionar RAG quando intenção tem categoria específica', async () => {
      mockInterpretarIntencao.mockResolvedValueOnce(intencaoTendenciasComGenero);
      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: 'romance-uuid-0001-0000-000000000001',
          similaridade: 0.88,
          metadados: {
            titulo: 'Orgulho e Preconceito',
            autor: 'Jane Austen',
            categoria: 'Romance',
            isbn: '978-0000000001',
            preco: 39.90,
          },
        },
      ]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais são os romances mais vendidos?' });

      expect(mockBuscarSimilares).toHaveBeenCalled();
    });

    it('[RN-IA-004] deve incluir produtos RAG em produtosRecomendados quando gênero é especificado', async () => {
      mockInterpretarIntencao.mockResolvedValueOnce(intencaoTendenciasComGenero);
      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
          similaridade: 0.90,
          metadados: {
            titulo: 'Dom Casmurro',
            autor: 'Machado de Assis',
            categoria: 'Romance',
            isbn: '978-0000000002',
            preco: 29.90,
          },
        },
      ]);

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Indique romances mais vendidos' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosRecomendados.length).toBeGreaterThan(0);
    });

    it('[RN-IA-004] deve incluir seção "Destaques do catálogo" no contexto quando RAG retorna resultados', async () => {
      mockInterpretarIntencao.mockResolvedValueOnce(intencaoTendenciasComGenero);
      mockBuscarSimilares.mockResolvedValueOnce([
        {
          produtoUuid: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
          similaridade: 0.87,
          metadados: {
            titulo: 'A Moreninha',
            autor: 'Joaquim Manuel de Macedo',
            categoria: 'Romance',
            isbn: '978-0000000003',
            preco: 24.90,
          },
        },
      ]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Top romances disponíveis no catálogo' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Destaques do catálogo'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-004] deve limitar produtos RAG a no máximo 3 itens em tendencias', async () => {
      // quantidadeLivros=3 na intenção → limiteRag = min(3, 3) = 3
      mockInterpretarIntencao.mockResolvedValueOnce(intencaoTendenciasComGenero);
      const cincoLivros = Array.from({ length: 5 }, (_, i) => ({
        produtoUuid: `romance-uuid-${String(i).padStart(4, '0')}-0000-000000000000`,
        similaridade: 0.9 - i * 0.02,
        metadados: {
          titulo: `Romance ${i + 1}`,
          autor: `Autor ${i + 1}`,
          categoria: 'Romance',
          isbn: `978-000000000${i}`,
          preco: 30.00 + i,
        },
      }));
      mockBuscarSimilares.mockResolvedValueOnce(cincoLivros);

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais os romances mais vendidos?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosRecomendados.length).toBeLessThanOrEqual(3);
    });
  });
});
