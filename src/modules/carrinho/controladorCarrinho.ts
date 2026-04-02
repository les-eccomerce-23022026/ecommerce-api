import { Request, Response } from 'express';
import { ServicoCarrinho } from '@/modules/carrinho/servicoCarrinho';

export class ControladorCarrinho {
  constructor(private readonly servico: ServicoCarrinho) {}

  obter = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuUuid = req.usuario?.uuid;
      if (!usuUuid) {
        res.status(401).json({ mensagem: 'Não autenticado.', sucesso: false });
        return;
      }
      const dados = await this.servico.montarResposta(usuUuid);
      res.status(200).json(dados);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao obter carrinho';
      res.status(500).json({ erro: msg });
    }
  };

  sincronizarItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuUuid = req.usuario?.uuid;
      if (!usuUuid) {
        res.status(401).json({ mensagem: 'Não autenticado.', sucesso: false });
        return;
      }
      const { livroUuid, quantidade } = req.body as { livroUuid?: string; quantidade?: unknown };
      if (!livroUuid || typeof livroUuid !== 'string') {
        res.status(400).json({ erro: 'livroUuid é obrigatório' });
        return;
      }
      const q = Number(quantidade);
      if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) {
        res.status(400).json({ erro: 'quantidade deve ser um inteiro >= 0' });
        return;
      }
      const dados = await this.servico.alterarItem(usuUuid, livroUuid, q);
      res.status(200).json(dados);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar carrinho';
      const status = msg.includes('estoque') || msg.includes('encontrado') || msg.includes('indisponível') ? 400 : 500;
      res.status(status).json({ erro: msg });
    }
  };

  limpar = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuUuid = req.usuario?.uuid;
      if (!usuUuid) {
        res.status(401).json({ mensagem: 'Não autenticado.', sucesso: false });
        return;
      }
      const dados = await this.servico.limpar(usuUuid);
      res.status(200).json(dados);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao limpar carrinho';
      res.status(500).json({ erro: msg });
    }
  };
}
