import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';
import type { ICategoriaMenuDto, IListagemCatalogoLivros, OrdenacaoCatalogo } from '@/modules/livros/ICatalogoLivros.dto';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';

export class ServicoLivros {
  constructor(
    private readonly repo: RepositorioLivrosPostgres,
    private readonly bulkInsert: RepositorioLivrosBulkInsert,
  ) {}

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

  async criarLivro(dados: {
    uuid: string;
    titulo: string;
    isbn: string;
    sinopse?: string;
    imagemUrl?: string;
    autorNome: string;
    editoraNome: string;
    grupoPrecificacaoNome: string;
    categoriaNome: string;
    ano: number;
    edicao: string;
    numeroPaginas: number;
    altura: number;
    largura: number;
    peso: number;
    profundidade: number;
    codigoBarras: string;
    quantidadeEstoque: number;
    precoVenda: number;
    valorCusto: number;
  }): Promise<ILivroCatalogoDto> {
    // Buscar IDs relacionados em lote
    const mapaAutores = await this.bulkInsert.buscarIdsPorNomes('autores', 'aut_nome', 'aut_id', [dados.autorNome]);
    const autorId = mapaAutores.get(dados.autorNome);
    if (!autorId) {
      throw new Error(`Autor "${dados.autorNome}" não encontrado`);
    }

    const mapaEditoras = await this.bulkInsert.buscarIdsPorNomes('editoras', 'edi_nome', 'edi_id', [dados.editoraNome]);
    const editoraId = mapaEditoras.get(dados.editoraNome);
    if (!editoraId) {
      throw new Error(`Editora "${dados.editoraNome}" não encontrada`);
    }

    const mapaGrupos = await this.bulkInsert.buscarIdsPorNomes('grupos_precificacao', 'gpr_descricao', 'gpr_id', [dados.grupoPrecificacaoNome]);
    const grupoPrecificacaoId = mapaGrupos.get(dados.grupoPrecificacaoNome);
    if (!grupoPrecificacaoId) {
      throw new Error(`Grupo de precificação "${dados.grupoPrecificacaoNome}" não encontrado`);
    }

    const mapaCategorias = await this.bulkInsert.buscarIdsPorNomes('categorias', 'cat_nome', 'cat_id', [dados.categoriaNome]);
    const categoriaId = mapaCategorias.get(dados.categoriaNome);

    // Criar livro com transação
    await this.bulkInsert.criarLivroComTransacao({
      uuid: dados.uuid,
      titulo: dados.titulo,
      isbn: dados.isbn,
      sinopse: dados.sinopse,
      imagemUrl: dados.imagemUrl,
      autorId,
      editoraId,
      grupoPrecificacaoId,
      categoriaId,
      ano: dados.ano,
      edicao: dados.edicao,
      numeroPaginas: dados.numeroPaginas,
      altura: dados.altura,
      largura: dados.largura,
      peso: dados.peso,
      profundidade: dados.profundidade,
      codigoBarras: dados.codigoBarras,
      quantidadeEstoque: dados.quantidadeEstoque,
      precoVenda: dados.precoVenda,
      valorCusto: dados.valorCusto,
    });

    // Retornar o livro criado
    return this.repo.obterPorUuid(dados.uuid).then((livro) => {
      if (!livro) {
        throw new Error('Erro ao recuperar livro criado');
      }
      return livro;
    });
  }

  async criarLivrosEmLote(dadosLivros: Array<{
    uuid: string;
    titulo: string;
    isbn: string;
    sinopse?: string;
    imagemUrl?: string;
    autorNome: string;
    editoraNome: string;
    grupoPrecificacaoNome: string;
    categoriaNome?: string;
    ano: number;
    edicao: string;
    numeroPaginas: number;
    altura: number;
    largura: number;
    peso: number;
    profundidade: number;
    codigoBarras: string;
    quantidadeEstoque: number;
    precoVenda: number;
    valorCusto: number;
  }>): Promise<ILivroCatalogoDto[]> {
    if (dadosLivros.length === 0) return [];

    // Coletar todos os nomes únicos
    const autoresNomes = [...new Set(dadosLivros.map((l) => l.autorNome))];
    const editorasNomes = [...new Set(dadosLivros.map((l) => l.editoraNome))];
    const gruposNomes = [...new Set(dadosLivros.map((l) => l.grupoPrecificacaoNome))];
    const categoriasNomes = [...new Set(dadosLivros.map((l) => l.categoriaNome).filter((c): c is string => Boolean(c)))];

    // Buscar todos os IDs em lote
    const mapaAutores = await this.bulkInsert.buscarIdsPorNomes('autores', 'aut_nome', 'aut_id', autoresNomes);
    const mapaEditoras = await this.bulkInsert.buscarIdsPorNomes('editoras', 'edi_nome', 'edi_id', editorasNomes);
    const mapaGrupos = await this.bulkInsert.buscarIdsPorNomes('grupos_precificacao', 'gpr_descricao', 'gpr_id', gruposNomes);
    const mapaCategorias = await this.bulkInsert.buscarIdsPorNomes('categorias', 'cat_nome', 'cat_id', categoriasNomes);

    // Validar e preparar dados
    const dadosPreparados = dadosLivros.map((livro) => {
      const autorId = mapaAutores.get(livro.autorNome);
      if (!autorId) {
        throw new Error(`Autor "${livro.autorNome}" não encontrado`);
      }

      const editoraId = mapaEditoras.get(livro.editoraNome);
      if (!editoraId) {
        throw new Error(`Editora "${livro.editoraNome}" não encontrada`);
      }

      const grupoPrecificacaoId = mapaGrupos.get(livro.grupoPrecificacaoNome);
      if (!grupoPrecificacaoId) {
        throw new Error(`Grupo de precificação "${livro.grupoPrecificacaoNome}" não encontrado`);
      }

      const categoriaId = livro.categoriaNome ? mapaCategorias.get(livro.categoriaNome) : undefined;

      return {
        uuid: livro.uuid,
        titulo: livro.titulo,
        isbn: livro.isbn,
        sinopse: livro.sinopse,
        imagemUrl: livro.imagemUrl,
        autorId,
        editoraId,
        grupoPrecificacaoId,
        categoriaId,
        ano: livro.ano,
        edicao: livro.edicao,
        numeroPaginas: livro.numeroPaginas,
        altura: livro.altura,
        largura: livro.largura,
        peso: livro.peso,
        profundidade: livro.profundidade,
        codigoBarras: livro.codigoBarras,
        quantidadeEstoque: livro.quantidadeEstoque,
        precoVenda: livro.precoVenda,
        valorCusto: livro.valorCusto,
      };
    });

    // Criar livros em lote com transação
    await this.bulkInsert.criarLivrosEmLoteComTransacao(dadosPreparados);

    // Retornar os livros criados
    const livrosCriados = await Promise.all(
      dadosLivros.map((livro) => this.repo.obterPorUuid(livro.uuid)),
    );

    return livrosCriados.filter((l): l is ILivroCatalogoDto => l !== null);
  }

  async criarAutoresEmLote(autores: Array<{ nome: string; descricao?: string }>): Promise<number[]> {
    return this.bulkInsert.inserirAutoresEmLote(autores);
  }

  async criarEditorasEmLote(editoras: Array<{ nome: string; cnpj: string }>): Promise<number[]> {
    return this.bulkInsert.inserirEditorasEmLote(editoras);
  }

  async inativarLivro(uuid: string, motivo: string, categoriaInativacao?: string): Promise<ILivroCatalogoDto> {
    const livro = await this.repo.obterPorUuid(uuid);
    if (!livro) {
      throw new Error('Livro não encontrado.');
    }
    if (!livro.status || livro.status === 'Inativo') {
      throw new Error('Livro já está inativo.');
    }

    await this.repo.inativarLivro(uuid);
    return this.repo.obterPorUuid(uuid).then((l) => {
      if (!l) throw new Error('Erro ao recuperar livro após inativação');
      return l;
    });
  }

  async ativarLivro(uuid: string, motivo: string, categoriaAtivacao?: string): Promise<ILivroCatalogoDto> {
    const livro = await this.repo.obterPorUuid(uuid);
    if (!livro) {
      throw new Error('Livro não encontrado.');
    }
    if (livro.status === 'Ativo') {
      throw new Error('Livro já está ativo.');
    }

    await this.repo.ativarLivro(uuid);
    return this.repo.obterPorUuid(uuid).then((l) => {
      if (!l) throw new Error('Erro ao recuperar livro após ativação');
      return l;
    });
  }

  async atualizarLivroParcial(uuid: string, dados: {
    titulo?: string;
    sinopse?: string;
    imagemUrl?: string;
    ano?: number;
    edicao?: string;
    numeroPaginas?: number;
    altura?: number;
    largura?: number;
    peso?: number;
    profundidade?: number;
    codigoBarras?: string;
    quantidadeEstoque?: number;
    precoVenda?: number;
    valorCusto?: number;
  }): Promise<ILivroCatalogoDto> {
    // Validações de negócio
    if (dados.precoVenda !== undefined && dados.precoVenda <= 0) {
      throw new Error('Preço de venda deve ser maior que zero.');
    }
    if (dados.valorCusto !== undefined && dados.valorCusto <= 0) {
      throw new Error('Valor de custo deve ser maior que zero.');
    }
    if (dados.quantidadeEstoque !== undefined && dados.quantidadeEstoque < 0) {
      throw new Error('Quantidade em estoque não pode ser negativa.');
    }
    if (dados.numeroPaginas !== undefined && dados.numeroPaginas <= 0) {
      throw new Error('Número de páginas deve ser maior que zero.');
    }
    if (dados.ano !== undefined && (dados.ano < 1900 || dados.ano > 2100)) {
      throw new Error('Ano deve estar entre 1900 e 2100.');
    }

    return this.repo.atualizarLivroParcial(uuid, dados);
  }
}
