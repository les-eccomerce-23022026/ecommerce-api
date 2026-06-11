import { Pool } from 'pg';
import { Logger } from '@/shared/utils/Logger.util';

export interface IPadraoValidacao {
  padrao: string;
  tipo: 'blacklist' | 'impossivel';
}

export interface IRepositorioPadroesValidacaoIA {
  listarAtivos(): Promise<IPadraoValidacao[]>;
  inserirSeNaoExiste(padrao: string, tipo: string, origem: string): Promise<void>;
  incrementarOcorrencias(padrao: string): Promise<void>;
}

export class RepositorioPadroesValidacaoIA implements IRepositorioPadroesValidacaoIA {
  constructor(private readonly pool: Pool) {}

  async listarAtivos(): Promise<IPadraoValidacao[]> {
    const resultado = await this.pool.query<{ pai_padrao: string; pai_tipo: string }>(
      `SELECT pai_padrao, pai_tipo
       FROM livraria_comercial.padroes_validacao_ia
       WHERE pai_ativo = TRUE
       ORDER BY pai_tipo, pai_padrao`
    );
    return resultado.rows.map((r) => ({
      padrao: r.pai_padrao,
      tipo: r.pai_tipo as 'blacklist' | 'impossivel',
    }));
  }

  async inserirSeNaoExiste(padrao: string, tipo: string, origem: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO livraria_comercial.padroes_validacao_ia
         (pai_padrao, pai_tipo, pai_origem, pai_ocorrencias)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (pai_padrao)
       DO UPDATE SET
         pai_ocorrencias   = livraria_comercial.padroes_validacao_ia.pai_ocorrencias + 1,
         pai_atualizado_em = CURRENT_TIMESTAMP`,
      [padrao, tipo, origem]
    );
    Logger.info(
      `[RepositorioPadroesValidacaoIA] Padrão registrado: "${padrao}" (${tipo}, ${origem})`
    );
  }

  async incrementarOcorrencias(padrao: string): Promise<void> {
    await this.pool.query(
      `UPDATE livraria_comercial.padroes_validacao_ia
       SET pai_ocorrencias   = pai_ocorrencias + 1,
           pai_atualizado_em = CURRENT_TIMESTAMP
       WHERE pai_padrao = $1`,
      [padrao]
    );
  }
}
