import { ProvedorPagamentoSimulado } from './ProvedorPagamentoSimulado';
import { EstadosIntencaoPagamento } from '../intencaoPagamento/EstadosIntencaoPagamento';

describe('ProvedorPagamentoSimulado', () => {
  let provedor: ProvedorPagamentoSimulado;
  let mockRepositorioIntencao: any;

  beforeEach(() => {
    mockRepositorioIntencao = {
      atualizarEstado: jest.fn(),
    };
    provedor = new ProvedorPagamentoSimulado(mockRepositorioIntencao);
  });

  describe('finalizarPorTeto', () => {
    it('deve aprovar pagamento dentro do teto', async () => {
      // @ts-ignore - acessando método privado para teste unitário cirúrgico
      const resultado = await provedor.finalizarPorTeto('id-1', 100, 1000);
      
      expect(resultado.sucesso).toBe(true);
      expect(mockRepositorioIntencao.atualizarEstado).toHaveBeenCalledWith(
        'id-1',
        EstadosIntencaoPagamento.CONFIRMADA,
        expect.anything()
      );
    });

    it('deve recusar pagamento acima do teto', async () => {
      // @ts-ignore
      const resultado = await provedor.finalizarPorTeto('id-1', 1500, 1000);
      
      expect(resultado.sucesso).toBe(false);
      expect(mockRepositorioIntencao.atualizarEstado).toHaveBeenCalledWith(
        'id-1',
        EstadosIntencaoPagamento.RECUSADA,
        expect.anything()
      );
    });
  });
});
