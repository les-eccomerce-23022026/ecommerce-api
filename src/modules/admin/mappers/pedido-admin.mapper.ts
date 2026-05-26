import type { IVenda } from '@/modules/vendas/repositories/IRepositorioVendas';

/**
 * Alinha com o mapa em `web/src/services/api/pedidoServiceApi.ts` (mapStatusVendaParaPedido).
 */
export function mapStatusVendaParaPedidoFrontend(status: string): string {
  const key = status.trim().toUpperCase();
  const map: Record<string, string> = {
    'EM PROCESSAMENTO': 'Em Processamento',
    APROVADA: 'Preparando',
    REPROVADA: 'Cancelado',
    'EM TRÂNSITO': 'Em Trânsito',
    ENTREGUE: 'Entregue',
    'EM TROCA': 'Em Troca',
    'TROCA AUTORIZADA': 'Troca Autorizada',
    CONCLUÍDA: 'Trocado',
  };
  return map[key] ?? 'Em Processamento';
}

/** Formato esperado pelo Redux / `IPedido` no frontend (sem tipagem TS no JSON). */
export function vendaParaPayloadPedidoAdmin(v: IVenda): Record<string, unknown> {
  const criado = v.criadoEm instanceof Date ? v.criadoEm : new Date(v.criadoEm);
  return {
    uuid: v.id,
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
