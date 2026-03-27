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
   * Endpoint para criar uma entrega: POST /entregas
   */
  public async cadastrarEntrega(req: Request, res: Response): Promise<void> {
    try {
      const { vendaUuid, tipoFrete, endereco, custo, entregador } = req.body;
      const entrega = await this.servicoEntrega.cadastrarEntrega({
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
