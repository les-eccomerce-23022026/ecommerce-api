import { Request, Response } from 'express';
import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { PAPEL_ADMIN } from '@/shared/types/papeis';

/**
 * Controlador para requisições de vendas.
 */
export class ControladorVendas {
  private readonly servicoVendas: ServicoVendas;

  constructor(servicoVendas: ServicoVendas) {
    this.servicoVendas = servicoVendas;
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
      const usuario = req.usuario;
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
}
