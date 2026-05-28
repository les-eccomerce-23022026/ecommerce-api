/**
 * Testes de Integração — Health check do módulo IA (GET /api/ia/saude)
 */

const mockVerificarConexaoChroma = jest.fn().mockResolvedValue(true);
const mockValidarConexaoGemini = jest.fn().mockResolvedValue(true);

jest.mock('@/modules/ia/infrastructure/config/AdapterLangChainGemini', () => ({
  AdapterLangChainGemini: jest.fn().mockImplementation(() => ({
    gerarEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    gerarEmbeddingsLote: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    gerarRespostaChat: jest.fn().mockResolvedValue('ok'),
    validarConexao: mockValidarConexaoGemini,
  })),
}));

jest.mock('@/modules/ia/infrastructure/repositories/RepositorioEmbeddingChromaDB', () => ({
  RepositorioEmbeddingChromaDB: jest.fn().mockImplementation(() => ({
    criar: jest.fn(),
    buscarPorProdutoUuid: jest.fn(),
    buscarSimilares: jest.fn(),
    atualizar: jest.fn(),
    remover: jest.fn(),
    indexarCatalogo: jest.fn(),
    limparColecao: jest.fn(),
    verificarConexao: mockVerificarConexaoChroma,
  })),
}));

import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

describe('[RF-IA] Integração - Saúde do módulo IA (GET /api/ia/saude)', () => {
  const contexto = configurarTesteIntegracao();

  beforeEach(() => {
    mockVerificarConexaoChroma.mockResolvedValue(true);
    mockValidarConexaoGemini.mockResolvedValue(true);
  });

  it('deve retornar status ok quando dependências estão disponíveis', async () => {
    const res = await request(contexto.app).get('/api/ia/saude');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.dados.status).toBe('ok');
    expect(res.body.dados.dependencias.chromadb.ok).toBe(true);
    expect(res.body.dados.dependencias.gemini.ok).toBe(true);
  });

  it('deve retornar degraded quando apenas uma dependência falha', async () => {
    mockValidarConexaoGemini.mockResolvedValue(false);

    const res = await request(contexto.app).get('/api/ia/saude');

    expect(res.status).toBe(200);
    expect(res.body.dados.status).toBe('degraded');
    expect(res.body.dados.dependencias.gemini.ok).toBe(false);
  });

  it('deve retornar 503 quando todas as dependências falham', async () => {
    mockVerificarConexaoChroma.mockResolvedValue(false);
    mockValidarConexaoGemini.mockResolvedValue(false);

    const res = await request(contexto.app).get('/api/ia/saude');

    expect(res.status).toBe(503);
    expect(res.body.dados.status).toBe('down');
  });
});
