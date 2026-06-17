export interface IResultadoVerificacaoMargem {
  aprovacaoNecessaria: boolean;
  margemCalculada: number;
  margemMinima: number;
}

export class VerificadorMargemPreco {
  verificar(precoSolicitado: number, valorCusto: number, margemMinima: number): IResultadoVerificacaoMargem {
    const margemCalculada = valorCusto > 0
      ? ((precoSolicitado - valorCusto) / valorCusto) * 100
      : 0;
    return {
      aprovacaoNecessaria: margemCalculada < margemMinima,
      margemCalculada: Number(margemCalculada.toFixed(2)),
      margemMinima,
    };
  }
}
