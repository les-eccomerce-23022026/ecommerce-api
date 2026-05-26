import { IPagamento, IRepositorioPagamentos } from '../../repositories/IRepositorioPagamentos';
import { IResultadoDefinirMetodoLiquidacao } from '../../entities/IPagamento.dto';
import { gerarDadosCobrancaPixSimulada } from '../gerarCobrancaPixSimulada';

export class ServicoPixPagamentos {
  constructor(
    private readonly repositorioPagamentos: IRepositorioPagamentos,
  ) {}

  public async processarCobrancaPix(salvo: IPagamento): Promise<IResultadoDefinirMetodoLiquidacao> {
    const pix = gerarDadosCobrancaPixSimulada(salvo.valor);
    const pagId = await this.repositorioPagamentos.obterPagIdInternoPorUuid(salvo.id);
    if (pagId === null) {
      throw new Error('Falha ao obter pagamento para cobrança PIX');
    }
    await this.repositorioPagamentos.inserirPixSimulado(pagId, {
      copiaCola: pix.copiaCola,
      qrBase64: pix.qrBase64,
      expiraEm: pix.expiraEm,
      segredoConfirmacao: pix.segredoConfirmacao
    });

    return {
      pagamento: salvo,
      pixCobranca: {
        copiaCola: pix.copiaCola,
        qrCodeBase64: pix.qrBase64,
        expiraEm: pix.expiraEm,
        segredoConfirmacao: pix.segredoConfirmacao
      }
    };
  }
}
