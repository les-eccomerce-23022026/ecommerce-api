import { normalizarTextoBusca } from '@/shared/utils/normalizarTextoBusca.util';
import { expandirTermosGenero } from './aliasesGeneroCatalogo';
import { IntencaoRecomendacao } from './IntencaoRecomendacao.entity';
import { ProdutoRecomendado } from './servicoRecomendacaoRAG';

export interface FiltrosCatalogoEntrada {
  precoMax?: number;
  precoMin?: number;
  paginasMax?: number;
  generos?: string[];
  publicoAlvo?: string;
  autor?: string;
  anoMin?: number;
  anoMax?: number;
}

export interface ResultadoFiltroCatalogo {
  produtos: ProdutoRecomendado[];
  filtrosRelaxados: boolean;
  mensagemRelaxamento?: string;
}

const MAPA_PUBLICO_TAGS: Record<string, string[]> = {
  infantil: ['infantil', 'young adult', 'juvenil'],
  juvenil: ['young adult', 'juvenil', 'ya'],
  adulto: [],
};

/**
 * Filtra candidatos do Chroma por metadados estruturados (preço, páginas, gênero/tags).
 * Estratégia híbrida: match estrito por categoria primeiro, relaxa para semântico se resultados insuficientes.
 */
export class ServicoFiltroCatalogo {
  aplicar(
    produtos: ProdutoRecomendado[],
    filtros: FiltrosCatalogoEntrada
  ): ResultadoFiltroCatalogo {
    // Filtro estrito (apenas categoria/tags exatas)
    const estritos = produtos.filter((p) => this.atendeFiltros(p, filtros, false, true));

    if (estritos.length >= 3 || !filtros.generos || filtros.generos.length === 0) {
      return { produtos: estritos, filtrosRelaxados: false };
    }

    // Relaxa para busca semântica se menos de 3 resultados
    const relaxados = produtos.filter((p) => this.atendeFiltros(p, filtros, false, false));

    return {
      produtos: relaxados,
      filtrosRelaxados: true,
      mensagemRelaxamento:
        'Não encontrei suficientes títulos na categoria específica; seguem sugestões semelhantes.',
    };
  }

  filtrosDeIntencao(intencao: IntencaoRecomendacao): FiltrosCatalogoEntrada {
    return {
      precoMax: intencao.precoMax,
      precoMin: intencao.precoMin,
      paginasMax: intencao.paginasMax,
      generos: intencao.generos,
      publicoAlvo: intencao.publicoAlvo,
      autor: intencao.autor,
      anoMin: intencao.anoMin,
      anoMax: intencao.anoMax,
    };
  }

  private temFiltrosRestritivos(filtros: FiltrosCatalogoEntrada): boolean {
    return (
      filtros.precoMax !== undefined ||
      filtros.precoMin !== undefined ||
      filtros.paginasMax !== undefined ||
      (filtros.generos !== undefined && filtros.generos.length > 0) ||
      filtros.publicoAlvo !== undefined ||
      filtros.autor !== undefined ||
      filtros.anoMin !== undefined ||
      filtros.anoMax !== undefined
    );
  }

  private atendeFiltros(
    produto: ProdutoRecomendado,
    filtros: FiltrosCatalogoEntrada,
    relaxarPaginas: boolean,
    matchEstritoGeneros: boolean = true
  ): boolean {
    const meta = produto.metadados ?? {};
    const preco = Number(meta.preco ?? 0);
    const paginas = Number(meta.numeroPaginas ?? 0);
    const ano = Number(meta.anoPublicacao ?? 0);
    const autor = normalizarTextoBusca(String(meta.autor ?? ''));
    const categoria = normalizarTextoBusca(String(meta.categoria ?? ''));
    const tags = normalizarTextoBusca(String(meta.tags ?? ''));
    const textoBusca = normalizarTextoBusca(
      `${meta.titulo ?? ''} ${meta.sinopse ?? ''} ${meta.categoria ?? ''} ${meta.tags ?? ''}`
    );

    if (!this.atendeFiltroPreco(preco, filtros.precoMax, filtros.precoMin)) {
      return false;
    }

    if (!this.atendeFiltroPaginas(paginas, filtros.paginasMax, relaxarPaginas)) {
      return false;
    }

    if (!this.atendeFiltroAutor(autor, filtros.autor)) {
      return false;
    }

    if (!this.atendeFiltroAno(ano, filtros.anoMin, filtros.anoMax)) {
      return false;
    }

    if (!this.atendeFiltroGeneros(filtros.generos, categoria, tags, textoBusca, matchEstritoGeneros)) {
      return false;
    }

    if (!this.atendeFiltroPublicoAlvo(filtros.publicoAlvo, categoria, tags, textoBusca)) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se produto atende filtro de preço usando early return
   */
  private atendeFiltroPreco(preco: number, precoMax?: number, precoMin?: number): boolean {
    if (precoMax !== undefined && preco > precoMax) {
      return false;
    }
    if (precoMin !== undefined && preco < precoMin) {
      return false;
    }
    return true;
  }

  /**
   * Verifica se produto atende filtro de páginas usando early return
   */
  private atendeFiltroPaginas(paginas: number, paginasMax?: number, relaxarPaginas?: boolean): boolean {
    if (paginasMax === undefined || paginas === 0) {
      return true;
    }

    if (relaxarPaginas) {
      return true;
    }

    return paginas <= paginasMax;
  }

  /**
   * Filtro rígido de autor (nunca relaxado): match por inclusão de sobrenome/nome.
   */
  private atendeFiltroAutor(autorProduto: string, autorFiltro?: string): boolean {
    if (!autorFiltro) {
      return true;
    }
    const alvo = normalizarTextoBusca(autorFiltro);
    if (alvo.length === 0) {
      return true;
    }
    // Autor do produto ausente nunca casa um filtro de autor explícito (evita falso-positivo
    // de `alvo.includes("")`, que seria sempre verdadeiro).
    if (autorProduto.length === 0) {
      return false;
    }
    // Casa se o autor do produto contém o termo buscado ou vice-versa (ex.: "asimov" ⊂ "isaac asimov").
    return autorProduto.includes(alvo) || alvo.includes(autorProduto);
  }

  /**
   * Filtro rígido de ano de publicação (nunca relaxado).
   */
  private atendeFiltroAno(ano: number, anoMin?: number, anoMax?: number): boolean {
    if (ano === 0) {
      // Sem dado de ano: só excluímos quando há restrição explícita de ano.
      return anoMin === undefined && anoMax === undefined;
    }
    if (anoMin !== undefined && ano < anoMin) {
      return false;
    }
    if (anoMax !== undefined && ano > anoMax) {
      return false;
    }
    return true;
  }

  /**
   * Verifica se produto atende filtro de gêneros usando early return
   * Prioriza match estrito por categoria para evitar alucinações
   */
  private atendeFiltroGeneros(
    generos?: string[],
    categoria?: string,
    tags?: string,
    textoBusca?: string,
    matchEstrito: boolean = true
  ): boolean {
    if (!generos || generos.length === 0) {
      return true;
    }

    const matchGenero = generos.some((generoIntencao) => {
      const termos = expandirTermosGenero(generoIntencao);
      
      if (matchEstrito) {
        // Match estrito: apenas categoria ou tags exatas
        return termos.some(
          (termo) =>
            termo.length > 0 &&
            (categoria?.includes(termo) || tags?.includes(termo))
        );
      }
      
      // Match relaxado: inclui textoBusca (semântico)
      return termos.some(
        (termo) =>
          termo.length > 0 &&
          (categoria?.includes(termo) || tags?.includes(termo) || textoBusca?.includes(termo))
      );
    });

    return matchGenero;
  }

  /**
   * Verifica se produto atende filtro de público-alvo usando early return
   */
  private atendeFiltroPublicoAlvo(
    publicoAlvo?: string,
    categoria?: string,
    tags?: string,
    textoBusca?: string
  ): boolean {
    if (!publicoAlvo) {
      return true;
    }

    const tagsPublico = MAPA_PUBLICO_TAGS[publicoAlvo] ?? [];
    if (tagsPublico.length === 0) {
      return true;
    }

    const matchPublico = tagsPublico.some((t) => {
      const termo = normalizarTextoBusca(t);
      return (
        termo.length > 0 &&
        (categoria?.includes(termo) || tags?.includes(termo) || textoBusca?.includes(termo))
      );
    });

    if (matchPublico) {
      return true;
    }

    if (publicoAlvo === 'infantil') {
      return false;
    }

    return true;
  }
}
