import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { IRepositorioVendas, IVenda } from '@/modules/vendas/repositories/IRepositorioVendas';

const LIVRO_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USUARIO_UUID = 'usuario-uuid-1';

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

describe('ServicoVendas — visualizarDetalhesVenda', () => {
  let mockRepoVendas: jest.Mocked<IRepositorioVendas>;

  beforeEach(() => {
    mockRepoVendas = {
      cadastrar: jest.fn(),
      obterPorUuid: jest.fn(),
      listarPorUsuario: jest.fn(),
      listarTodas: jest.fn(),
      atualizarStatus: jest.fn(),
      registrarTroca: jest.fn().mockResolvedValue({ id: 'troca-uuid-1' }),
    } as jest.Mocked<IRepositorioVendas>;
  });

  it('[RF0025] retorna a venda quando o dono a consulta', async () => {
    const venda = vendaResultado(); // usuarioUuid = USUARIO_UUID
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda);
    const servico = new ServicoVendas(mockRepoVendas);
    const resultado = await servico.visualizarDetalhesVenda('venda-uuid-1', {
      uuid: USUARIO_UUID,
      ehAdmin: false,
    });
    expect(resultado).toBe(venda);
  });

  it('[RF0025] admin pode consultar venda de outro cliente', async () => {
    const venda = vendaResultado(); // usuarioUuid = USUARIO_UUID
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda);
    const servico = new ServicoVendas(mockRepoVendas);
    const resultado = await servico.visualizarDetalhesVenda('venda-uuid-1', {
      uuid: 'outro-usuario-uuid',
      ehAdmin: true,
    });
    expect(resultado).toBe(venda);
  });

  it('[RF0025] lança erro quando a venda não é encontrada', async () => {
    mockRepoVendas.obterPorUuid.mockResolvedValue(null);
    const servico = new ServicoVendas(mockRepoVendas);
    await expect(
      servico.visualizarDetalhesVenda('uuid-inexistente', { uuid: USUARIO_UUID, ehAdmin: false }),
    ).rejects.toThrow('Venda não encontrada');
  });

  it('[RF0025][RNF0037] lança erro quando cliente tenta consultar venda de outro cliente (mesmo erro que não existe)', async () => {
    const venda = vendaResultado(); // dono = USUARIO_UUID
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda);
    const servico = new ServicoVendas(mockRepoVendas);
    await expect(
      servico.visualizarDetalhesVenda('venda-uuid-1', { uuid: 'outro-uuid', ehAdmin: false }),
    ).rejects.toThrow('Venda não encontrada');
  });
});

describe('ServicoVendas — listarVendasCliente', () => {
  it('[RF0025] delega a listagem ao repositório e retorna o resultado', async () => {
    const mockRepoVendas = {
      cadastrar: jest.fn(),
      obterPorUuid: jest.fn(),
      listarPorUsuario: jest.fn().mockResolvedValue([vendaResultado()]),
      listarTodas: jest.fn(),
      atualizarStatus: jest.fn(),
      registrarTroca: jest.fn().mockResolvedValue({ id: 'troca-uuid-1' }),
    } as jest.Mocked<IRepositorioVendas>;

    const servico = new ServicoVendas(mockRepoVendas);
    const lista = await servico.listarVendasCliente(USUARIO_UUID);

    expect(lista).toHaveLength(1);
    expect(mockRepoVendas.listarPorUsuario).toHaveBeenCalledWith(USUARIO_UUID);
  });
});

describe('ServicoVendas — solicitarTroca (RN0043)', () => {
  let mockRepoVendas: jest.Mocked<IRepositorioVendas>;

  beforeEach(() => {
    mockRepoVendas = {
      cadastrar: jest.fn(),
      obterPorUuid: jest.fn(),
      listarPorUsuario: jest.fn(),
      listarTodas: jest.fn(),
      atualizarStatus: jest.fn(),
      registrarTroca: jest.fn().mockResolvedValue({ id: 'troca-uuid-1' }),
    } as unknown as jest.Mocked<IRepositorioVendas>;
  });

  it('[RN0043] permite solicitar troca se status for ENTREGUE e estiver dentro do prazo de 7 dias', async () => {
    const dataEntrega = new Date(); // Hoje
    const venda = { ...vendaResultado(), status: 'ENTREGUE', dataHoraEntrega: dataEntrega };
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda as IVenda);

    const servico = new ServicoVendas(mockRepoVendas);
    const resultado = await servico.solicitarTroca('venda-uuid-1', USUARIO_UUID, 'Defeito no livro');

    expect(resultado).toBeDefined();
    expect(mockRepoVendas.registrarTroca).toHaveBeenCalled();
  });

  it('[RN0043] lança erro se o status não for ENTREGUE', async () => {
    const venda = { ...vendaResultado(), status: 'EM PROCESSAMENTO' };
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda as IVenda);

    const servico = new ServicoVendas(mockRepoVendas);
    await expect(
      servico.solicitarTroca('venda-uuid-1', USUARIO_UUID, 'Justificativa'),
    ).rejects.toThrow('Apenas pedidos com status ENTREGUE podem solicitar troca');
  });

  it('[RN0043] lança erro se o prazo de 7 dias expirou', async () => {
    const dataEntrega = new Date();
    dataEntrega.setDate(dataEntrega.getDate() - 8); // 8 dias atrás

    const venda = { ...vendaResultado(), status: 'ENTREGUE', dataHoraEntrega: dataEntrega };
    mockRepoVendas.obterPorUuid.mockResolvedValue(venda as IVenda);

    const servico = new ServicoVendas(mockRepoVendas);
    await expect(
      servico.solicitarTroca('venda-uuid-1', USUARIO_UUID, 'Justificativa'),
    ).rejects.toThrow('Prazo de 7 dias para troca expirado');
  });
});

/**
 * COMO RODAR ESTE TESTE:
 * cd backend
 * npm test src/tests/unitarios/vendas/ServicoVendas.test.ts
 */
