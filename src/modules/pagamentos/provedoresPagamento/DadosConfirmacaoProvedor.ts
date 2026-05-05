/**
 * Entrada unificada para confirmação de cobrança no provedor externo de pagamento.
 */
export interface DadosConfirmacaoProvedor {
  /** Valor total acordado (intenção ou pagamento persistido). */
  valorTotal: number;
  /** Parcelas por cartão no checkout; soma deve coincidir com valorTotal quando informado. */
  pagamentosCartao?: Array<{ valor: number; parcelasCartao?: number; magicRecusar?: boolean }>;
  /** Referência retornada em registrarIntencaoPagamento. */
  idIntencao?: string;
  segredoConfirmacao?: string;
  /**
   * Quando true, apenas o serviço de domínio chama (ex.: pagamento já registrado com UUID).
   * Não exige idIntencao no cliente.
   */
  confirmacaoServicoInterna?: boolean;
  /** Metadados para simulação de comportamento (Sandbox). */
  cartaoParaSimulacao?: { ultimosDigitos: string };
}

export interface ResultadoIntencaoPagamento {
  idIntencao: string;
  segredoConfirmacao: string;
}

export interface ResultadoConfirmacaoPagamento {
  sucesso: boolean;
  status: string;
}
