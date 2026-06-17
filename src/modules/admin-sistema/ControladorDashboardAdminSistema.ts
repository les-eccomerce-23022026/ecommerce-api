import { Request, Response } from 'express';
import { ServicoDashboardAdminSistema } from '@/modules/admin-sistema/ServicoDashboardAdminSistema';
import { Logger } from '@/shared/utils/Logger.util';

export class ControladorDashboardAdminSistema {
  constructor(private readonly servico: ServicoDashboardAdminSistema) {}

  obterDashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
      const dados = await this.servico.obterDashboard();
      res.json(dados);
    } catch (erro) {
      Logger.error('[ControladorDashboardAdminSistema] Erro ao obter dashboard', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      res.status(500).json({ mensagem: 'Erro interno ao obter dados do dashboard.' });
    }
  };
}
