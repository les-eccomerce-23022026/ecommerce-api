import { Request, Response } from 'express';
import type { OrdenacaoCatalogo } from '@/modules/livros/ICatalogoLivros.dto';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { Logger } from '@/shared/utils/Logger.util';
import { usuarioTemPapelAdmin } from '@/shared/middlewares/autorizacao.middleware';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';

function parseIntPositivo(val: unknown, padrao: number): number {
  const n = parseInt(String(val ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : padrao;
}

/**
 * Mapper para converter payload legado da API para o contrato do ServicoLivros.
 * Suporta ambos os formatos para compatibilidade com testes legados.
 */
function mapearPayloadCriarLivro(body: any): {
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
} {
  return {
    uuid: body.uuid || crypto.randomUUID(),
    titulo: body.titulo,
    isbn: body.isbn,
    sinopse: body.sinopse,
    imagemUrl: body.imagemUrl,
    autorNome: body.autorNome || body.autor,
    editoraNome: body.editoraNome || body.editora,
    grupoPrecificacaoNome: body.grupoPrecificacaoNome || 'Grupo 1',
    categoriaNome: body.categoriaNome || body.categoria,
    ano: body.ano || body.anoPublicacao,
    edicao: body.edicao || '1ª',
    numeroPaginas: body.numeroPaginas || 200,
    altura: body.altura || 20,
    largura: body.largura || 14,
    peso: body.peso || 300,
    profundidade: body.profundidade || 2,
    codigoBarras: body.codigoBarras || body.isbn,
    quantidadeEstoque: body.quantidadeEstoque || body.estoque,
    precoVenda: body.precoVenda || body.preco,
    valorCusto: body.valorCusto || body.preco * 0.7,
  };
}

/**
 * Validações de negócio para criação/atualização de livros.
 */
function validarDadosLivro(dados: any, isCriacao: boolean = true): { valido: boolean; erro?: string } {
  if (isCriacao && !dados.titulo) {
    return { valido: false, erro: 'Título é obrigatório.' };
  }
  if (isCriacao && !dados.isbn) {
    return { valido: false, erro: 'ISBN é obrigatório.' };
  }
  
  const preco = dados.precoVenda || dados.preco;
  if (preco !== undefined && (typeof preco !== 'number' || preco <= 0)) {
    return { valido: false, erro: 'Preço de venda deve ser maior que zero.' };
  }
  
  const estoque = dados.quantidadeEstoque || dados.estoque;
  if (estoque !== undefined && (typeof estoque !== 'number' || estoque < 0)) {
    return { valido: false, erro: 'Quantidade em estoque não pode ser negativa.' };
  }
  
  const ano = dados.ano || dados.anoPublicacao;
  if (ano !== undefined && (typeof ano !== 'number' || ano < 1900 || ano > 2100)) {
    return { valido: false, erro: 'Ano deve estar entre 1900 e 2100.' };
  }
  
  return { valido: true };
}

export class ControladorLivros {
  constructor(private readonly servico: ServicoLivros) {}

  listarCatalogo = async (req: Request, res: Response): Promise<void> => {
    try {
      const pagina = Math.max(1, parseIntPositivo(req.query.pagina, 1));
      const itensPorPagina = Math.min(50, Math.max(1, parseIntPositivo(req.query.itensPorPagina, 10)));
      const categoria =
        typeof req.query.categoria === 'string' && req.query.categoria.trim() !== ''
          ? req.query.categoria.trim()
          : undefined;
      const ordenacaoRaw = typeof req.query.ordenacao === 'string' ? req.query.ordenacao.trim() : '';
      const ordenacao: OrdenacaoCatalogo =
        ordenacaoRaw === 'mais-vendidos' ? 'mais-vendidos' : 'recentes';

      const resultado = await this.servico.listarCatalogo({
        pagina,
        itensPorPagina,
        categoriaSlug: categoria,
        ordenacao,
      });

      // Endpoint público: manter formato antigo para compatibilidade backward
      res.status(200).json({
        livros: resultado.livros,
        total: resultado.total,
        pagina: resultado.pagina,
        itensPorPagina: resultado.itensPorPagina,
      });
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao listar livros');
      Logger.error(`[ControladorLivros.listarCatalogo] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  categoriasCatalogo = async (_req: Request, res: Response): Promise<void> => {
    try {
      const lista = await this.servico.listarCategoriasMenu();
      // Endpoint público: manter formato antigo (array direto) para compatibilidade backward
      res.status(200).json(lista);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao listar categorias');
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  detalhes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uuid } = req.params;
      const livro = await this.servico.obterPorUuid(uuid);
      if (!livro) {
        RespostaPadrao.enviarErro(res, 404, 'Livro não encontrado');
        return;
      }
      // Endpoint público: manter formato antigo para compatibilidade backward
      res.status(200).json(livro);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao obter livro');
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  listarAdmin = async (_req: Request, res: Response): Promise<void> => {
    try {
      const lista = await this.servico.listarParaAdmin();
      RespostaPadrao.enviarSucesso(res, 200, lista);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao listar livros');
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  criarLivro = async (req: Request, res: Response): Promise<void> => {
    if (!usuarioTemPapelAdmin(req.usuario)) {
      RespostaPadrao.enviarErro(res, 403, 'Acesso negado. Esta rota é restrita a administradores.');
      return;
    }
    try {
      // Validar dados de entrada
      const validacao = validarDadosLivro(req.body, true);
      if (!validacao.valido) {
        RespostaPadrao.enviarErro(res, 400, validacao.erro!);
        return;
      }

      // Mapear payload legado para contrato do serviço
      const dadosMapeados = mapearPayloadCriarLivro(req.body);
      const livro = await this.servico.criarLivro(dadosMapeados);
      RespostaPadrao.enviarSucesso(res, 201, livro);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao criar livro');
      Logger.error(`[ControladorLivros.criarLivro] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  criarLivrosEmLote = async (req: Request, res: Response): Promise<void> => {
    try {
      const corpo = req.body;
      const listaBruta = Array.isArray(corpo) ? corpo : corpo?.livros;
      if (!Array.isArray(listaBruta)) {
        RespostaPadrao.enviarErro(res, 400, 'Payload deve ser um array de livros.');
        return;
      }
      const dadosLivros = listaBruta.map((item) => mapearPayloadCriarLivro(item));
      const livros = await this.servico.criarLivrosEmLote(dadosLivros);
      RespostaPadrao.enviarSucesso(res, 201, { livros, quantidade: livros.length });
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao criar livros em lote');
      Logger.error(`[ControladorLivros.criarLivrosEmLote] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  criarAutoresEmLote = async (req: Request, res: Response): Promise<void> => {
    try {
      const autores = req.body;
      const ids = await this.servico.criarAutoresEmLote(autores);
      RespostaPadrao.enviarSucesso(res, 201, { ids, quantidade: ids.length });
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao criar autores em lote');
      Logger.error(`[ControladorLivros.criarAutoresEmLote] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  criarEditorasEmLote = async (req: Request, res: Response): Promise<void> => {
    try {
      const editoras = req.body;
      const ids = await this.servico.criarEditorasEmLote(editoras);
      RespostaPadrao.enviarSucesso(res, 201, { ids, quantidade: ids.length });
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao criar editoras em lote');
      Logger.error(`[ControladorLivros.criarEditorasEmLote] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  atualizarLivro = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uuid } = req.params;
      const dados = { ...req.body };
      if (dados.preco !== undefined && dados.precoVenda === undefined) {
        dados.precoVenda = dados.preco;
      }
      if (dados.estoque !== undefined && dados.quantidadeEstoque === undefined) {
        dados.quantidadeEstoque = dados.estoque;
      }
      delete dados.preco;
      delete dados.estoque;

      const camposPermitidos = [
        'titulo', 'sinopse', 'imagemUrl', 'ano', 'edicao',
        'numeroPaginas', 'altura', 'largura', 'peso', 'profundidade',
        'codigoBarras', 'quantidadeEstoque', 'precoVenda', 'valorCusto'
      ];
      const camposInvalidos = Object.keys(dados).filter((campo) => !camposPermitidos.includes(campo));

      if (camposInvalidos.length > 0) {
        RespostaPadrao.enviarErro(res, 400, `Campos não permitidos: ${camposInvalidos.join(', ')}`);
        return;
      }

      if (Object.keys(dados).length === 0) {
        RespostaPadrao.enviarErro(res, 400, 'Nenhum dado fornecido para atualização.');
        return;
      }

      const livroAtualizado = await this.servico.atualizarLivroParcial(uuid, dados);
      RespostaPadrao.enviarSucesso(res, 200, livroAtualizado);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao atualizar livro');
      Logger.error(`[ControladorLivros.atualizarLivro] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };
}
