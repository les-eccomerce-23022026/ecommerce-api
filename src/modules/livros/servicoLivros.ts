import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';

export class ServicoLivros {
  constructor(private readonly repo: RepositorioLivrosPostgres) {}

  listarDestaques(limite = 24): Promise<ILivroCatalogoDto[]> {
    return this.repo.listarDestaques(limite);
  }

  obterPorUuid(uuid: string): Promise<ILivroCatalogoDto | null> {
    return this.repo.obterPorUuid(uuid);
  }

  listarParaAdmin(limite = 500): Promise<ILivroCatalogoDto[]> {
    return this.repo.listarTodosAdmin(limite);
  }
}
