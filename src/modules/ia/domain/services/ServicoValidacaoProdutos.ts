/**
 * Serviço de Domínio para Validação de Produtos
 * 
 * Responsável por validar se os produtos recomendados existem na base de dados
 * (anti-alucinação - RN-IA-001 e RN-IA-004).
 */
export class ServicoValidacaoProdutos {
  /**
   * Valida se uma lista de produtos existe na base de dados
   * 
   * @param produtosUuids Lista de UUIDs de produtos a validar
   * @param produtosExistentes Mapa de produtos existentes (uuid -> true)
   * @returns Lista de produtos que não existem
   */
  validarExistenciaProdutos(
    produtosUuids: string[],
    produtosExistentes: Set<string>
  ): string[] {
    const produtosInexistentes: string[] = [];

    for (const uuid of produtosUuids) {
      if (!produtosExistentes.has(uuid)) {
        produtosInexistentes.push(uuid);
      }
    }

    return produtosInexistentes;
  }

  /**
   * Valida se todos os produtos recomendados existem
   * 
   * @throws Error se algum produto não existir
   */
  validarRecomendacao(
    produtosRecomendados: string[],
    produtosExistentes: Set<string>
  ): void {
    const inexistentes = this.validarExistenciaProdutos(
      produtosRecomendados,
      produtosExistentes
    );

    if (inexistentes.length > 0) {
      throw new Error(
        `Produtos recomendados não existem na base de dados: ${inexistentes.join(', ')}`
      );
    }
  }

  /**
   * Filtra apenas produtos que existem na base de dados
   */
  filtrarProdutosExistentes(
    produtosUuids: string[],
    produtosExistentes: Set<string>
  ): string[] {
    return produtosUuids.filter((uuid) => produtosExistentes.has(uuid));
  }

  /**
   * Calcula a precisão das recomendações (produtos existentes / total recomendados)
   */
  calcularPrecisao(
    produtosRecomendados: string[],
    produtosExistentes: Set<string>
  ): number {
    if (produtosRecomendados.length === 0) {
      return 0;
    }

    const existentes = this.filtrarProdutosExistentes(
      produtosRecomendados,
      produtosExistentes
    );

    return existentes.length / produtosRecomendados.length;
  }
}