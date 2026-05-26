/**
 * Constantes tipadas para status de vendas.
 * Segue regra U13: proibir strings literais em comparações de domínio.
 */
export const STATUS_VENDAS = {
  EM_PROCESSAMENTO: 'EM PROCESSAMENTO',
  APROVADA: 'APROVADA',
  CANCELADA: 'CANCELADA',
  ENTREGUE: 'ENTREGUE',
  EM_TROCA: 'EM TROCA',
  TROCA_CONCLUIDA: 'TROCA CONCLUÍDA',
} as const;

export type StatusVenda = typeof STATUS_VENDAS[keyof typeof STATUS_VENDAS];
