import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { vendaParaPayloadPedidoAdmin } from '@/modules/admin/mappers/pedido-admin.mapper';
import { ServicoMockCorreios } from '@/modules/logistica-mocks/servicoMockCorreios';
import { ServicoMockLoggi } from '@/modules/logistica-mocks/servicoMockLoggi';

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
    private readonly servicoMockCorreios: ServicoMockCorreios,
    private readonly servicoMockLoggi: ServicoMockLoggi,
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
    const statusAtual = venda.status.trim().toUpperCase();
    const statusPermitidos = new Set(['EM PROCESSAMENTO', 'APROVADA']);
    if (!statusPermitidos.has(statusAtual)) {
      throw new Error('Somente pedidos em processamento ou aprovados podem ser despachados.');
    }

    // Gerar código de rastreamento baseado na transportadora (simulação)
    // Por padrão, usa SEDEX dos Correios
    const tipoFrete = 'SEDEX';
    const codigoRastreamento = this.gerarCodigoRastreamento(tipoFrete);

    // Usar mock de logística para calcular frete e prazo
    const calculoFrete = this.servicoMockCorreios.calcularFrete({
      cepOrigem: '01310-100', // São Paulo
      cepDestino: '13010-100', // Campinas (simulado)
      peso: 1.0, // peso padrão
      tipoFrete,
    });

    // Simular despacho com dados realistas
    await this.servicoEntrega.agendarRemessa({
      vendaUuid,
      tipoFrete,
      endereco: {
        logradouro: 'Rua Mockada',
        numero: '123',
        cidade: 'Campinas',
        estado: 'SP',
        cep: '13010-100',
      },
      custo: calculoFrete.valorFrete,
      entregador: 'Correios',
      codigoRastreamento,
    });

    // Adicionar evento inicial de rastreamento no mock
    await this.servicoMockCorreios.adicionarEventoRastreamento(codigoRastreamento, {
      codigo: 'PO',
      descricao: 'Objeto postado',
      detalhe: 'Objeto postado após o horário limite da unidade',
      data: new Date().toISOString(),
      local: 'São Paulo/SP',
    });

    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!atualizada) throw new Error('Pedido não encontrado após despacho.');
    
    const payload = vendaParaPayloadPedidoAdmin(atualizada);
    return {
      ...payload,
      codigoRastreamento,
      prazoEntrega: calculoFrete.prazoEntrega,
      dataPrevistaEntrega: calculoFrete.dataPrevistaEntrega,
    };
  }

  /**
   * Gera código de rastreamento baseado na transportadora
   */
  private gerarCodigoRastreamento(tipoFrete: string): string {
    if (tipoFrete.startsWith('LOGGI')) {
      // Formato Loggi: 9 caracteres alfanuméricos
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codigo = 'LG';
      for (let i = 0; i < 7; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      return codigo;
    } else {
      // Formato Correios: 2 letras + 9 dígitos + BR
      const letras = 'BR';
      const digitos = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      return `${letras}${digitos}BR`;
    }
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
