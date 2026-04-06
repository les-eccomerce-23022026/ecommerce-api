import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { vendaParaPayloadPedidoAdmin } from '@/modules/admin/mappers/pedido-admin.mapper';

const ENDERECO_PADRAO_ADMIN = {
  logradouro: 'Despacho administrativo',
  numero: 'S/N',
  cidade: 'São Paulo',
};

/**
 * Casos de uso do painel administrativo de pedidos (alinhado ao frontend).
 */
export class ServicoPedidosAdmin {
  constructor(
    private readonly repositorioVendas: IRepositorioVendas,
    private readonly servicoEntrega: ServicoEntrega,
  ) {}

  async listarPedidos(): Promise<Record<string, unknown>[]> {
    const vendas = await this.repositorioVendas.listarTodas(500);
    return vendas.map((v) => vendaParaPayloadPedidoAdmin(v));
  }

  async despachar(vendaUuid: string): Promise<Record<string, unknown>> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) {
      throw new Error('Pedido não encontrado.');
    }
    if (venda.status !== 'EM PROCESSAMENTO') {
      throw new Error('Somente pedidos em processamento podem ser despachados.');
    }

    await this.servicoEntrega.agendarRemessa({
      vendaUuid,
      tipoFrete: 'SEDEX',
      endereco: ENDERECO_PADRAO_ADMIN,
      custo: Number(venda.frete),
      entregador: 'Operação logística',
    });

    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!atualizada) throw new Error('Pedido não encontrado após despacho.');
    return vendaParaPayloadPedidoAdmin(atualizada);
  }

  async confirmarEntrega(vendaUuid: string): Promise<Record<string, unknown>> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) {
      throw new Error('Pedido não encontrado.');
    }
    if (venda.status !== 'EM TRÂNSITO') {
      throw new Error('Somente pedidos em trânsito podem ter entrega confirmada.');
    }

    const entregas = await this.servicoEntrega.listarPorVenda(vendaUuid);
    if (entregas.length === 0) {
      throw new Error('Nenhuma entrega registrada para este pedido.');
    }

    const entregaMaisRecente = entregas[0];
    await this.servicoEntrega.confirmarRecebimento(entregaMaisRecente.uuid);

    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!atualizada) throw new Error('Pedido não encontrado após confirmação.');
    return vendaParaPayloadPedidoAdmin(atualizada);
  }
}
