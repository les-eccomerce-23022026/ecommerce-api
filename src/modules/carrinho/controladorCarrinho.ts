import { Request, Response } from 'express';
import { ServicoCarrinho } from '@/modules/carrinho/servicoCarrinho';
import { parseSincronizarItemCarrinho } from '@/modules/carrinho/controladorCarrinho-parse.util';

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
      const parsed = parseSincronizarItemCarrinho(req);
      if (!parsed.ok) {
        res.status(parsed.status).json({ erro: parsed.mensagem });
        return;
      }
      const dados = await this.servico.alterarItem(
        usuUuid,
        parsed.livroUuid,
        parsed.quantidade,
        req.usuario?.loj_id_atual,
      );
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
