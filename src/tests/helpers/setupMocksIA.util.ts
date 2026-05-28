/**
 * Mocks compartilhados para testes de integração do módulo IA.
 * Importe este arquivo como primeira linha do arquivo de teste (antes de outros imports da app).
 */

export const mockGerarEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
export const mockGerarEmbeddingsLote = jest.fn().mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5]]);
export const mockGerarRespostaChat = jest.fn().mockResolvedValue(
  'Resposta simulada do catálogo da livraria.',
);
export const mockValidarConexaoGemini = jest.fn().mockResolvedValue(true);

export const mockCriarEmbedding = jest.fn().mockResolvedValue({
  id: 0,
  uuid: 'embed-uuid-padrao',
  produtoUuid: 'prod-uuid-padrao',
  embedding: [0.1, 0.2, 0.3],
  metadados: {},
  criadoEm: new Date(),
  atualizadoEm: new Date(),
});
export const mockBuscarPorProdutoUuid = jest.fn().mockResolvedValue(null);
export const mockBuscarSimilares = jest.fn().mockResolvedValue([]);
export const mockAtualizarEmbedding = jest.fn().mockResolvedValue({});
export const mockRemoverEmbedding = jest.fn().mockResolvedValue(undefined);
export const mockIndexarCatalogo = jest.fn().mockResolvedValue(0);
export const mockLimparColecao = jest.fn().mockResolvedValue(undefined);
export const mockVerificarConexaoChroma = jest.fn().mockResolvedValue(true);
export const mockIndexarProduto = jest.fn().mockResolvedValue(undefined);
export const mockRemoverProduto = jest.fn().mockResolvedValue(undefined);

jest.mock('@/modules/ia/infrastructure/config/AdapterLangChainGemini', () => ({
  AdapterLangChainGemini: jest.fn().mockImplementation(() => ({
    gerarEmbedding: mockGerarEmbedding,
    gerarEmbeddingsLote: mockGerarEmbeddingsLote,
    gerarRespostaChat: mockGerarRespostaChat,
    validarConexao: mockValidarConexaoGemini,
  })),
}));

jest.mock('@/modules/ia/infrastructure/repositories/RepositorioEmbeddingChromaDB', () => ({
  RepositorioEmbeddingChromaDB: jest.fn().mockImplementation(() => ({
    criar: mockCriarEmbedding,
    buscarPorProdutoUuid: mockBuscarPorProdutoUuid,
    buscarSimilares: mockBuscarSimilares,
    atualizar: mockAtualizarEmbedding,
    remover: mockRemoverEmbedding,
    indexarCatalogo: mockIndexarCatalogo,
    limparColecao: mockLimparColecao,
    verificarConexao: mockVerificarConexaoChroma,
  })),
}));

jest.mock('@/modules/ia/application/services/ServicoIndexacaoProdutos', () => ({
  ServicoIndexacaoProdutos: jest.fn().mockImplementation(() => ({
    indexarCatalogo: mockIndexarCatalogo,
    indexarProduto: mockIndexarProduto,
    removerProduto: mockRemoverProduto,
  })),
}));

/** Reinicia contadores dos mocks entre testes (opcional). */
export function reiniciarMocksIa(): void {
  jest.clearAllMocks();
  mockGerarEmbedding.mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
  mockGerarEmbeddingsLote.mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5]]);
  mockGerarRespostaChat.mockResolvedValue('Resposta simulada do catálogo da livraria.');
  mockValidarConexaoGemini.mockResolvedValue(true);
  mockBuscarSimilares.mockResolvedValue([]);
  mockIndexarCatalogo.mockResolvedValue(0);
  mockVerificarConexaoChroma.mockResolvedValue(true);
}
