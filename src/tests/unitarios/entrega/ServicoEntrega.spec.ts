import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';

describe('ServicoEntrega', () => {
  let servico: ServicoEntrega;
  let mockRepoEntrega: jest.Mocked<IRepositorioEntrega>;
  let mockRepoVendas: jest.Mocked<IRepositorioVendas>;

  beforeEach(() => {
    mockRepoEntrega = {
      obterPorUuid: jest.fn(),
      listarPorVendaUuid: jest.fn(),
    } as unknown as jest.Mocked<IRepositorioEntrega>;

    mockRepoVendas = {
      obterPorUuid: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<IRepositorioVendas>;

    servico = new ServicoEntrega(mockRepoEntrega, mockRepoVendas);
  });

  describe('cadastrarEntrega', () => {
    it('deve cadastrar uma entrega com sucesso e atualizar status da venda', async () => {
      const dadosInput = {
        vendaUuid: 'venda-123',
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua A' },
        custo: 20.0,
      };

      const entregaOutput = {
        uuid: 'entrega-uuid',
        ...dadosInput,
        entregador: null,
        criadoEm: new Date(),
      };

      // Mock: Venda existe
      mockRepoVendas.obterPorUuid.mockResolvedValue({ id: 'venda-123' } as unknown as any);
      // Mock: Cadastro bem sucedido
      mockRepoEntrega.cadastrar.mockResolvedValue(entregaOutput);

      const resultado = await servico.cadastrarEntrega(dadosInput);

      expect(resultado).toEqual(entregaOutput);
      expect(mockRepoVendas.obterPorUuid).toHaveBeenCalledWith('venda-123');
      expect(mockRepoEntrega.cadastrar).toHaveBeenCalledWith(dadosInput);
      expect(mockRepoVendas.atualizarStatus).toHaveBeenCalledWith('venda-123', 'EM TRÂNSITO');
    });

    it('deve lançar erro se a venda não existir', async () => {
      mockRepoVendas.obterPorUuid.mockResolvedValue(null);

      await expect(
        servico.cadastrarEntrega({
          vendaUuid: 'invalida',
          tipoFrete: 'PAC',
          endereco: {},
          custo: 5.0,
        })
      ).rejects.toThrow('Venda com UUID invalida não encontrada.');
    });
  });

  describe('consultarEntrega', () => {
    it('deve retornar a entrega se ela existir', async () => {
      const entrega = { uuid: 'e-1' } as unknown as any;
      mockRepoEntrega.obterPorUuid.mockResolvedValue(entrega);

      const resultado = await servico.consultarEntrega('e-1');
      expect(resultado).toBe(entrega);
    });

    it('deve lançar erro se a entrega não for encontrada', async () => {
      mockRepoEntrega.obterPorUuid.mockResolvedValue(null);
      await expect(servico.consultarEntrega('inexistente')).rejects.toThrow('Entrega não encontrada.');
    });
  });
});
