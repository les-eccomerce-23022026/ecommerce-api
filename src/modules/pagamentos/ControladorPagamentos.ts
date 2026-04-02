import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ServicoPagamentos } from './ServicoPagamentos';
import { IPagamentoInputDto, IPagamentoOutputDto } from './IPagamento.dto';

/**
 * Controlador para operações de pagamentos.
 */
export class ControladorPagamentos {
  private readonly servicoPagamentos: ServicoPagamentos;

  constructor(servicoPagamentos: ServicoPagamentos) {
    this.servicoPagamentos = servicoPagamentos;
  }

  /**
   * Fornece informações necessárias ao frontend para seleção de pagamento
   * (endereços do cliente, cartões salvos, cupons e opções de frete).
   * Aqui retornamos uma resposta simplificada e segura para consumo do cliente.
   */
  // eslint-disable-next-line class-methods-use-this
  public obterPagamentoInfo = async (_req: Request, res: Response): Promise<void> => {
    try {
      const resposta = {
        enderecosCliente: [],
        cartoesCliente: [],
        cuponsDisponiveis: [
          { uuid: uuidv4(), codigo: 'DESCONTO10', tipo: 'promocional', valor: 10, descricao: '10% de desconto (simulado)' },
          { uuid: uuidv4(), codigo: 'TROCA50', tipo: 'troca', valor: 50, descricao: 'Cupom de troca R$50 (simulado)' },
        ],
        bandeirasPermitidas: ['VISA', 'MASTERCARD'],
        freteOpcoes: [
          { uuid: uuidv4(), tipo: 'PAC', valor: 15.0, prazo: '5-7 dias' },
          { uuid: uuidv4(), tipo: 'SEDEX', valor: 30.0, prazo: '1-2 dias' },
        ],
      };

      res.status(200).json(resposta);
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  };

  /**
   * Seleciona forma de pagamento para uma venda.
   */
  public definirMetodoLiquidacao = async (req: Request, res: Response): Promise<void> => {
    try {
      const dados: IPagamentoInputDto = req.body;
      const pagamento = await this.servicoPagamentos.definirMetodoLiquidacao(dados);

      const resposta: IPagamentoOutputDto = {
        id: pagamento.id,
        vendaUuid: pagamento.vendaUuid,
        valor: pagamento.valor,
        formaPagamento: {
          tipo: pagamento.formaPagamento.getTipo(),
          detalhes: pagamento.formaPagamento.getDetalhes()
        },
        cartao: pagamento.cartao ? {
          numeroTokenizado: pagamento.cartao.getNumeroTokenizado(),
          nomeTitular: pagamento.cartao.getNomeTitular(),
          validade: pagamento.cartao.getValidade(),
          bandeira: pagamento.cartao.getBandeira()
        } : undefined,
        status: pagamento.status,
        criadoEm: pagamento.criadoEm,
        processadoEm: pagamento.processadoEm
      };

      res.status(201).json(resposta);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  /**
   * Registra intenção de pagamento no provedor (valor travado para confirmação no checkout).
   */
  public registrarIntencaoPagamento = async (req: Request, res: Response): Promise<void> => {
    try {
      const valorTotal = Number((req.body as { valorTotal?: unknown }).valorTotal);
      if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
        res.status(400).json({ erro: 'valorTotal inválido' });
        return;
      }
      const resultado = await this.servicoPagamentos.registrarIntencaoPagamento(valorTotal);
      res.status(201).json(resultado);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  /**
   * Vincula intenção de pagamento (CRIADA) à venda informada.
   */
  public vincularIntencaoVenda = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inpUuid } = req.params;
      const vendaUuid = typeof (req.body as { vendaUuid?: unknown }).vendaUuid === 'string'
        ? (req.body as { vendaUuid: string }).vendaUuid.trim()
        : '';
      if (!vendaUuid) {
        res.status(400).json({ erro: 'vendaUuid é obrigatório' });
        return;
      }
      await this.servicoPagamentos.vincularIntencaoVenda(inpUuid ?? '', vendaUuid);
      res.status(204).send();
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  /**
   * Processa o pagamento.
   */
  public solicitarAutorizacaoFinanceira = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pagamentoUuid } = req.params;
      const pagamento = await this.servicoPagamentos.solicitarAutorizacaoFinanceira(pagamentoUuid);

      const resposta: IPagamentoOutputDto = {
        id: pagamento.id,
        vendaUuid: pagamento.vendaUuid,
        valor: pagamento.valor,
        formaPagamento: {
          tipo: pagamento.formaPagamento.getTipo(),
          detalhes: pagamento.formaPagamento.getDetalhes()
        },
        cartao: pagamento.cartao ? {
          numeroTokenizado: pagamento.cartao.getNumeroTokenizado(),
          nomeTitular: pagamento.cartao.getNomeTitular(),
          validade: pagamento.cartao.getValidade(),
          bandeira: pagamento.cartao.getBandeira()
        } : undefined,
        status: pagamento.status,
        criadoEm: pagamento.criadoEm,
        processadoEm: pagamento.processadoEm
      };

      res.status(200).json(resposta);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  /**
   * Endpoint compatível com frontend: confirma pagamento no provedor (intenção prévia obrigatória).
   */
  public solicitarAutorizacaoFinanceiraCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
      const corpo = req.body as Record<string, unknown>;
      const resultado = await this.servicoPagamentos.confirmarAutorizacaoFinanceiraCheckout(corpo);
      res.status(200).json({
        sucesso: resultado.sucesso,
        pedidoUuid: uuidv4(),
        status: resultado.statusTexto,
        ...(resultado.pagamentoUuid !== undefined ? { pagamentoUuid: resultado.pagamentoUuid } : {})
      });
    } catch (erro) {
      const mensagem = (erro as Error).message;
      if (mensagem.includes('Stripe ainda não implementado')) {
        res.status(501).json({ erro: mensagem });
        return;
      }
      res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Consulta pagamento por UUID.
   */
  public consultarPagamento = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pagamentoUuid } = req.params;
      const pagamento = await this.servicoPagamentos.consultarPagamento(pagamentoUuid);

      if (!pagamento) {
        res.status(404).json({ erro: 'Pagamento não encontrado' });
        return;
      }

      const resposta: IPagamentoOutputDto = {
        id: pagamento.id,
        vendaUuid: pagamento.vendaUuid,
        valor: pagamento.valor,
        formaPagamento: {
          tipo: pagamento.formaPagamento.getTipo(),
          detalhes: pagamento.formaPagamento.getDetalhes()
        },
        cartao: pagamento.cartao ? {
          numeroTokenizado: pagamento.cartao.getNumeroTokenizado(),
          nomeTitular: pagamento.cartao.getNomeTitular(),
          validade: pagamento.cartao.getValidade(),
          bandeira: pagamento.cartao.getBandeira()
        } : undefined,
        status: pagamento.status,
        criadoEm: pagamento.criadoEm,
        processadoEm: pagamento.processadoEm
      };

      res.status(200).json(resposta);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };
}
