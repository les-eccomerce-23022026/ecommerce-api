/**
 * Interface de Métricas Determinísticas do Pipeline RAG
 *
 * Expõe métricas objetivas e reproduzíveis do pipeline de recomendação:
 * tempos de execução por etapa e taxa de alucinação.
 *
 * "Determinísticas" = independem de modelo generativo; calculadas
 * exclusivamente a partir de contagens e timestamps do próprio sistema.
 */
export interface IMetricasDeterministicas {
  /**
   * Taxa de alucinação: totalFiltrados / totalCandidatos (valor entre 0 e 1).
   * 0 = nenhum candidato inventado; 1 = todos os candidatos eram inválidos.
   */
  taxaAlucinacao: number;

  /** Tempo gasto para gerar o embedding da query do usuário (ms). */
  tempoEmbedding: number;

  /** Tempo gasto na busca vetorial no ChromaDB (ms). */
  tempoBuscaVetorial: number;

  /** Tempo gasto na etapa de validação anti-alucinação (ms). */
  tempoValidacao: number;

  /** Tempo total do pipeline de recomendação, do embedding até a resposta (ms). */
  tempoTotal: number;

  /** Total de candidatos únicos retornados pelo ChromaDB antes dos filtros. */
  totalCandidatos: number;

  /** Total de candidatos válidos (presentes no catálogo). */
  totalValidos: number;

  /** Total de candidatos filtrados por não existirem no catálogo. */
  totalFiltrados: number;
}
