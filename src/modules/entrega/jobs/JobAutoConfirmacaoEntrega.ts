import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Job responsável por confirmar automaticamente entregas cujo prazo expirou
 * sem que o cliente tenha confirmado o recebimento nem registrado não-recebimento.
 *
 * Fluxo: após a dataPrevistaEntrega, se a venda ainda estiver com status
 * "EM TRÂNSITO", o sistema considera a entrega realizada e muda para "ENTREGUE".
 */
export class JobAutoConfirmacaoEntrega {
  private intervalo: NodeJS.Timeout | null = null;

  constructor(
    private readonly repositorioVendas: IRepositorioVendas,
    private readonly repositorioEntrega: IRepositorioEntrega,
    private readonly servicoEntrega: ServicoEntrega,
    private readonly intervaloMinutos: number = 60,
  ) {}

  public iniciar(): void {
    if (this.intervalo) return;

    Logger.info(`[JobAutoConfirmacao] Iniciado (intervalo: ${this.intervaloMinutos} min)`);

    setTimeout(() => this.executar(), 5000);
    this.intervalo = setInterval(() => this.executar(), this.intervaloMinutos * 60 * 1000);
  }

  public parar(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      Logger.info('[JobAutoConfirmacao] Parado');
    }
  }

  private async executar(): Promise<void> {
    try {
      const vendasUuids = await this.repositorioVendas.listarVendasEmTransitoComPrazoVencido();

      if (vendasUuids.length === 0) return;

      Logger.info(`[JobAutoConfirmacao] ${vendasUuids.length} venda(s) com prazo vencido`);

      for (const vendaUuid of vendasUuids) {
        await this.confirmarEntregaDaVenda(vendaUuid);
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobAutoConfirmacao] Erro na execução: ${msg}`);
    }
  }

  private async confirmarEntregaDaVenda(vendaUuid: string): Promise<void> {
    try {
      const entregas = await this.repositorioEntrega.listarPorVendaUuid(vendaUuid);
      if (entregas.length === 0) {
        Logger.warn(`[JobAutoConfirmacao] Venda ${vendaUuid} sem entrega registrada, ignorando`);
        return;
      }

      const entregaMaisRecente = entregas[0];
      await this.servicoEntrega.confirmarRecebimento(entregaMaisRecente.uuid);

      Logger.info(`[JobAutoConfirmacao] Venda ${vendaUuid} confirmada automaticamente`);
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobAutoConfirmacao] Falha ao confirmar venda ${vendaUuid}: ${msg}`);
    }
  }
}
