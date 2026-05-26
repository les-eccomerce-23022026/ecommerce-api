import { Request, Response } from 'express';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';

/**
 * Controlador responsável pelas requisições de entrega.
 */
export class ControladorEntrega {
  private readonly servicoEntrega: ServicoEntrega;

  constructor(servicoEntrega: ServicoEntrega) {
    this.servicoEntrega = servicoEntrega;
  }

  /**
   * Agenda remessa (entrega): POST /entregas
   */
  public async agendarRemessa(req: Request, res: Response): Promise<void> {
    try {
      const { vendaUuid, tipoFrete, endereco, custo, entregador } = req.body;
      const entrega = await this.servicoEntrega.agendarRemessa({
        vendaUuid,
        tipoFrete,
        endereco,
        custo,
        entregador,
      });

      res.status(201).json(entrega);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro interno servidor';
      res.status(400).json({ erro: mensagem });
    }
  }

  /**
   * Registra falha na entrega: PATCH /entregas/:entregaUuid/falha
   */
  public async registrarFalha(req: Request, res: Response): Promise<void> {
    try {
      const { entregaUuid } = req.params;
      await this.servicoEntrega.registrarFalhaEntrega(entregaUuid);
      res.status(204).send();
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao registrar falha';
      res.status(400).json({ erro: mensagem });
    }
  }

  /**
   * Confirma recebimento: PATCH /entregas/:entregaUuid/confirmar
   */
  public async confirmarRecebimento(req: Request, res: Response): Promise<void> {
    try {
      const { entregaUuid } = req.params;
      await this.servicoEntrega.confirmarRecebimento(entregaUuid);
      res.status(204).send();
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao confirmar recebimento';
      res.status(400).json({ erro: mensagem });
    }
  }

  /**
   * Reagenda entrega (re-endereçamento): PATCH /entregas/:entregaUuid/reagendar
   */
  public async reagendarEntrega(req: Request, res: Response): Promise<void> {
    try {
      const { entregaUuid } = req.params;
      const { endereco } = req.body;
      if (!endereco) {
        throw new Error('Novo endereço é obrigatório para reagendamento.');
      }
      await this.servicoEntrega.reagendarEntrega(entregaUuid, endereco);
      res.status(204).send();
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao reagendar entrega';
      res.status(400).json({ erro: mensagem });
    }
  }

  /**
   * Endpoint para consultar uma única entrega: GET /entregas/:entregaUuid
   */
  public async consultarEntrega(req: Request, res: Response): Promise<void> {
    try {
      const { entregaUuid } = req.params;
      const entrega = await this.servicoEntrega.consultarEntrega(entregaUuid);
      res.status(200).json(entrega);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Entrega não encontrada';
      res.status(404).json({ erro: mensagem });
    }
  }

  /**
   * Endpoint para listar entregas vinculadas a uma venda: GET /entregas (vendaUuid em query)
   */
  public async listarPorVenda(req: Request, res: Response): Promise<void> {
    try {
      const vendaUuid = req.query.vendaUuid as string;
      if (!vendaUuid) {
        throw new Error('Venda UUID é obrigatório na query string.');
      }

      const entregas = await this.servicoEntrega.listarPorVenda(vendaUuid);
      res.status(200).json(entregas);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao listar entregas';
      res.status(400).json({ erro: mensagem });
    }
  }
}
