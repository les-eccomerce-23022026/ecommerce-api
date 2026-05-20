import type { Request, Response } from 'express';
import type { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';

/** Cupons promocionais simulados (checkout BDD — ver EXPORT-BDD-7-ENTREGA-API). */
const CUPONS_PROMOCIONAIS_FIXOS = [
  {
    uuid: 'uuid-descuento10',
    codigo: 'DESCONTO10',
    tipo: 'promocional' as const,
    valorDesconto: 10,
    valorMinimo: 0,
  },
  {
    uuid: 'uuid-descuento20',
    codigo: 'DESCONTO20',
    tipo: 'promocional' as const,
    valorDesconto: 20,
    valorMinimo: 50,
  },
];

export class ControladorCupom {
  constructor(private readonly repositorioPagamentos: IRepositorioPagamentos) {}

  public listarDisponiveis = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioUuid = req.usuario?.uuid;
      if (!usuarioUuid) {
        res.status(401).json({ ok: false, erro: 'Não autenticado' });
        return;
      }

      const usuId = await this.repositorioPagamentos.obterUsuarioIdInternoPorUuid(usuarioUuid);
      const cuponsTroca =
        usuId !== null
          ? (await this.repositorioPagamentos.listarCuponsTrocaPorUsuario(usuId))
              .filter((c) => c.ativo && c.valorAtual > 0)
              .map((c) => ({
                uuid: c.uuid,
                codigo: c.codigo,
                tipo: 'troca' as const,
                valorDesconto: c.valorAtual,
                valorMinimo: 0,
              }))
          : [];

      res.status(200).json({
        ok: true,
        dados: [...CUPONS_PROMOCIONAIS_FIXOS, ...cuponsTroca],
      });
    } catch (erro) {
      res.status(500).json({ ok: false, erro: (erro as Error).message });
    }
  };
}
