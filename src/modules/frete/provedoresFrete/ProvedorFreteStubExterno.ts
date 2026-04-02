import type { ICotacaoFreteEntrada, IOpcaoFreteCalculada } from '@/modules/frete/IFrete.dto';
import type { IProvedorFrete } from './IProvedorFrete';
import { ProvedorFreteSimulado } from './ProvedorFreteSimulado';

/**
 * Stub para futura integração HTTP com transportadora real (mesmo contrato de `IProvedorFrete`).
 * Por ora delega ao simulador.
 */
export class ProvedorFreteStubExterno implements IProvedorFrete {
  private readonly delegado = new ProvedorFreteSimulado();

  public getCodigo(): string {
    return 'externo_stub';
  }

  public async calcularOpcoes(entrada: ICotacaoFreteEntrada): Promise<IOpcaoFreteCalculada[]> {
    return this.delegado.calcularOpcoes(entrada);
  }
}
