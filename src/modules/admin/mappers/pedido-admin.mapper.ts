import type { IVenda } from '@/modules/vendas/repositories/IRepositorioVendas';

/**
 * Alinha com o mapa em `web/src/services/api/pedidoServiceApi.ts` (mapStatusVendaParaPedido).
 */
export function mapStatusVendaParaPedidoFrontend(status: string): string {
  const key = status.trim().toUpperCase();
  const map: Record<string, string> = {
    'EM_PROCESSAMENTO': 'Em Processamento',
    APROVADA: 'Em Processamento',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    REPROVADA: 'Cancelado',
    CANCELADA: 'Cancelado',
    'EM_TRANSITO': 'Em Trânsito',
    'FALHA_NA_ENTREGA': 'Em Trânsito',
    ENTREGUE: 'Entregue',
    'EM_TROCA': 'Em Troca',
    'TROCA_AUTORIZADA': 'Troca Autorizada',
    'TROCA_REJEITADA': 'Troca Rejeitada',
    'TROCA_CONCLUIDA': 'Trocado',
    CONCLUIDA: 'Trocado',
    'EM_DEVOLUCAO': 'Em Devolução',
    'DEVOLUCAO_AUTORIZADA': 'Devolução Autorizada',
    'DEVOLUCAO_REJEITADA': 'Devolução Rejeitada',
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
    status: v.status,
    itens: v.itens.map((i) => ({
      livroUuid: i.livroUuid,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      categoria: 'Livro',
    })),
  };
}
