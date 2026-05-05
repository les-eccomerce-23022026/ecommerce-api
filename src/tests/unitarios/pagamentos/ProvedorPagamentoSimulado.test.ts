import { ProvedorPagamentoSimulado } from '@/modules/pagamentos/provedoresPagamento/ProvedorPagamentoSimulado';
import { EstadosIntencaoPagamento } from '@/modules/pagamentos/intencaoPagamento/EstadosIntencaoPagamento';
import { IRepositorioIntencaoPagamento } from '@/modules/pagamentos/intencaoPagamento/IRepositorioIntencaoPagamento';

describe('ProvedorPagamentoSimulado', () => {
  let provedor: ProvedorPagamentoSimulado;
  let mockRepositorioIntencao: jest.Mocked<Partial<IRepositorioIntencaoPagamento>>;

  beforeEach(() => {
    mockRepositorioIntencao = {
      atualizarEstado: jest.fn(),
    };
    provedor = new ProvedorPagamentoSimulado(mockRepositorioIntencao as IRepositorioIntencaoPagamento);
  });

  describe('finalizarPorTeto', () => {
    it('deve aprovar pagamento dentro do teto', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultado = await (provedor as any).finalizarPorTeto('id-1', 100, 1000);

      expect(resultado.sucesso).toBe(true);
      expect(mockRepositorioIntencao.atualizarEstado).toHaveBeenCalledWith(
        'id-1',
        EstadosIntencaoPagamento.CONFIRMADA,
        expect.anything(),
      );
    });

    it('deve recusar pagamento acima do teto', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultado = await (provedor as any).finalizarPorTeto('id-1', 1500, 1000);

      expect(resultado.sucesso).toBe(false);
      expect(mockRepositorioIntencao.atualizarEstado).toHaveBeenCalledWith(
        'id-1',
        EstadosIntencaoPagamento.RECUSADA,
        expect.anything(),
      );
    });
  });
});
