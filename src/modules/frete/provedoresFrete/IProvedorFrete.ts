import type { ICotacaoFreteEntrada, IOpcaoFreteCalculada } from '@/modules/frete/IFrete.dto';

/**
 * Porta de saída: cálculo de frete por transportadora (simulada, Correios API futura, etc.).
 */
export interface IProvedorFrete {
  /** Código do provedor (ex.: simulado, correios). */
  getCodigo(): string;

  /**
   * Calcula opções de frete sem persistir.
   * Deve ser determinístico para os mesmos parâmetros.
   */
  calcularOpcoes(entrada: ICotacaoFreteEntrada): Promise<IOpcaoFreteCalculada[]>;
}
