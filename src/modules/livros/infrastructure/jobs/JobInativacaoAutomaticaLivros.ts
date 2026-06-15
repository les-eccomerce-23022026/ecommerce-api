import { ServicoInativacaoAutomaticaLivros } from '@/modules/livros/application/ServicoInativacaoAutomaticaLivros';
import { Logger } from '@/shared/utils/Logger.util';

export class JobInativacaoAutomaticaLivros {
  constructor(private readonly servico: ServicoInativacaoAutomaticaLivros) {}

  async executar(): Promise<void> {
    Logger.info('[JobInativacaoAutomaticaLivros] Iniciando verificação automática...');
    try {
      const relatorio = await this.servico.executarVerificacaoAutomatica();
      Logger.info(
        `[JobInativacaoAutomaticaLivros] Concluído: ${relatorio.totalInativados} livros marcados FORA_DE_MERCADO de ${relatorio.totalVerificados} verificados.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Logger.error(`[JobInativacaoAutomaticaLivros] Erro: ${msg}`);
    }
  }
}
