import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { IRepositorioVendas, IVenda } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { ICotacaoFretePersistida } from '@/modules/frete/IFrete.dto';
import { IVendaInputDto } from '@/modules/vendas/dtos/IVenda.dto';

const LIVRO_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USUARIO_UUID = 'usuario-uuid-1';
const COTACAO_UUID = 'cotacao-uuid-1';

function dadosBase(override: Partial<IVendaInputDto> = {}): IVendaInputDto {
  return {
    usuarioUuid: USUARIO_UUID,
    itens: [{ livroUuid: LIVRO_UUID, quantidade: 1, precoUnitario: 50 }],
    valorTotalItens: 50,
    valorFrete: 10,
    valorTotal: 60,
    ...override,
  };
}

function vendaResultado(): IVenda {
  return {
    id: 'venda-uuid-1',
    totalItens: 50,
    frete: 10,
    totalVenda: 60,
    status: 'EM PROCESSAMENTO',
    usuarioUuid: USUARIO_UUID,
    itens: [{ id: 'item-uuid-1', livroUuid: LIVRO_UUID, quantidade: 1, precoUnitario: 50 }],
    criadoEm: new Date(),
  };
}

function cotacaoPadrao(override: Partial<ICotacaoFretePersistida> = {}): ICotacaoFretePersistida {
  return {
    cfrId: 1,
    cfrUuid: COTACAO_UUID,
    provedor: 'simulado',
    estado: 'CRIADA',
    tipoServico: 'PAC',
    valor: 10,
    prazoTexto: '5 dias úteis',
    expiraEm: new Date(Date.now() + 60 * 60 * 1000), // 1h no futuro
    venId: null,
    ...override,
  };
}

describe('ServicoVendas — registrarPedidoVenda', () => {
  let mockRepoVendas: jest.Mocked<IRepositorioVendas>;
  let mockRepoCotacao: jest.Mocked<IRepositorioCotacaoFrete>;

  beforeEach(() => {
    mockRepoVendas = {
      cadastrar: jest.fn().mockResolvedValue({ venda: vendaResultado(), venId: 1 }),
      obterPorUuid: jest.fn(),
      listarPorUsuario: jest.fn(),
      listarTodas: jest.fn(),
      atualizarStatus: jest.fn(),
      registrarSolicitacaoTroca: jest.fn().mockResolvedValue(undefined),
      obterEmailUsuarioPorVenda: jest.fn().mockResolvedValue('test@example.com'),
    } as jest.Mocked<IRepositorioVendas>;

    mockRepoCotacao = {
      inserirLinhas: jest.fn(),
      obterPorUuid: jest.fn(),
      marcarConsumida: jest.fn(),
      marcarExpiradasCriadasVencidas: jest.fn(),
    } as jest.Mocked<IRepositorioCotacaoFrete>;
  });

  describe('validações de entrada', () => {
    it('[RN0026] lança erro quando usuarioUuid está ausente', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ usuarioUuid: '' })),
      ).rejects.toThrow('Usuário é obrigatório');
    });

    it('[RF0033] lança erro quando não há itens no pedido', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ itens: [] })),
      ).rejects.toThrow('Venda deve possuir ao menos um item');
    });

    it('[RF0033] lança erro quando valor total é inválido', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ valorTotal: 0 })),
      ).rejects.toThrow('Valor total inválido');
    });

    it('[RN0069] lança erro quando parcelamento abaixo de R$ 80,00', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ valorTotal: 50, parcelas: 2 })),
      ).rejects.toThrow('RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento');
    });

    it('[RN0034] lança erro quando split com cartão abaixo de R$ 10,00', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      const dadosComPagamento = dadosBase();
      dadosComPagamento.pagamentos = [{ tipo: 'cartao', valor: 5 }];
      await expect(
        servico.registrarPedidoVenda(dadosComPagamento),
      ).rejects.toThrow('RN0034: Valor mínimo por cartão deve ser R$ 10,00');
    });
  });

  describe('cotação de frete (RF0082)', () => {
    it('[RF0082] lança erro quando cotacaoUuid é fornecido mas repositório não configurado', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete não suportada nesta configuração');
    });

    it('[RF0082] lança erro quando cotação não encontrada', async () => {
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      mockRepoCotacao.obterPorUuid.mockResolvedValue(null);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete não encontrada');
    });

    it('[RF0082] lança erro quando cotação já consumida', async () => {
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      mockRepoCotacao.obterPorUuid.mockResolvedValue(
        cotacaoPadrao({ estado: 'CONSUMIDA' }),
      );
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete inválida ou já utilizada');
    });

    it('[RF0082] lança erro quando cotação expirada', async () => {
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      mockRepoCotacao.obterPorUuid.mockResolvedValue(
        cotacaoPadrao({ expiraEm: new Date(Date.now() - 1000) }),
      );
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete expirada');
    });

    it('[RF0082] lança erro quando cotação já vinculada a outra venda', async () => {
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      mockRepoCotacao.obterPorUuid.mockResolvedValue(cotacaoPadrao({ venId: 999 }));
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete já vinculada a uma venda');
    });

    it('[RF0082] usa valor da cotação e marca como consumida', async () => {
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      mockRepoCotacao.obterPorUuid.mockResolvedValue(cotacaoPadrao({ valor: 15 }));
      mockRepoVendas.cadastrar.mockResolvedValue({ venda: vendaResultado(), venId: 1 });

      await servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID, valorTotal: 65 }));

      expect(mockRepoVendas.cadastrar).toHaveBeenCalledWith(
        expect.objectContaining({ valorFrete: 15, cfrId: 1 }),
      );
      expect(mockRepoCotacao.marcarConsumida).toHaveBeenCalledWith(COTACAO_UUID, 1);
    });
  });

  describe('cálculo de totais', () => {
    it('[RF0033] lança erro quando total não confere com itens + frete', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ valorTotal: 100 })),
      ).rejects.toThrow('Valor total não confere com itens + frete');
    });

    it('[RF0033] aceita total dentro da tolerância de moeda', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ valorTotal: 60.01 })),
      ).resolves.toBeDefined();
    });
  });

  describe('caminho feliz', () => {
    it('[RF0033][RF0037][RN0038] cria pedido com status EM PROCESSAMENTO e totais coerentes', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      const body = dadosBase({ valorFrete: 10 });
      const res = await servico.registrarPedidoVenda(body);

      expect(res.status).toBe('EM PROCESSAMENTO');
      expect(res.totalVenda).toBe(60);
      expect(mockRepoVendas.cadastrar).toHaveBeenCalled();
    });
  });
});
