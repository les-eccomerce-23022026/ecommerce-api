import { Request, Response } from 'express';
import type { OrdenacaoCatalogo } from '@/modules/livros/ICatalogoLivros.dto';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { Logger } from '@/shared/utils/Logger.util';

function parseIntPositivo(val: unknown, padrao: number): number {
  const n = parseInt(String(val ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : padrao;
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

      res.status(200).json({
        livros: resultado.livros,
        total: resultado.total,
        pagina: resultado.pagina,
        itensPorPagina: resultado.itensPorPagina,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar livros';
      Logger.error(`[ControladorLivros.listarCatalogo] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      res.status(500).json({ erro: msg });
    }
  };

  categoriasCatalogo = async (_req: Request, res: Response): Promise<void> => {
    try {
      const lista = await this.servico.listarCategoriasMenu();
      res.status(200).json(lista);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar categorias';
      res.status(500).json({ erro: msg });
    }
  };

  detalhes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uuid } = req.params;
      const livro = await this.servico.obterPorUuid(uuid);
      if (!livro) {
        res.status(404).json({ erro: 'Livro não encontrado' });
        return;
      }
      res.status(200).json(livro);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao obter livro';
      res.status(500).json({ erro: msg });
    }
  };

  listarAdmin = async (_req: Request, res: Response): Promise<void> => {
    try {
      const lista = await this.servico.listarParaAdmin();
      res.status(200).json(lista);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar livros';
      res.status(500).json({ erro: msg });
    }
  };
}
