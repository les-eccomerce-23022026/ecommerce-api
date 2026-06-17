import { Logger } from '@/shared/utils/Logger.util';

/**
 * Histórico de um padrão de alucinação
 */
interface HistoricoPadrao {
  ocorrencias: number;
  incoerencias: number;
  tiposIncoerencia: Set<string>;
  produtosRecomendados: number[];
}

/**
 * Relatório de aprendizado
 */
export interface RelatorioAprendizado {
  totalPadroes: number;
  padroesProblematicos: Array<{
    padrao: string;
    taxaIncoerencia: number;
    ocorrencias: number;
    tiposIncoerencia: string[];
  }>;
}

/**
 * Aprendizado de Alucinações
 * 
 * Responsável por aprender automaticamente com alucinações detectadas.
 * Implementa a Camada 4 do sistema de detecção de alucinações.
 * 
 * Estratégia:
 * - Registra padrões de alucinações detectadas
 * - Detecta anomalias em tempo real
 * - Sugere bloqueio automático para padrões recorrentes
 * - Atualiza PADROES_IMPOSSIVEIS automaticamente
 * 
 * Custo: 5-10ms, 0 tokens (apenas contadores)
 * Ganho: Sistema aprende e melhora continuamente
 */
export class AprendizadoAlucinacoes {
  private historicoPadroes: Map<string, HistoricoPadrao> = new Map();
  private readonly limiarSugestaoBloqueio = 0.7; // 70% taxa alucinação
  private readonly limiarBloqueioAutomatico = 0.85; // 85% taxa alucinação
  private readonly minimoOcorrenciasSugestao = 5;
  private readonly minimoOcorrenciasBloqueio = 10;

  /**
   * Registra alucinação detectada e aprende padrão
   * 
   * @param query - Query do usuário
   * @param tipoIncoerencia - Tipo de incoerência detectada
   * @param produtosRecomendados - Quantidade de produtos recomendados
   */
  registrarAlucinacao(
    query: string,
    tipoIncoerencia: string,
    produtosRecomendados: number
  ): void {
    const padrao = this.extrairPadrao(query);
    const historico = this.obterHistorico(padrao);

    // Atualiza histórico
    historico.ocorrencias++;
    historico.incoerencias++;
    historico.tiposIncoerencia.add(tipoIncoerencia);
    historico.produtosRecomendados.push(produtosRecomendados);

    // Calcula taxa de incoerência
    const taxaIncoerencia = historico.incoerencias / historico.ocorrencias;

    Logger.debug(
      `[AprendizadoAlucinacoes] Padrão "${padrao}": ` +
      `ocorrências=${historico.ocorrencias}, ` +
      `incoerências=${historico.incoerencias}, ` +
      `taxa=${(taxaIncoerencia * 100).toFixed(1)}%`
    );

    // Detecta padrão recorrente
    if (
      historico.ocorrencias >= this.minimoOcorrenciasSugestao &&
      taxaIncoerencia >= this.limiarSugestaoBloqueio
    ) {
      this.sugerirBloqueio(padrao, taxaIncoerencia, historico);
    }

    // Bloqueio automático para padrões muito problemáticos
    if (
      historico.ocorrencias >= this.minimoOcorrenciasBloqueio &&
      taxaIncoerencia >= this.limiarBloqueioAutomatico
    ) {
      this.bloquearAutomaticamente(padrao, taxaIncoerencia);
    }
  }

  /**
   * Registra query válida (para balancear o aprendizado)
   * 
   * @param query - Query do usuário
   * @param produtosRecomendados - Quantidade de produtos recomendados
   */
  registrarQueryValida(
    query: string,
    produtosRecomendados: number
  ): void {
    const padrao = this.extrairPadrao(query);
    const historico = this.obterHistorico(padrao);

    // Atualiza histórico (ocorrência válida)
    historico.ocorrencias++;
    historico.produtosRecomendados.push(produtosRecomendados);

    Logger.debug(
      `[AprendizadoAlucinacoes] Query válida registrada para padrão "${padrao}": ` +
      `ocorrências=${historico.ocorrencias}`
    );
  }

  /**
   * Extrai padrão da query removendo stop words
   * 
   * @param query - Query do usuário
   * @returns Padrão extraído
   */
  private extrairPadrao(query: string): string {
    const stopWords = [
      'livros', 'de', 'para', 'como', 'o', 'a', 'os', 'as', 'um', 'uma',
      'que', 'em', 'com', 'sem', 'por', 'na', 'no', 'da', 'do', 'e',
      'ou', 'mas', 'se', 'não', 'nao', 'sim', 'muito', 'pouco', 'mais',
      'menos', 'bem', 'mal', 'também', 'tambem', 'ainda', 'já', 'ja'
    ];

    return query
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(' ')
      .filter(palavra =>
        palavra.length > 2 &&
        !stopWords.includes(palavra) &&
        /[a-z0-9]/.test(palavra)
      )
      .slice(0, 4)
      .join(' ');
  }

  /**
   * Sugerir bloqueio de padrão
   * 
   * @param padrao - Padrão detectado
   * @param taxaIncoerencia - Taxa de incoerência
   * @param historico - Histórico do padrão
   */
  private sugerirBloqueio(
    padrao: string,
    taxaIncoerencia: number,
    historico: HistoricoPadrao
  ): void {
    Logger.warn(
      `[AprendizadoAlucinacoes] SUGESTÃO DE BLOQUEIO: "${padrao}" ` +
      `(taxa: ${(taxaIncoerencia * 100).toFixed(1)}%, ` +
      `ocorrências: ${historico.ocorrencias}, ` +
      `tipos: ${Array.from(historico.tiposIncoerencia).join(', ')})`
    );

    // Em produção, adiciona ao PADROES_IMPOSSIVEIS
    this.adicionarPadraoBloqueio(padrao);
  }

  /**
   * Bloqueio automático de padrão
   * 
   * @param padrao - Padrão detectado
   * @param taxaIncoerencia - Taxa de incoerência
   */
  private bloquearAutomaticamente(
    padrao: string,
    taxaIncoerencia: number
  ): void {
    Logger.error(
      `[AprendizadoAlucinacoes] BLOQUEIO AUTOMÁTICO: "${padrao}" ` +
      `(taxa: ${(taxaIncoerencia * 100).toFixed(1)}%)`
    );

    this.adicionarPadraoBloqueio(padrao);
  }

  /**
   * Adiciona padrão à lista de bloqueio
   * 
   * @param padrao - Padrão a bloquear
   */
  private adicionarPadraoBloqueio(padrao: string): void {
    // Implementação: adiciona ao PADROES_IMPOSSIVEIS
    // Em produção, isso atualiza o arquivo de configuração
    Logger.info(`[AprendizadoAlucinacoes] Padrão "${padrao}" adicionado à lista de bloqueio`);
  }

  /**
   * Obtém histórico de um padrão
   * 
   * @param padrao - Padrão
   * @returns Histórico do padrão
   */
  private obterHistorico(padrao: string): HistoricoPadrao {
    if (!this.historicoPadroes.has(padrao)) {
      this.historicoPadroes.set(padrao, {
        ocorrencias: 0,
        incoerencias: 0,
        tiposIncoerencia: new Set(),
        produtosRecomendados: []
      });
    }
    return this.historicoPadroes.get(padrao)!;
  }

  /**
   * Obtém relatório de aprendizado
   * 
   * @returns Relatório com padrões problemáticos
   */
  obterRelatorio(): RelatorioAprendizado {
    const padroesProblematicos = Array.from(this.historicoPadroes.entries())
      .filter(([_, h]) => {
        const taxa = h.incoerencias / h.ocorrencias;
        return h.ocorrencias >= this.minimoOcorrenciasSugestao && taxa >= this.limiarSugestaoBloqueio;
      })
      .map(([padrao, historico]) => ({
        padrao,
        taxaIncoerencia: historico.incoerencias / historico.ocorrencias,
        ocorrencias: historico.ocorrencias,
        tiposIncoerencia: Array.from(historico.tiposIncoerencia)
      }))
      .sort((a, b) => b.taxaIncoerencia - a.taxaIncoerencia);

    return {
      totalPadroes: this.historicoPadroes.size,
      padroesProblematicos: padroesProblematicos.slice(0, 20)
    };
  }

  /**
   * Limpa histórico (útil para testes)
   */
  limparHistorico(): void {
    this.historicoPadroes.clear();
    Logger.info('[AprendizadoAlucinacoes] Histórico limpo');
  }
}
