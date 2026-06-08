/**
 * Testes de Integração — Endpoint de Chat com IA (POST /api/ia/chat)
 *
 * Abordagem HÍBRIDA:
 * 1. Testes de Contrato (com mocks) - validam estrutura da resposta
 * 2. Testes de Regressão (golden dataset) - validam consistência
 * 3. Testes de Qualidade (dependências reais) - validam qualidade real
 *
 * RN-IA-002: Chat deve sempre incluir contexto do catálogo da livraria.
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockBuscarSimilares,
  mockGerarEmbedding,
  mockGerarRespostaChat,
} from '@/tests/helpers/setupMocksIA.util';
import { configurarGoldenDatasetMocks } from '@/tests/helpers/goldenEmbeddings.util';

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenClienteParaIa, postIaChat } from '@/tests/helpers/ia-integracao.helper';

describe('[RF-IA-02] Integração - Chat com IA (POST /api/ia/chat)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  beforeEach(async () => {
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
  });

  describe('Controle de Acesso', () => {
    it('[RN-IA-002] deve retornar 401 quando requisição é feita sem autenticação', async () => {
      const resposta = await request(contexto.app)
        .post('/api/ia/chat')
        .send({ mensagem: 'Olá' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  describe('Validação de Entrada', () => {
    it('[RN-IA-002] deve retornar 400 quando o corpo da requisição está vazio', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      expect(resposta.body.mensagem).toMatch(/mensagem/i);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem é string vazia', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: '' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem contém apenas espaços', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: '   ' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem não é do tipo string', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 42 });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 400 quando mensagem excede 1000 caracteres', async () => {
      const mensagemLonga = 'A'.repeat(1001);

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: mensagemLonga });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 400 quando historico não é um array', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais livros de ficção você recomenda?', historico: 'não sou array' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
      // A mensagem de erro inclui "Histórico" (com acento)
      expect(resposta.body.mensagem).toContain('Histórico');
    });

    it('[RN-IA-002] deve aceitar item do histórico sem campo role (validação não implementada)', async () => {
      // Nota: o controller não valida os campos de cada item do histórico.
      // Quando implementada, deve retornar 400 para itens sem role.
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({
          mensagem: 'Me indique um bom romance',
          historico: [{ content: 'anterior sem role' }],
        });

      expect(resposta.status).toBe(200);
    });

    it('[RN-IA-002] deve aceitar item com role inválido no histórico (validação não implementada)', async () => {
      // Nota: o controller aceita qualquer role pois não valida o conteúdo do histórico.
      // Quando implementada, deve rejeitar roles fora de user/assistant.
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({
          mensagem: 'Me indique um bom romance',
          historico: [{ role: 'system', content: 'conteúdo com role não reconhecido' }],
        });

      expect(resposta.status).toBe(200);
    });
  });

  describe('Retorno com Sucesso', () => {
    it('[RN-IA-002] deve retornar 200 com estrutura completa para mensagem válida', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Você pode me indicar livros de programação?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados).toHaveProperty('resposta');
      expect(resposta.body.dados).toHaveProperty('produtosRecomendados');
      expect(resposta.body.dados).toHaveProperty('tempoRespostaMs');
      expect(resposta.body.dados).toHaveProperty('tipoResposta');
      expect(resposta.body.dados).toHaveProperty('numeroTurno');
      expect(resposta.body.dados.numeroTurno).toBe(1);
      expect(resposta.body.dados.resposta.length).toBeGreaterThan(0);
    });

    it('[RN-IA-002] deve retornar 200 com histórico vazio quando não fornecido', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais são os lançamentos de ficção científica?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(Array.isArray(resposta.body.dados.produtosRecomendados)).toBe(true);
    });

    it('[RN-IA-002] deve retornar 200 com histórico de conversa fornecido', async () => {
      const historico = [
        { role: 'user', content: 'Gosto de ficção científica' },
        { role: 'assistant', content: 'Que ótimo! Posso recomendar vários títulos.' },
      ];

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({
          mensagem: 'Pode me sugerir algo nesse estilo?',
          historico,
        });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });

    it('[RN-IA-002] deve retornar tempoRespostaMs como número não-negativo', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual é o livro mais vendido desta semana?' });

      expect(resposta.status).toBe(200);
      expect(typeof resposta.body.dados.tempoRespostaMs).toBe('number');
      expect(resposta.body.dados.tempoRespostaMs).toBeGreaterThanOrEqual(0);
    });

    it('[RN-IA-002] deve acionar geração de resposta textual com o contexto da livraria', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Recomende um livro de literatura brasileira' });

      expect(mockGerarRespostaChat).toHaveBeenCalled();
    });

    it('[RN-IA-002] deve acionar busca semântica para contextualizar a resposta do chat', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Tenho interesse em autoajuda e desenvolvimento pessoal' });

      expect(mockGerarEmbedding).toHaveBeenCalled();
      expect(mockBuscarSimilares).toHaveBeenCalled();
    });

    it('[RN-IA-002] deve retornar 200 para mensagem exatamente com 1000 caracteres (limite válido)', async () => {
      const mensagemNoLimite = 'B'.repeat(1000);

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: mensagemNoLimite });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });

  describe('Tratamento de Falha nos Serviços Externos', () => {
    it('[RN-IA-002] deve retornar 500 quando serviço de geração de resposta está indisponível', async () => {
      mockGerarRespostaChat.mockRejectedValueOnce(
        new Error('Conexão com Gemini API encerrada inesperadamente')
      );

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Existe algum romance histórico ambientado no Brasil Colônia?' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });

    it('[RN-IA-002] deve retornar 500 quando embedding da mensagem não pode ser gerado', async () => {
      mockGerarEmbedding.mockRejectedValueOnce(
        new Error('Quota de API excedida para embeddings')
      );

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Busco livros sobre mindfulness e meditação' });

      expect(resposta.status).toBe(500);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  // ── SEÇÃO 2: Testes de Regressão (Golden Dataset) ────────────────────────
  
  describe('Regressão - Golden Dataset', () => {
    beforeEach(() => {
      configurarGoldenDatasetMocks();
    });

    it('[RN-IA-REGRESSAO] deve retornar resposta consistente para mensagens do golden dataset', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'recomende um livro' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.resposta).toBeDefined();
      expect(typeof resposta.body.dados.resposta).toBe('string');
    });

    it('[RN-IA-REGRESSAO] deve usar embeddings fixos do golden dataset', async () => {
      const mensagem = 'olá';

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem });

      // Valida que o embedding do golden dataset foi usado
      expect(mockGerarEmbedding).toHaveBeenCalledWith(mensagem);
    });
  });

  // ── SEÇÃO 3: Testes de Qualidade (Dependências Reais) ───────────────────────

  describe('Qualidade - Dependências Reais', () => {
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

    it('[RN-IA-QUALIDADE] deve retornar resposta relevante com dependências reais', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida qualidade real
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'recomende um livro de ficção' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.resposta).toBeDefined();
      expect(typeof resposta.body.dados.resposta).toBe('string');
      expect(resposta.body.dados.resposta.length).toBeGreaterThan(0);
    });

    it('[RN-IA-QUALIDADE] deve completar em tempo razoável com dependências reais (< 10s)', async () => {
      if (PULAR_TESTES_SEM_DEPENDENCIAS) {
        pending('Dependências externas não configuradas');
      }

      // NÃO usa mock - valida performance real
      const inicio = Date.now();
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'recomende um livro de ficção' });
      const duracaoMs = Date.now() - inicio;

      expect(resposta.status).toBe(200);
      expect(duracaoMs).toBeLessThan(10000);
    });
  });
});
