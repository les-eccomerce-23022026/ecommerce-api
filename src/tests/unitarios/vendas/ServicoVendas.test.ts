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
      registrarSolicitacaoTroca: jest.fn(),
      obterEmailUsuarioPorVenda: jest.fn(),
    } as jest.Mocked<IRepositorioVendas>;

    mockRepoCotacao = {
      inserirLinhas: jest.fn(),
      obterPorUuid: jest.fn(),
      marcarConsumida: jest.fn(),
      marcarExpiradasCriadasVencidas: jest.fn(),
    } as jest.Mocked<IRepositorioCotacaoFrete>;
  });

  describe('validações de entrada', () => {
    it('lança erro quando usuarioUuid está ausente', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ usuarioUuid: '' })),
      ).rejects.toThrow('Usuário é obrigatório');
    });

    it('lança erro quando não há itens no pedido', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ itens: [] })),
      ).rejects.toThrow('Venda deve possuir ao menos um item');
    });

    it('lança erro quando valorTotal é menor ou igual a zero', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ valorTotal: 0 })),
      ).rejects.toThrow('Valor total inválido');
    });

    it('lança erro quando valorTotal diverge de itens+frete em mais de R$ 0.02', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      // itens=50 + frete=10 = 60; informado 60.021 → acima da tolerância
      await expect(
        servico.registrarPedidoVenda(dadosBase({ valorTotal: 60.021 })),
      ).rejects.toThrow('Valor total não confere com itens + frete');
    });

    it('aceita valorTotal com diferença de até R$ 0.019 (dentro da tolerância)', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      // itens=50 + frete=10 = 60; informado 60.019 → dentro da tolerância
      const resultado = await servico.registrarPedidoVenda(dadosBase({ valorTotal: 60.019 }));
      expect(resultado).toBeDefined();
      expect(mockRepoVendas.cadastrar).toHaveBeenCalledTimes(1);
    });
  });

  describe('fluxo feliz sem cotação', () => {
    it('registra pedido e retorna a venda criada', async () => {
      const servico = new ServicoVendas(mockRepoVendas);
      const resultado = await servico.registrarPedidoVenda(dadosBase());

      expect(resultado.id).toBe('venda-uuid-1');
      expect(resultado.status).toBe('EM PROCESSAMENTO');
      expect(mockRepoVendas.cadastrar).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioUuid: USUARIO_UUID, valorFrete: 10 }),
      );
    });
  });

  describe('fluxo com cotação de frete (cotacaoUuid)', () => {
    it('lança erro quando cotacaoUuid é informado mas repositório de cotação não está configurado', async () => {
      const servico = new ServicoVendas(mockRepoVendas); // sem repoCotacao
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete não suportada nesta configuração');
    });

    it('lança erro quando a cotação não é encontrada', async () => {
      mockRepoCotacao.obterPorUuid.mockResolvedValue(null);
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete não encontrada');
    });

    it('lança erro quando a cotação está no estado CONSUMIDA (≠ CRIADA)', async () => {
      mockRepoCotacao.obterPorUuid.mockResolvedValue(cotacaoPadrao({ estado: 'CONSUMIDA' }));
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete inválida ou já utilizada');
    });

    it('lança erro quando a cotação está expirada (expiraEm no passado)', async () => {
      mockRepoCotacao.obterPorUuid.mockResolvedValue(
        cotacaoPadrao({ expiraEm: new Date(Date.now() - 1000) }),
      );
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete expirada');
    });

    it('lança erro quando a cotação já está vinculada a outra venda (venId != null)', async () => {
      mockRepoCotacao.obterPorUuid.mockResolvedValue(cotacaoPadrao({ venId: 42 }));
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      await expect(
        servico.registrarPedidoVenda(dadosBase({ cotacaoUuid: COTACAO_UUID })),
      ).rejects.toThrow('Cotação de frete já vinculada a uma venda');
    });

    it('fluxo feliz com cotação: usa valor do frete da cotação e chama marcarConsumida', async () => {
      const cotacao = cotacaoPadrao({ valor: 15 }); // frete da cotação = 15, diferente do input
      mockRepoCotacao.obterPorUuid.mockResolvedValue(cotacao);
      mockRepoCotacao.marcarConsumida.mockResolvedValue();

      // Ajusta o valorTotal para bater com itens(50) + frete_cotacao(15) = 65
      const servico = new ServicoVendas(mockRepoVendas, mockRepoCotacao);
      await servico.registrarPedidoVenda(
        dadosBase({ cotacaoUuid: COTACAO_UUID, valorFrete: 99, valorTotal: 65 }),
      );

      expect(mockRepoVendas.cadastrar).toHaveBeenCalledWith(
        expect.objectContaining({ valorFrete: 15, cfrId: cotacao.cfrId }),
      );
      expect(mockRepoCotacao.marcarConsumida).toHaveBeenCalledWith(COTACAO_UUID, 1);
    });
  });
});

describe('ServicoVendas — visualizarDetalhesVenda', () => {
  let mockRepoVendas: jest.Mocked<IRepositorioVendas>;

  beforeEach(() => {
    mockRepoVendas = {
      cadastrar: jest.fn(),
      obterPorUuid: jest.fn(),
      listarPorUsuario: jest.fn(),
      listarTodas: jest.fn(),
      atualizarStatus: jest.fn(),
      registrarSolicitacaoTroca: jest.fn(),
      obterEmailUsuarioPorVenda: jest.fn(),
    } as jest.Mocked<IRepositorioVendas>;
  });

  it('retorna a venda quando o dono a consulta', async () => {
    const venda = vendaResultado(); // usuarioUuid = USUARIO_UUID
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda);
    const servico = new ServicoVendas(mockRepoVendas);
    const resultado = await servico.visualizarDetalhesVenda('venda-uuid-1', {
      uuid: USUARIO_UUID,
      ehAdmin: false,
    });
    expect(resultado).toBe(venda);
  });

  it('admin pode consultar venda de outro cliente', async () => {
    const venda = vendaResultado(); // usuarioUuid = USUARIO_UUID
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda);
    const servico = new ServicoVendas(mockRepoVendas);
    const resultado = await servico.visualizarDetalhesVenda('venda-uuid-1', {
      uuid: 'outro-usuario-uuid',
      ehAdmin: true,
    });
    expect(resultado).toBe(venda);
  });

  it('lança erro quando a venda não é encontrada', async () => {
    mockRepoVendas.obterPorUuid.mockResolvedValue(null);
    const servico = new ServicoVendas(mockRepoVendas);
    await expect(
      servico.visualizarDetalhesVenda('uuid-inexistente', { uuid: USUARIO_UUID, ehAdmin: false }),
    ).rejects.toThrow('Venda não encontrada');
  });

  it('lança erro quando cliente tenta consultar venda de outro cliente (mesmo erro que não existe)', async () => {
    const venda = vendaResultado(); // dono = USUARIO_UUID
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda);
    const servico = new ServicoVendas(mockRepoVendas);
    await expect(
      servico.visualizarDetalhesVenda('venda-uuid-1', { uuid: 'outro-uuid', ehAdmin: false }),
    ).rejects.toThrow('Venda não encontrada');
  });
});

describe('ServicoVendas — listarVendasCliente', () => {
  it('delega a listagem ao repositório e retorna o resultado', async () => {
    const mockRepoVendas = {
      cadastrar: jest.fn(),
      obterPorUuid: jest.fn(),
      listarPorUsuario: jest.fn().mockResolvedValue([vendaResultado()]),
      listarTodas: jest.fn(),
      atualizarStatus: jest.fn(),
      registrarSolicitacaoTroca: jest.fn(),
      obterEmailUsuarioPorVenda: jest.fn(),
    } as jest.Mocked<IRepositorioVendas>;

    const servico = new ServicoVendas(mockRepoVendas);
    const lista = await servico.listarVendasCliente(USUARIO_UUID);

    expect(lista).toHaveLength(1);
    expect(mockRepoVendas.listarPorUsuario).toHaveBeenCalledWith(USUARIO_UUID);
  });
});
