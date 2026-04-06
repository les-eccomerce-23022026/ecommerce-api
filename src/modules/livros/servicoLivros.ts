import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';
import type { ICategoriaMenuDto, IListagemCatalogoLivros, OrdenacaoCatalogo } from '@/modules/livros/ICatalogoLivros.dto';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';

export class ServicoLivros {
  constructor(private readonly repo: RepositorioLivrosPostgres) {}

  listarCatalogo(opcoes: {
    pagina: number;
    itensPorPagina: number;
    categoriaSlug?: string;
    ordenacao: OrdenacaoCatalogo;
  }): Promise<IListagemCatalogoLivros> {
    return this.repo.listarCatalogo(opcoes);
  }

  listarCategoriasMenu(): Promise<ICategoriaMenuDto[]> {
    return this.repo.listarCategoriasComLivrosNoCatalogo();
  }

  obterPorUuid(uuid: string): Promise<ILivroCatalogoDto | null> {
    return this.repo.obterPorUuid(uuid);
  }

  listarParaAdmin(limite = 500): Promise<ILivroCatalogoDto[]> {
    return this.repo.listarTodosAdmin(limite);
  }
}
