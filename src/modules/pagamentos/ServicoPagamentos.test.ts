import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServicoPagamentos } from './ServicoPagamentos';
import { TipoPagamento } from './FormaPagamento';
import { StatusPagamento } from './IPagamento';

describe('ServicoPagamentos (TDD)', () => {
  let servico: ServicoPagamentos;
  let repositórioPagamentosMock: any;
  let provedorPagamentoMock: any;
  let repositórioIntencaoMock: any;
  let repositórioVendasMock: any;

  beforeEach(() => {
    repositórioPagamentosMock = {
      cadastrar: vi.fn(),
      listarPorVenda: vi.fn(),
      obterVenIdPorVendaUuid: vi.fn(),
      obterPagIdInternoPorUuid: vi.fn(),
      inserirPixSimulado: vi.fn()
    };
    provedorPagamentoMock = { registrarIntencaoPagamento: vi.fn(), confirmarPagamento: vi.fn() };
    repositórioIntencaoMock = { vincularVenda: vi.fn(), obterPorUuid: vi.fn() };
    repositórioVendasMock = { obterPorUuid: vi.fn(), atualizarStatus: vi.fn() };

    servico = new ServicoPagamentos(
      repositórioPagamentosMock,
      provedorPagamentoMock,
      repositórioIntencaoMock,
      repositórioVendasMock
    );
  });

  describe('pagamentoSatisfeitoParaVenda (Privado)', () => {
    it('deve considerar CUPOM_PROMOCIONAL satisfeito se PENDENTE ou APROVADO', () => {
      const satisfeito = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.CUPOM_PROMOCIONAL },
        status: StatusPagamento.PENDENTE
      });
      expect(satisfeito).toBe(true);
    });

    it('deve considerar PIX satisfeito apenas se APROVADO', () => {
      const satisfeito = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.PIX },
        status: StatusPagamento.APROVADO
      });
      expect(satisfeito).toBe(true);

      const pendente = (servico as any).pagamentoSatisfeitoParaVenda({
        formaPagamento: { getTipo: () => TipoPagamento.PIX },
        status: StatusPagamento.PENDENTE
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
        getDetalhes: () => ''
      };
      await expect((servico as any).validarRegrasNegocio(formaPix, 10)).resolves.not.toThrow();
      await expect((servico as any).validarRegrasNegocio(formaPix, 9.99)).rejects.toThrow('Valor mínimo por linha PIX é R$ 10,00');
    });
  });
});
