import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { ServicoFrete } from '@/modules/frete/ServicoFrete';
import type { GestaoIdentidadeCliente } from '@/modules/clientes/clientes.service';
import { executarObterPagamentoInfo } from '@/modules/pagamentos/controlador-pagamentos-obter-info.handler';
import { IPagamentoInputDto, IPagamentoOutputDto } from './IPagamento.dto';
import { ServicoPagamentos } from './ServicoPagamentos';
import type { IRepositorioPagamentos } from './IRepositorioPagamentos';
import { PagamentosHelper } from './pagamentos.helper';

export class ControladorPagamentos {
  constructor(
    private readonly servicoPagamentos: ServicoPagamentos,
    private readonly servicoFrete: ServicoFrete,
    private readonly repoPagamentos: IRepositorioPagamentos,
    private readonly gestaoCliente?: GestaoIdentidadeCliente,
  ) {}

  public obterPagamentoInfo = async (req: Request, res: Response): Promise<void> => {
    await executarObterPagamentoInfo(req, res, {
      servicoFrete: this.servicoFrete,
      repoPagamentos: this.repoPagamentos,
      gestaoCliente: this.gestaoCliente,
    });
  };

  public definirMetodoLiquidacao = async (req: Request, res: Response): Promise<void> => {
    try {
      const dados: IPagamentoInputDto = req.body;
      const resultado = await this.servicoPagamentos.definirMetodoLiquidacao(dados);
      const { pagamento, pixCobranca } = resultado;
      const resposta: IPagamentoOutputDto = {
        ...PagamentosHelper.mapearPagamentoParaDto(pagamento),
        ...(pixCobranca ? {
          pixCobranca: {
            copiaCola: pixCobranca.copiaCola,
            qrCodeBase64: pixCobranca.qrCodeBase64,
            expiraEm: pixCobranca.expiraEm.toISOString(),
            segredoConfirmacao: pixCobranca.segredoConfirmacao
          }
        } : {})
      };
      res.status(201).json(resposta);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  public obterResumoPagamentosVenda = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendaUuid } = req.params;
      const uid = req.usuario?.uuid;
      if (!uid) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }
      const resumo = await this.servicoPagamentos.obterResumoPagamentosVenda(vendaUuid ?? '', uid);
      res.status(200).json(resumo);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  public webhookPagamentoPixSimulado = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as { pagamentoUuid?: string; segredoConfirmacao?: string };
      const pagamentoUuid = typeof body.pagamentoUuid === 'string' ? body.pagamentoUuid.trim() : '';
      const segredo = typeof body.segredoConfirmacao === 'string' ? body.segredoConfirmacao.trim() : '';
      if (!pagamentoUuid || !segredo) {
        res.status(400).json({ erro: 'pagamentoUuid e segredoConfirmacao são obrigatórios' });
        return;
      }
      await this.servicoPagamentos.confirmarPagamentoPixWebhook(pagamentoUuid, segredo);
      res.status(200).json({ sucesso: true, mensagem: 'PIX confirmado' });
    } catch (erro) {
      const msg = (erro as Error).message;
      res.status(msg.includes('expirada') ? 410 : 400).json({ erro: msg });
    }
  };

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

  public vincularIntencaoVenda = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inpUuid } = req.params;
      const vendaUuid = typeof (req.body as { vendaUuid?: unknown }).vendaUuid === 'string'
        ? (req.body as { vendaUuid: string }).vendaUuid.trim() : '';
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

  public solicitarAutorizacaoFinanceira = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pagamentoUuid } = req.params;
      const pagamento = await this.servicoPagamentos.solicitarAutorizacaoFinanceira(pagamentoUuid);
      res.status(200).json(PagamentosHelper.mapearPagamentoParaDto(pagamento));
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  public solicitarAutorizacaoFinanceiraCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
      const corpo = req.body as Record<string, unknown>;
      const resultado = await this.servicoPagamentos.confirmarAutorizacaoFinanceiraCheckout(corpo);
      const vendaUuid = typeof corpo.vendaUuid === 'string' && corpo.vendaUuid.trim().length > 0
        ? corpo.vendaUuid.trim() : uuidv4();
      res.status(200).json({
        sucesso: resultado.sucesso,
        pedidoUuid: vendaUuid,
        status: resultado.statusTexto,
        ...(resultado.pagamentoUuid !== undefined ? { pagamentoUuid: resultado.pagamentoUuid } : {})
      });
    } catch (erro) {
      const mensagem = (erro as Error).message;
      res.status(mensagem.includes('Stripe ainda não implementado') ? 501 : 400).json({ erro: mensagem });
    }
  };

  public consultarPagamento = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pagamentoUuid } = req.params;
      const pagamento = await this.servicoPagamentos.consultarPagamento(pagamentoUuid);
      if (!pagamento) {
        res.status(404).json({ erro: 'Pagamento não encontrado' });
        return;
      }
      res.status(200).json(PagamentosHelper.mapearPagamentoParaDto(pagamento));
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };
}
