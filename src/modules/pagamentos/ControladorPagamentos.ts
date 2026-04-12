import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ServicoPagamentos } from './ServicoPagamentos';
import { IPagamentoInputDto, IPagamentoOutputDto } from './IPagamento.dto';
import type { ServicoFrete } from '@/modules/frete/ServicoFrete';
import { cepOrigemPadrao, sanitizarCep8Digitos } from '@/modules/frete/freteCepUtil';
import type { GestaoIdentidadeCliente } from '@/modules/clientes/clientes.service';
import { Logger } from '@/shared/utils/Logger.util';
import { PARCELAS_CARTAO_MAX } from './IPagamento.dto';

import type { IRepositorioPagamentos } from './IRepositorioPagamentos';

/** Política de parcelamento no cartão exposta ao checkout (linguagem ubíqua do domínio de pagamentos). */
const POLITICA_PARCELAMENTO_CARTAO_PADRAO = {
  parcelasMaximas: PARCELAS_CARTAO_MAX,
  parcelasSemJuros: 6,
} as const;

/**
 * Controlador para operações de pagamentos.
 */
export class ControladorPagamentos {
  constructor(
    private readonly servicoPagamentos: ServicoPagamentos,
    private readonly servicoFrete: ServicoFrete,
    private readonly repoPagamentos: IRepositorioPagamentos,
    private readonly gestaoCliente?: GestaoIdentidadeCliente,
  ) {}

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

      let cuponsTroca: Array<{
        codigo: string;
        valor: number;
        tipo: 'troca';
        descricao: string;
      }> = [];

      try {
        if (this.gestaoCliente && req.usuario?.uuid) {
          const perfil = await this.gestaoCliente.obterPerfil(req.usuario.uuid);
          
          // Buscar ID interno do usuário para os cupons
          const usuIdRes = await (this.repoPagamentos as any).db.executar('SELECT usu_id FROM usuarios WHERE usu_uuid = $1', [req.usuario.uuid]);
          if (usuIdRes.length > 0) {
            const realCupons = await this.repoPagamentos.listarCuponsTrocaPorUsuario(usuIdRes[0].usu_id);
            cuponsTroca = realCupons
              .filter(c => c.ativo && c.valorAtual > 0)
              .map(c => ({
                codigo: c.codigo,
                valor: c.valorAtual,
                tipo: 'troca' as const,
                descricao: `Saldo de troca: R$ ${c.valorAtual.toFixed(2)}`
              }));
          }

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
      } catch (erro) {
        Logger.error(
          '[pagamentos.obterPagamentoInfo] Falha ao obter perfil do cliente; endereços e cartões ficam vazios.',
          erro instanceof Error ? erro.message : String(erro),
        );
      }

      const resposta = {
        enderecosCliente,
        cartoesCliente,
        politicaParcelamentoCartao: { ...POLITICA_PARCELAMENTO_CARTAO_PADRAO },
        cuponsDisponiveis: [
          { uuid: uuidv4(), codigo: 'DESCONTO10', tipo: 'promocional', valor: 10, descricao: '10% de desconto (simulado)' },
          ...cuponsTroca
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
      const resultado = await this.servicoPagamentos.definirMetodoLiquidacao(dados);
      const { pagamento, pixCobranca } = resultado;

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
        processadoEm: pagamento.processadoEm,
        ...(pixCobranca
          ? {
              pixCobranca: {
                copiaCola: pixCobranca.copiaCola,
                qrCodeBase64: pixCobranca.qrCodeBase64,
                expiraEm: pixCobranca.expiraEm.toISOString(),
                segredoConfirmacao: pixCobranca.segredoConfirmacao
              }
            }
          : {})
      };

      res.status(201).json(resposta);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };

  /**
   * Polling: status da venda e pagamentos (PIX pendente).
   */
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

  /**
   * Webhook simulado do PSP — confirma liquidação PIX (sem JWT; valida segredo).
   */
  public webhookPagamentoPixSimulado = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as { pagamentoUuid?: unknown; segredoConfirmacao?: unknown };
      const pagamentoUuid =
        typeof body.pagamentoUuid === 'string' ? body.pagamentoUuid.trim() : '';
      const segredo =
        typeof body.segredoConfirmacao === 'string' ? body.segredoConfirmacao.trim() : '';
      if (!pagamentoUuid || !segredo) {
        res.status(400).json({ erro: 'pagamentoUuid e segredoConfirmacao são obrigatórios' });
        return;
      }
      await this.servicoPagamentos.confirmarPagamentoPixWebhook(pagamentoUuid, segredo);
      res.status(200).json({ sucesso: true, mensagem: 'PIX confirmado' });
    } catch (erro) {
      const msg = (erro as Error).message;
      if (msg.includes('expirada')) {
        res.status(410).json({ erro: msg });
        return;
      }
      res.status(400).json({ erro: msg });
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
      const vendaUuid =
        typeof corpo.vendaUuid === 'string' && corpo.vendaUuid.trim().length > 0
          ? corpo.vendaUuid.trim()
          : uuidv4();
      res.status(200).json({
        sucesso: resultado.sucesso,
        pedidoUuid: vendaUuid,
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
