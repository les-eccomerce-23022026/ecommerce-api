import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ServicoPagamentos } from './ServicoPagamentos';
import { IPagamentoInputDto, IPagamentoOutputDto } from './IPagamento.dto';
import type { ServicoFrete } from '@/modules/frete/ServicoFrete';
import { cepOrigemPadrao, sanitizarCep8Digitos } from '@/modules/frete/freteCepUtil';
import type { GestaoIdentidadeCliente } from '@/modules/clientes/clientes.service';

/**
 * Controlador para operações de pagamentos.
 */
export class ControladorPagamentos {
  private readonly servicoPagamentos: ServicoPagamentos;

  private readonly servicoFrete: ServicoFrete;

  private readonly gestaoCliente?: GestaoIdentidadeCliente;

  constructor(
    servicoPagamentos: ServicoPagamentos,
    servicoFrete: ServicoFrete,
    gestaoCliente?: GestaoIdentidadeCliente,
  ) {
    this.servicoPagamentos = servicoPagamentos;
    this.servicoFrete = servicoFrete;
    this.gestaoCliente = gestaoCliente;
  }

  /**
   * Fornece informações necessárias ao frontend para seleção de pagamento
   * (endereços do cliente, cartões salvos, cupons e opções de frete).
   * Aqui retornamos uma resposta simplificada e segura para consumo do cliente.
   */
  // eslint-disable-next-line class-methods-use-this
  public obterPagamentoInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const cepQ = typeof req.query.cepDestino === 'string' ? req.query.cepDestino : '';
      const pesoQ = req.query.pesoKg ?? req.query.peso;
      const valorItensQ = req.query.valorTotalItens;
      const pesoNum =
        pesoQ !== undefined && String(pesoQ).length > 0 ? Number(pesoQ) : 1;
      const valorItensNum =
        valorItensQ !== undefined && String(valorItensQ).length > 0
          ? Number(valorItensQ)
          : undefined;

      const cepDestino = cepQ.trim() || '01000000';
      if (!Number.isFinite(pesoNum) || pesoNum <= 0) {
        res.status(400).json({ erro: 'pesoKg inválido' });
        return;
      }
      const opcoes = await this.servicoFrete.cotarEPersistir({
        cepDestino,
        pesoKg: pesoNum,
        valorTotalItens:
          valorItensNum !== undefined && Number.isFinite(valorItensNum) ? valorItensNum : undefined,
      });
      const freteOpcoes = opcoes.map((o) => ({
        uuid: o.cotacaoUuid,
        tipo: o.tipo,
        valor: o.valor,
        prazo: o.prazo,
        selecionado: false,
      }));

      let enderecosCliente: Array<{
        uuid: string;
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cep: string;
        cidade: string;
        estado: string;
        tipo: 'cobranca' | 'entrega' | 'ambos';
      }> = [];

      let cartoesCliente: Array<{
        uuid: string;
        ultimosDigitosCartao: string;
        nomeCliente: string;
        nomeImpresso: string;
        bandeira: string;
        validade: string;
        principal: boolean;
      }> = [];

      try {
        if (this.gestaoCliente && req.usuario?.uuid) {
          const perfil = await this.gestaoCliente.obterPerfil(req.usuario.uuid);
          enderecosCliente = (perfil.enderecos ?? []).map((e) => ({
            uuid: e.uuid ?? '',
            logradouro: e.logradouro,
            numero: e.numero,
            complemento: e.complemento ?? '',
            bairro: e.bairro,
            cep: e.cep,
            cidade: e.cidade,
            estado: e.estado,
            tipo: 'ambos' as const,
          }));
          cartoesCliente = (perfil.cartoes ?? []).map((c) => ({
            uuid: c.uuid,
            ultimosDigitosCartao: c.ultimosDigitosCartao,
            nomeCliente: c.nomeImpresso,
            nomeImpresso: c.nomeImpresso,
            bandeira: c.bandeira,
            validade: c.validade,
            principal: c.principal,
          }));
        }
      } catch {
        // Mantém listas vazias (ex.: perfil incompleto)
      }

      const resposta = {
        enderecosCliente,
        cartoesCliente,
        cuponsDisponiveis: [
          { uuid: uuidv4(), codigo: 'DESCONTO10', tipo: 'promocional', valor: 10, descricao: '10% de desconto (simulado)' },
          { uuid: uuidv4(), codigo: 'TROCA50', tipo: 'troca', valor: 50, descricao: 'Cupom de troca R$50 (simulado)' },
        ],
        bandeirasPermitidas: ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'],
        freteOpcoes,
        freteMeta: {
          provedor: this.servicoFrete.getCodigoProvedorAtivo(),
          cepOrigem: cepOrigemPadrao(),
          cepDestino: cepQ.trim() ? sanitizarCep8Digitos(cepQ) : '01000000',
          pesoKg: pesoNum,
        },
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
