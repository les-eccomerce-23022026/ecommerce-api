import { Request, Response } from 'express';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { ServicoDashboardAdmin } from '@/modules/admin/servico-dashboard-admin';
import { ServicoPedidosAdmin } from '@/modules/admin/servico-pedidos-admin';

/**
 * Rotas do painel administrativo: dashboard e pedidos (contrato do frontend).
 */
export class ControladorAdminPainel {
  constructor(
    private readonly servicoDashboard: ServicoDashboardAdmin,
    private readonly servicoPedidosAdmin: ServicoPedidosAdmin,
  ) {}

  public obterDashboard = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const dados = await this.servicoDashboard.obterDashboard();
      return RespostaPadrao.enviarSucesso(res, 200, dados);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao montar dashboard administrativo.');
      return RespostaPadrao.enviarErro(res, 500, mensagem);
    }
  };

  public listarPedidosAdmin = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const lista = await this.servicoPedidosAdmin.listarPedidos();
      return res.status(200).json(lista);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao listar pedidos.');
      return RespostaPadrao.enviarErro(res, 400, mensagem);
    }
  };

  public despacharPedido = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { uuid } = req.params;
      const pedido = await this.servicoPedidosAdmin.despachar(uuid);
      return res.status(200).json(pedido);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao despachar pedido.');
      return RespostaPadrao.enviarErro(res, 400, mensagem);
    }
  };

  public confirmarEntregaPedido = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { uuid } = req.params;
      const pedido = await this.servicoPedidosAdmin.confirmarEntrega(uuid);
      return res.status(200).json(pedido);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao confirmar entrega.');
      return RespostaPadrao.enviarErro(res, 400, mensagem);
    }
  };
}
