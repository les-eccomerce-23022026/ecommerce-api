import { Request, Response } from 'express';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { PAPEL_ADMIN } from '@/shared/types/papeis';
import type { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';

/**
 * Controlador para requisições de vendas.
 */
export class ControladorVendas {
  private readonly servicoVendas: ServicoVendas;

  private readonly repoPagamentos: IRepositorioPagamentos;

  constructor(servicoVendas: ServicoVendas, repoPagamentos: IRepositorioPagamentos) {
    this.servicoVendas = servicoVendas;
    this.repoPagamentos = repoPagamentos;
  }

  /**
   * Endpoint para criar uma venda: POST /vendas
   */
  public registrarPedidoVenda = async (req: Request, res: Response) => {
    try {
      // Extrai o UUID do usuário do token JWT (anexado pelo middleware de autenticação)
      const { usuarioUuid } = req.body;
      // Se não vier no body, obtém do req.usuario (extraído do JWT pelo middleware)
      const vInput = {
        ...req.body,
        usuarioUuid: usuarioUuid || req.usuario?.uuid,
      };

      const venda = await this.servicoVendas.registrarPedidoVenda(vInput);
      res.status(201).json(venda);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Endpoint para consultar venda: GET /vendas/:uuid
   */
  public visualizarDetalhesVenda = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { usuario } = req;
      if (!usuario?.uuid) {
        res.status(401).json({ erro: 'Usuário não identificado.' });
        return;
      }

      const ehAdmin = usuario.role === PAPEL_ADMIN.descricao;
      const venda = await this.servicoVendas.visualizarDetalhesVenda(uuid, {
        uuid: usuario.uuid,
        ehAdmin,
      });
      res.json(venda);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      res.status(404).json({ erro: mensagem });
    }
  };

  /**
   * Histórico de vendas do cliente logado: GET /minhas-vendas
   */
  public listarVendasCliente = async (req: Request, res: Response) => {
    try {
      const usuarioUuid = req.usuario?.uuid;
      if (!usuarioUuid) throw new Error('Usuário não identificado.');

      const vendas = await this.servicoVendas.listarVendasCliente(usuarioUuid);
      res.json(vendas);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      res.status(401).json({ erro: mensagem });
    }
  };

  /**
   * Solicitar troca: POST /vendas/:uuid/troca
   */
  public solicitarTroca = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { motivo, itensUuids } = req.body;
      const usuarioUuid = req.usuario?.uuid;
      if (!usuarioUuid) throw new Error('Não autenticado');

      const venda = await this.servicoVendas.solicitarTroca(uuid, usuarioUuid, motivo, itensUuids);
      res.json(venda);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Listar trocas pendentes: GET /admin/pedidos/trocas
   */
  public listarTrocasPendentes = async (_req: Request, res: Response) => {
    try {
      const trocas = await this.servicoVendas.listarTrocasPendentes();
      res.json(trocas);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Autorizar troca: PUT /admin/pedidos/:uuid/autorizar-troca
   */
  public autorizarTroca = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const venda = await this.servicoVendas.autorizarTroca(uuid);
      res.json(venda);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Rejeitar troca: PUT /admin/pedidos/:uuid/rejeitar-troca
   */
  public rejeitarTroca = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { motivo } = req.body;
      const venda = await this.servicoVendas.rejeitarTroca(uuid, motivo);
      res.json(venda);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Confirmar recebimento: PUT /admin/pedidos/:uuid/confirmar-recebimento
   */
  public confirmarRecebimentoTroca = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { retornarEstoque } = req.body;

      const { venda, cupom: codigoCupom } = await this.servicoVendas.confirmarRecebimentoTroca(
        uuid,
        Boolean(retornarEstoque),
      );

      const valorCupom = venda.itens
        .filter((i) => i.emTroca)
        .reduce((acc, cur) => acc + cur.precoUnitario * cur.quantidade, 0);
      const valorFinal = valorCupom > 0 ? valorCupom : venda.totalVenda;

      const usuId = await this.repoPagamentos.obterUsuarioIdInternoPorUuid(venda.usuarioUuid);
      if (!usuId) throw new Error('Usuário não encontrado ao criar cupom de troca');

      await this.repoPagamentos.criarCupomTroca({ usuarioId: usuId, codigo: codigoCupom, valor: valorFinal });

      res.json({ pedido: venda, cupomGerado: { codigo: codigoCupom, valor: valorFinal } });
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };
}
