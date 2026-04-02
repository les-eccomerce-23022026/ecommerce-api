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
  public async obterPagamentoInfo(_req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Seleciona forma de pagamento para uma venda.
   */
  public async definirMetodoLiquidacao(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Processa o pagamento.
   */
  public async solicitarAutorizacaoFinanceira(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Endpoint compatível com frontend: recebe payload de finalização
   * e retorna um resultado simplificado de processamento (simulado).
   */
  // eslint-disable-next-line class-methods-use-this
  public async solicitarAutorizacaoFinanceiraCheckout(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as Record<string, unknown>;

      // Validações mínimas
      if (!payload || !Array.isArray(payload.pagamentosCartao)) {
        res.status(400).json({ erro: 'Payload inválido' });
        return;
      }

      const somaCartoes = (payload.pagamentosCartao as Array<{ valor: number | string }>).reduce(
        (acc: number, p: { valor: number | string }) => acc + (Number(p.valor) || 0),
        0
      );

      // Simulação: aprova se soma <= 1000
      const aprovado = somaCartoes <= 1000;

      const resposta = {
        sucesso: aprovado,
        pedidoUuid: uuidv4(),
        status: aprovado ? 'APROVADA' : 'REPROVADA',
      };

      res.status(200).json(resposta);
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  }

  /**
   * Consulta pagamento por UUID.
   */
  public async consultarPagamento(req: Request, res: Response): Promise<void> {
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
  }
}
