import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { IRepositorioVendas, IVenda } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IEntregaOutputDto } from '@/modules/entrega/IEntrega.dto';

describe('ServicoEntrega', () => {
  let servico: ServicoEntrega;
  let mockRepoEntrega: jest.Mocked<IRepositorioEntrega>;
  let mockRepoVendas: jest.Mocked<IRepositorioVendas>;

  beforeEach(() => {
    mockRepoEntrega = {
      cadastrar: jest.fn(),
      obterPorUuid: jest.fn(),
      listarPorVendaUuid: jest.fn(),
    } as unknown as jest.Mocked<IRepositorioEntrega>;

    mockRepoVendas = {
      obterPorUuid: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<IRepositorioVendas>;

    servico = new ServicoEntrega(mockRepoEntrega, mockRepoVendas);
  });

  describe('agendarRemessa', () => {
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

      // Mock: Venda existe (frete deve bater com custo informado)
      mockRepoVendas.obterPorUuid.mockResolvedValue({
        id: 'venda-123',
        frete: 20,
      } as unknown as IVenda);
      // Mock: Cadastro bem sucedido
      mockRepoEntrega.cadastrar.mockResolvedValue(entregaOutput as IEntregaOutputDto);

      const resultado = await servico.agendarRemessa(dadosInput);

      expect(resultado).toEqual(entregaOutput);
      expect(mockRepoVendas.obterPorUuid).toHaveBeenCalledWith('venda-123');
      expect(mockRepoEntrega.cadastrar).toHaveBeenCalledWith(dadosInput);
      expect(mockRepoVendas.atualizarStatus).toHaveBeenCalledWith('venda-123', 'EM TRÂNSITO');
    });

    it('deve lançar erro se a venda não existir', async () => {
      mockRepoVendas.obterPorUuid.mockResolvedValue(null);

      await expect(
        servico.agendarRemessa({
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
      const entrega = { uuid: 'e-1' } as unknown as IEntregaOutputDto;
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
