import { ServicoPagamentos } from '@/modules/pagamentos/ServicoPagamentos';
import { TipoPagamento } from '@/modules/pagamentos/FormaPagamento';
import { StatusPagamento } from '@/modules/pagamentos/IPagamento';
import { IRepositorioPagamentos } from '@/modules/pagamentos/IRepositorioPagamentos';
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

  describe('pagamentoSatisfeitoParaVenda (Privado)', () => {
    it('deve considerar CUPOM_PROMOCIONAL satisfeito se PENDENTE ou APROVADO', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const satisfeito = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.CUPOM_PROMOCIONAL },
        status: StatusPagamento.PENDENTE,
      });
      expect(satisfeito).toBe(true);
    });

    it('deve considerar PIX satisfeito apenas se APROVADO', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const satisfeito = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.PIX },
        status: StatusPagamento.APROVADO,
      });
      expect(satisfeito).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendente = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.PIX },
        status: StatusPagamento.PENDENTE,
      });
      expect(pendente).toBe(false);
    });
  });

  describe('validarRegrasNegocio (Privado)', () => {
    it('deve exigir valor mínimo de R$ 10,00 para PIX', async () => {
      const formaPix = {
        isPix: () => true,
        isCupomPromocional: () => false,
        isCupomTroca: () => false,
        getDetalhes: () => '',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((servico as any).validarRegrasNegocio(formaPix, 10)).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((servico as any).validarRegrasNegocio(formaPix, 9.99)).rejects.toThrow(
        'Valor mínimo por linha PIX é R$ 10,00',
      );
    });
  });
});
