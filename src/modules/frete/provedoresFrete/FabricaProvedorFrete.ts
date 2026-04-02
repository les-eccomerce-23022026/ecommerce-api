import type { IProvedorFrete } from './IProvedorFrete';
import { ProvedorFreteSimulado } from './ProvedorFreteSimulado';
import { ProvedorFreteStubExterno } from './ProvedorFreteStubExterno';

type ConstrutorProvedor = () => IProvedorFrete;

/**
 * Instancia o provedor de frete conforme PROVEDOR_FRETE (sem fallback silencioso).
 */
export class FabricaProvedorFrete {
  public static criar(): IProvedorFrete {
    const bruto = process.env.PROVEDOR_FRETE?.trim().toLowerCase();
    if (!bruto) {
      throw new Error('Variável de ambiente PROVEDOR_FRETE é obrigatória (ex.: simulado, externo_stub).');
    }

    const construtores: Record<string, ConstrutorProvedor> = {
      simulado: () => new ProvedorFreteSimulado(),
      externo_stub: () => new ProvedorFreteStubExterno(),
    };

    const fabricar = construtores[bruto];
    if (!fabricar) {
      throw new Error(`PROVEDOR_FRETE inválido: "${bruto}". Valores aceitos: simulado, externo_stub.`);
    }
    return fabricar();
  }
}
