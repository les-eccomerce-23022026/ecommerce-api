import { Request, Response } from 'express';
import { ServicoLivros } from '@/modules/livros/servicoLivros';

export class ControladorLivros {
  constructor(private readonly servico: ServicoLivros) {}

  destaques = async (_req: Request, res: Response): Promise<void> => {
    try {
      const lista = await this.servico.listarDestaques();
      res.status(200).json(lista);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar livros';
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
