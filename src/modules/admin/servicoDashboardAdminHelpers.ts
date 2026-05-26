/**
 * Funções puras do dashboard admin (percentuais e datas) para reduzir complexidade no serviço.
 */
export function percentualCrescimento(atual: number, anterior: number): number {
  if (anterior > 0) {
    return Math.round((atual / anterior - 1) * 100);
  }
  if (atual > 0) {
    return 100;
  }
  return 0;
}

export function inicioFimMes(ano: number, mes: number): { ini: Date; fim: Date } {
  const ini = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);
  return { ini, fim };
}

export function indicesUltimosMeses(quantidade: number): number[] {
  return Array.from({ length: quantidade }, (_, k) => quantidade - 1 - k);
}
