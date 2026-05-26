import type { IProvedorPagamento } from './IProvedorPagamento';
import { ProvedorPagamentoSimulado } from './ProvedorPagamentoSimulado';
import { ProvedorPagamentoStripe } from './ProvedorPagamentoStripe';
import type { IRepositorioIntencaoPagamento } from '../intencaoPagamento/IRepositorioIntencaoPagamento';

type ConstrutorProvedor = () => IProvedorPagamento;

/**
 * Instancia o provedor de pagamento conforme PROVEDOR_PAGAMENTO (sem fallback silencioso).
 * O provedor simulado exige repositório de intenções persistido no banco.
 */
export class FabricaProvedorPagamento {
  public static criar(repositorioIntencao: IRepositorioIntencaoPagamento): IProvedorPagamento {
    const bruto = process.env.PROVEDOR_PAGAMENTO?.trim().toLowerCase();
    if (!bruto) {
      throw new Error('Variável de ambiente PROVEDOR_PAGAMENTO é obrigatória (ex.: simulado, stripe).');
    }

    const construtores: Record<string, ConstrutorProvedor> = {
      simulado: () => new ProvedorPagamentoSimulado(repositorioIntencao),
      stripe: () => new ProvedorPagamentoStripe()
    };

    const fabricar = construtores[bruto];
    if (!fabricar) {
      throw new Error(`PROVEDOR_PAGAMENTO inválido: "${bruto}". Valores aceitos: simulado, stripe.`);
    }
    return fabricar();
  }
}
