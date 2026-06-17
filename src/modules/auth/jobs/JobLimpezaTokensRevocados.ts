import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Job responsável por limpar tokens de refresh revocados com mais de 1 dia
 *
 * Fluxo: diariamente, executa a função SQL livraria_gestao.limpar_tokens_revocados()
 * que remove tokens revocados há mais de 1 dia, mantendo apenas tokens recentes
 * para fins de auditoria e debug.
 */
export class JobLimpezaTokensRevocados {
  private intervalo: NodeJS.Timeout | null = null;
  private readonly db: IConexaoBanco;

  constructor(private readonly intervaloHoras: number = 24) {
    this.db = ConexaoPostgres.obterInstancia();
  }

  public iniciar(): void {
    if (this.intervalo) return;

    Logger.info(`[JobLimpezaTokensRevocados] Iniciado (intervalo: ${this.intervaloHoras}h)`);

    setTimeout(() => this.executar(), 10000);
    this.intervalo = setInterval(() => this.executar(), this.intervaloHoras * 60 * 60 * 1000);
  }

  public parar(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      Logger.info('[JobLimpezaTokensRevocados] Parado');
    }
  }

  private async executar(): Promise<void> {
    try {
      const resultado = await this.db.executar<{ limpar_tokens_revocados: bigint }>(
        'SELECT livraria_gestao.limpar_tokens_revocados() as limpar_tokens_revocados'
      );

      const tokensDeletados = resultado[0]?.limpar_tokens_revocados || 0;

      if (tokensDeletados > 0) {
        Logger.info(`[JobLimpezaTokensRevocados] ${tokensDeletados} token(s) revocado(s) limpo(s)`);
      } else {
        Logger.debug('[JobLimpezaTokensRevocados] Nenhum token revocado para limpar');
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[JobLimpezaTokensRevocados] Erro na execução: ${msg}`);
    }
  }
}
