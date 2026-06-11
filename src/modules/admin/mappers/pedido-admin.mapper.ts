import type { IVenda } from '@/modules/vendas/repositories/IRepositorioVendas';

/**
 * Alinha com o mapa em `web/src/services/api/pedidoServiceApi.ts` (mapStatusVendaParaPedido).
 */
export function mapStatusVendaParaPedidoFrontend(status: string): string {
  const key = status.trim().toUpperCase();
  const map: Record<string, string> = {
    'EM PROCESSAMENTO': 'Em Processamento',
    APROVADA: 'Em Processamento',
    'AGUARDANDO PAGAMENTO': 'Aguardando Pagamento',
    REPROVADA: 'Cancelado',
    CANCELADA: 'Cancelado',
    'EM TRÂNSITO': 'Em Trânsito',
    'FALHA NA ENTREGA': 'Em Trânsito',
    ENTREGUE: 'Entregue',
    'EM TROCA': 'Em Troca',
    'TROCA AUTORIZADA': 'Troca Autorizada',
    'TROCA REJEITADA': 'Troca Rejeitada',
    'TROCA CONCLUÍDA': 'Trocado',
    CONCLUÍDA: 'Trocado',
    'EM DEVOLUÇÃO': 'Devoluções',
    'DEVOLUÇÃO AUTORIZADA': 'Devoluções',
    'DEVOLUÇÃO REJEITADA': 'Devoluções',
  };
  // Fallback neutro: status desconhecido NÃO deve virar 'Em Processamento',
  // senão o admin renderia botão "Despachar" indevido e o backend rejeita com 400.
  return map[key] ?? 'Pendentes';
}

/** Formato esperado pelo Redux / `IPedido` no frontend (sem tipagem TS no JSON). */
export function vendaParaPayloadPedidoAdmin(v: IVenda): Record<string, unknown> {
  const criado = v.criadoEm instanceof Date ? v.criadoEm : new Date(v.criadoEm);
  return {
    uuid: v.uuid,
    data: criado.toISOString(),
    clienteUuid: v.usuarioUuid,
    total: v.totalVenda,
    status: mapStatusVendaParaPedidoFrontend(v.status),
    itens: v.itens.map((i) => ({
      livroUuid: i.livroUuid,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      categoria: 'Livro',
    })),
  };
}
