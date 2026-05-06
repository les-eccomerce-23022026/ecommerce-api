import { ServicoPagamentos } from '@/modules/pagamentos/services/ServicoPagamentos';
import { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';
import { IProvedorPagamento } from '@/modules/pagamentos/provedoresPagamento/IProvedorPagamento';
import { IRepositorioIntencaoPagamento } from '@/modules/pagamentos/intencaoPagamento/IRepositorioIntencaoPagamento';
import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';

describe('ServicoPagamentos (TDD)', () => {
  let servico: ServicoPagamentos;
  let repositorioPagamentosMock: jest.Mocked<Partial<IRepositorioPagamentos>>;
  let provedorPagamentoMock: jest.Mocked<Partial<IProvedorPagamento>>;
  let repositorioIntencaoMock: jest.Mocked<Partial<IRepositorioIntencaoPagamento>>;
  let repositorioVendasMock: jest.Mocked<Partial<IRepositorioVendas>>;

  beforeEach(() => {
    repositorioPagamentosMock = {
      cadastrar: jest.fn(),
      listarPorVenda: jest.fn(),
      obterVenIdPorVendaUuid: jest.fn(),
      obterPagIdInternoPorUuid: jest.fn(),
      inserirPixSimulado: jest.fn(),
      obterPorUuid: jest.fn(),
    };
    provedorPagamentoMock = { registrarIntencaoPagamento: jest.fn(), confirmarPagamento: jest.fn() };
    repositorioIntencaoMock = { vincularVenda: jest.fn(), obterPorUuid: jest.fn() };
    repositorioVendasMock = { obterPorUuid: jest.fn(), atualizarStatus: jest.fn() };

    servico = new ServicoPagamentos(
      repositorioPagamentosMock as IRepositorioPagamentos,
      provedorPagamentoMock as IProvedorPagamento,
      repositorioIntencaoMock as IRepositorioIntencaoPagamento,
      repositorioVendasMock as IRepositorioVendas,
    );
  });

  describe('registrarIntencaoPagamento', () => {
    it('deve lançar erro para valor inválido', async () => {
      await expect(servico.registrarIntencaoPagamento(-1)).rejects.toThrow(
        'Valor total da intenção de pagamento deve ser positivo',
      );
      await expect(servico.registrarIntencaoPagamento(0)).rejects.toThrow(
        'Valor total da intenção de pagamento deve ser positivo',
      );
    });

    it('deve registrar intenção com sucesso', async () => {
      const resultadoMock = { idIntencao: '123', segredoConfirmacao: 'secret' };
      (provedorPagamentoMock.registrarIntencaoPagamento as jest.Mock).mockResolvedValue(resultadoMock);

      const resultado = await servico.registrarIntencaoPagamento(100);
      expect(resultado).toEqual(resultadoMock);
      expect(provedorPagamentoMock.registrarIntencaoPagamento).toHaveBeenCalledWith(100);
    });
  });

  describe('vincularIntencaoVenda', () => {
    it('deve lançar erro para identificadores vazios', async () => {
      await expect(servico.vincularIntencaoVenda('', 'uuid')).rejects.toThrow(
        'Identificadores da intenção e da venda são obrigatórios',
      );
      await expect(servico.vincularIntencaoVenda('inp', '')).rejects.toThrow(
        'Identificadores da intenção e da venda são obrigatórios',
      );
    });

    it('deve lançar erro quando venda não encontrada', async () => {
      (repositorioPagamentosMock.obterVenIdPorVendaUuid as jest.Mock).mockResolvedValue(null);

      await expect(servico.vincularIntencaoVenda('inp', 'uuid')).rejects.toThrow('Venda não encontrada');
    });

    it('deve vincular com sucesso', async () => {
      (repositorioPagamentosMock.obterVenIdPorVendaUuid as jest.Mock).mockResolvedValue(1);
      (repositorioIntencaoMock.vincularVenda as jest.Mock).mockResolvedValue(true);

      await expect(servico.vincularIntencaoVenda('inp', 'uuid')).resolves.not.toThrow();
      expect(repositorioIntencaoMock.vincularVenda).toHaveBeenCalledWith('inp', 1);
    });
  });

  describe('consultarPagamento', () => {
    it('deve lançar erro quando pagamento não encontrado', async () => {
      (repositorioPagamentosMock.obterPorUuid as jest.Mock).mockResolvedValue(null);

      await expect(servico.consultarPagamento('uuid')).rejects.toThrow('Pagamento não encontrado');
    });

    it('deve retornar pagamento encontrado', async () => {
      const pagamentoMock = { id: '123', valor: 100 };
      (repositorioPagamentosMock.obterPorUuid as jest.Mock).mockResolvedValue(pagamentoMock as unknown);

      const resultado = await servico.consultarPagamento('uuid');
      expect(resultado).toEqual(pagamentoMock);
    });
  });
});
