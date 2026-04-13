import { ServicoPagamentos } from '@/modules/pagamentos/ServicoPagamentos';
import { TipoPagamento } from '@/modules/pagamentos/FormaPagamento';
import { StatusPagamento } from '@/modules/pagamentos/IPagamento';

describe('ServicoPagamentos (TDD)', () => {
  let servico: ServicoPagamentos;
  let repositorioPagamentosMock: any;
  let provedorPagamentoMock: any;
  let repositorioIntencaoMock: any;
  let repositorioVendasMock: any;

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
      repositorioPagamentosMock,
      provedorPagamentoMock,
      repositorioIntencaoMock,
      repositorioVendasMock,
    );
  });

  describe('pagamentoSatisfeitoParaVenda (Privado)', () => {
    it('deve considerar CUPOM_PROMOCIONAL satisfeito se PENDENTE ou APROVADO', () => {
      const satisfeito = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.CUPOM_PROMOCIONAL },
        status: StatusPagamento.PENDENTE,
      });
      expect(satisfeito).toBe(true);
    });

    it('deve considerar PIX satisfeito apenas se APROVADO', () => {
      const satisfeito = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.PIX },
        status: StatusPagamento.APROVADO,
      });
      expect(satisfeito).toBe(true);

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
      await expect((servico as any).validarRegrasNegocio(formaPix, 10)).resolves.not.toThrow();
      await expect((servico as any).validarRegrasNegocio(formaPix, 9.99)).rejects.toThrow(
        'Valor mínimo por linha PIX é R$ 10,00',
      );
    });
  });
});
