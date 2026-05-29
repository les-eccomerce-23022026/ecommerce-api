import { normalizarTextoBusca } from '@/shared/utils/normalizarTextoBusca.util';
import { expandirTermosGenero } from '../utils/aliasesGeneroCatalogo';
import { IntencaoRecomendacao } from '../entities/IntencaoRecomendacao.entity';
import { ProdutoRecomendado } from './ServicoRecomendacaoRAG';

export interface FiltrosCatalogoEntrada {
  precoMax?: number;
  paginasMax?: number;
  generos?: string[];
  publicoAlvo?: string;
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
 */
export class ServicoFiltroCatalogo {
  aplicar(
    produtos: ProdutoRecomendado[],
    filtros: FiltrosCatalogoEntrada
  ): ResultadoFiltroCatalogo {
    const filtrados = produtos.filter((p) => this.atendeFiltros(p, filtros, false));

    if (filtrados.length > 0 || !this.temFiltrosRestritivos(filtros)) {
      return { produtos: filtrados, filtrosRelaxados: false };
    }

    const relaxados = produtos.filter((p) => this.atendeFiltros(p, filtros, true));

    return {
      produtos: relaxados,
      filtrosRelaxados: true,
      mensagemRelaxamento:
        'Não encontrei títulos com todas as condições; seguem sugestões próximas ao que você pediu.',
    };
  }

  filtrosDeIntencao(intencao: IntencaoRecomendacao): FiltrosCatalogoEntrada {
    return {
      precoMax: intencao.precoMax,
      paginasMax: intencao.paginasMax,
      generos: intencao.generos,
      publicoAlvo: intencao.publicoAlvo,
    };
  }

  private temFiltrosRestritivos(filtros: FiltrosCatalogoEntrada): boolean {
    return (
      filtros.precoMax !== undefined ||
      filtros.paginasMax !== undefined ||
      (filtros.generos !== undefined && filtros.generos.length > 0) ||
      filtros.publicoAlvo !== undefined
    );
  }

  private atendeFiltros(
    produto: ProdutoRecomendado,
    filtros: FiltrosCatalogoEntrada,
    relaxarPaginas: boolean
  ): boolean {
    const meta = produto.metadados ?? {};
    const preco = Number(meta.preco ?? 0);
    const paginas = Number(meta.numeroPaginas ?? 0);
    const categoria = normalizarTextoBusca(String(meta.categoria ?? ''));
    const tags = normalizarTextoBusca(String(meta.tags ?? ''));
    const textoBusca = normalizarTextoBusca(
      `${meta.titulo ?? ''} ${meta.sinopse ?? ''} ${meta.categoria ?? ''} ${meta.tags ?? ''}`
    );

    if (filtros.precoMax !== undefined && preco > filtros.precoMax) {
      return false;
    }

    if (
      !relaxarPaginas &&
      filtros.paginasMax !== undefined &&
      paginas > 0 &&
      paginas > filtros.paginasMax
    ) {
      return false;
    }

    if (filtros.generos && filtros.generos.length > 0) {
      const matchGenero = filtros.generos.some((generoIntencao) => {
        const termos = expandirTermosGenero(generoIntencao);
        return termos.some(
          (termo) =>
            termo.length > 0 &&
            (categoria.includes(termo) || tags.includes(termo) || textoBusca.includes(termo))
        );
      });
      if (!matchGenero) {
        return false;
      }
    }

    if (filtros.publicoAlvo) {
      const tagsPublico = MAPA_PUBLICO_TAGS[filtros.publicoAlvo] ?? [];
      if (tagsPublico.length > 0) {
        const matchPublico = tagsPublico.some((t) => {
          const termo = normalizarTextoBusca(t);
          return (
            termo.length > 0 &&
            (categoria.includes(termo) || tags.includes(termo) || textoBusca.includes(termo))
          );
        });
        if (!matchPublico && filtros.publicoAlvo === 'infantil') {
          return false;
        }
      }
    }

    return true;
  }
}
