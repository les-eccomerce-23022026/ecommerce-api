export type CorpoCotacaoFrete = {
  cepDestino: string;
  pesoKg: number;
  valorItens?: number;
  cepOrigem?: string;
};

export function parseCorpoCotacaoFrete(body: Record<string, unknown>): CorpoCotacaoFrete {
  const cepDestino = typeof body.cepDestino === 'string' ? body.cepDestino : '';
  const pesoBruto = body.pesoKg ?? body.peso;
  const pesoKg = pesoBruto !== undefined && pesoBruto !== null ? Number(pesoBruto) : 1;
  const valorItensBruto = body.valorTotalItens;
  const valorItens =
    valorItensBruto !== undefined && valorItensBruto !== null ? Number(valorItensBruto) : undefined;
  const cepOrigem = typeof body.cepOrigem === 'string' ? body.cepOrigem : undefined;
  return { cepDestino, pesoKg, valorItens, cepOrigem };
}
