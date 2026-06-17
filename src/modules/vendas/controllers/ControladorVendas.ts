import { Request, Response } from 'express';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { PAPEL_ADMIN } from '@/shared/types/papeis';
import type { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';
import type { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';

/**
 * Controlador para requisições de vendas.
 */
export class ControladorVendas {
  private readonly servicoVendas: ServicoVendas;

  private readonly repoPagamentos: IRepositorioPagamentos;

  private readonly repoEntrega: IRepositorioEntrega | null;

  constructor(servicoVendas: ServicoVendas, repoPagamentos: IRepositorioPagamentos, repoEntrega?: IRepositorioEntrega, repoLivros?: RepositorioLivrosPostgres) {
    this.servicoVendas = servicoVendas;
    this.repoPagamentos = repoPagamentos;
    this.repoEntrega = repoEntrega ?? null;
  }

  /**
   * Endpoint para criar uma venda: POST /vendas
   * Validações de negócio:
   * - RN0037: Valor total deve ser > 0
   * - RN0069: Parcelamento só permitido para compras >= R$ 80
   * - RN0034: Em split de pagamento, cada cartão deve ser >= R$ 10
   */
  public registrarPedidoVenda = async (req: Request, res: Response) => {
    try {
      // Extrai o UUID do usuário do token JWT (anexado pelo middleware de autenticação)
      const { usuarioUuid, enderecoEntregaUuid, itens, valorFrete, cotacaoUuid, parcelas, pagamentos } = req.body;
      
      // Se não vier no body, obtém do req.usuario (extraído do JWT pelo middleware)
      const usuarioUuidFinal = usuarioUuid || req.usuario?.uuid;
      
      if (!usuarioUuidFinal) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        res.status(400).json({ erro: 'Itens do pedido são obrigatórios' });
        return;
      }

      // Validar que cada item tem livroUuid e quantidade (preço será buscado do catálogo)
      itens.forEach((item: any) => {
        if (!item.livroUuid || !item.quantidade) {
          throw new Error('Cada item deve conter livroUuid e quantidade');
        }
      });
      
      // valorTotalItens e valorTotal serão calculados pelo serviço a partir do catálogo
      const valorTotalItens = 0;
      const valorTotal = req.body.valorTotal || 0;
      const valorFreteFinal = valorFrete || 0;

      const vInput = {
        usuarioUuid: usuarioUuidFinal,
        itens,
        valorTotalItens,
        valorFrete: valorFreteFinal,
        valorTotal,
        cotacaoUuid,
        enderecoEntregaUuid, // Será usado pelo serviço de entrega se necessário
        parcelas, // Passado para validação RN0069
        pagamentos, // Passado para validação RN0034
      };

      const venda = await this.servicoVendas.registrarPedidoVenda(vInput);
      res.status(201).json(venda);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[ControladorVendas.registrarPedidoVenda] Erro:', mensagem, err);
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
      
      const vendasMapeadas = vendas.map((venda) => ({
        ...venda,
        dataEntrega: venda.dataHoraEntrega ? venda.dataHoraEntrega.toISOString() : undefined,
        dataPrevistaEntrega: venda.dataPrevistaEntrega ? venda.dataPrevistaEntrega.toISOString() : undefined,
      }));
      
      res.json(vendasMapeadas);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[ControladorVendas.listarVendasCliente] Erro:', mensagem, err);
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
   * Listar devoluções pendentes: GET /admin/pedidos/devolucoes
   */
  public listarDevolucoesPendentes = async (_req: Request, res: Response) => {
    try {
      const devolucoes = await this.servicoVendas.listarDevolucoesPendentes();
      res.json(devolucoes);
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
   * Solicitar devolução: POST /vendas/:uuid/devolucao
   */
  public solicitarDevolucao = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { motivo, itensUuids } = req.body;
      const usuarioUuid = req.usuario?.uuid;
      if (!usuarioUuid) throw new Error('Não autenticado');

      const venda = await this.servicoVendas.solicitarDevolucao(uuid, usuarioUuid, motivo, itensUuids);
      res.json(venda);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Autorizar devolução: PUT /admin/pedidos/:uuid/autorizar-devolucao
   */
  public autorizarDevolucao = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const venda = await this.servicoVendas.autorizarDevolucao(uuid);
      res.json(venda);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Rejeitar devolução: PUT /admin/pedidos/:uuid/rejeitar-devolucao
   */
  public rejeitarDevolucao = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { motivo } = req.body;
      const venda = await this.servicoVendas.rejeitarDevolucao(uuid, motivo);
      res.json(venda);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Confirmar recebimento de devolução: PUT /admin/pedidos/:uuid/confirmar-recebimento-devolucao
   */
  public confirmarRecebimentoDevolucao = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { retornarEstoque } = req.body;

      const { venda, reembolsoProcessado } = await this.servicoVendas.confirmarRecebimentoDevolucao(
        uuid,
        Boolean(retornarEstoque),
      );

      res.json({ pedido: venda, reembolsoProcessado });
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

  /**
   * Listar pedidos admin: GET /admin/pedidos
   */
  public listarPedidosAdmin = async (_req: Request, res: Response) => {
    try {
      const pedidos = await this.servicoVendas.listarTodas();
      res.json(pedidos);
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Despachar pedido: PATCH /admin/pedidos/:uuid/despachar
   */
  public despacharPedido = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      await this.servicoVendas.atualizarStatus(uuid, 'EM_TRANSITO');
      res.json({ status: 'EM_TRANSITO' });
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Confirmar entrega: PATCH /admin/pedidos/:uuid/entrega
   */
  public confirmarEntrega = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      await this.servicoVendas.confirmarEntregaAdmin(uuid);
      res.json({ status: 'Entregue' });
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Confirmação de recebimento pelo cliente: PATCH /vendas/:uuid/confirmar-entrega
   * Busca a entrega mais recente da venda e confirma o recebimento.
   */
  public confirmarRecebimentoCliente = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;

      if (!this.repoEntrega) {
        res.status(501).json({ erro: 'Módulo de entrega não configurado.' });
        return;
      }

      const entregas = await this.repoEntrega.listarPorVendaUuid(uuid);
      if (entregas.length === 0) {
        res.status(404).json({ erro: 'Nenhuma entrega encontrada para este pedido.' });
        return;
      }

      await this.servicoVendas.atualizarStatus(uuid, 'ENTREGUE');
      res.status(204).send();
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };

  /**
   * Atualizar endereço de entrega: PUT /vendas/:uuid/endereco-entrega
   */
  public atualizarEnderecoEntrega = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const { enderecoUuid } = req.body;
      await this.servicoVendas.atualizarEnderecoEntrega(uuid, enderecoUuid);
      res.json({ mensagem: 'Endereço de entrega atualizado com sucesso.' });
    } catch (err: unknown) {
      res.status(400).json({ erro: (err as Error).message });
    }
  };
}
