/**
 * Controller de Notificações
 * 
 * Endpoints para gerenciar notificações do usuário.
 */

import { Request, Response } from 'express';
import { RepositorioNotificacoes } from './RepositorioNotificacoes';
import { ConexaoPostgres } from '../../shared/infrastructure/database/ConexaoPostgres';

export class NotificacoesController {
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const usuarioUuid = req.usuario?.uuid;
      
      if (!usuarioUuid) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      const apenasNaoLidas = req.query.apenasNaoLidas === 'true';
      const pool = ConexaoPostgres.obterInstancia();
      const repositorio = new RepositorioNotificacoes(pool);
      
      const notificacoes = await repositorio.buscarPorUsuario(usuarioUuid, apenasNaoLidas);
      
      res.status(200).json(notificacoes);
    } catch (erro) {
      console.error('Erro ao listar notificações:', erro);
      res.status(500).json({ erro: 'Erro interno ao listar notificações' });
    }
  }

  async contarNaoLidas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioUuid = req.usuario?.uuid;
      
      if (!usuarioUuid) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      const pool = ConexaoPostgres.obterInstancia();
      const repositorio = new RepositorioNotificacoes(pool);
      
      const quantidade = await repositorio.contarNaoLidas(usuarioUuid);
      
      res.status(200).json({ quantidade });
    } catch (erro) {
      console.error('Erro ao contar notificações não lidas:', erro);
      res.status(500).json({ erro: 'Erro interno ao contar notificações' });
    }
  }

  async marcarComoLida(req: Request, res: Response): Promise<void> {
    try {
      const usuarioUuid = req.usuario?.uuid;
      const { uuid } = req.params;
      
      if (!usuarioUuid) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      const pool = ConexaoPostgres.obterInstancia();
      const repositorio = new RepositorioNotificacoes(pool);
      
      // Verificar se a notificação pertence ao usuário
      const notificacoes = await repositorio.buscarPorUsuario(usuarioUuid);
      const notificacao = notificacoes.find(n => n.uuid === uuid);
      
      if (!notificacao) {
        res.status(404).json({ erro: 'Notificação não encontrada' });
        return;
      }
      
      await repositorio.marcarComoLida(uuid, usuarioUuid);
      
      res.status(200).json({ sucesso: true });
    } catch (erro) {
      console.error('Erro ao marcar notificação como lida:', erro);
      res.status(500).json({ erro: 'Erro interno ao marcar notificação como lida' });
    }
  }

  async marcarTodasComoLidas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioUuid = req.usuario?.uuid;
      
      if (!usuarioUuid) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      const pool = ConexaoPostgres.obterInstancia();
      const repositorio = new RepositorioNotificacoes(pool);
      
      await repositorio.marcarTodasComoLidas(usuarioUuid);
      
      res.status(200).json({ sucesso: true });
    } catch (erro) {
      console.error('Erro ao marcar todas notificações como lidas:', erro);
      res.status(500).json({ erro: 'Erro interno ao marcar notificações como lidas' });
    }
  }
}
