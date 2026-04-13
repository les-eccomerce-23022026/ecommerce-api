import { Request, Response } from 'express';
import { ServicoFrete } from '@/modules/frete/ServicoFrete';
import { cepOrigemPadrao, sanitizarCep8Digitos } from '@/modules/frete/freteCepUtil';
import { parseCorpoCotacaoFrete } from '@/modules/frete/controlador-frete-parse.util';

/**
 * HTTP: cotação de frete persistida (uso pelo checkout e por integrações).
 */
export class ControladorFrete {
  constructor(private readonly servicoFrete: ServicoFrete) {}

  /**
   * POST /frete/cotar
   * Body: { cepDestino, pesoKg?, valorTotalItens?, cepOrigem? }
   */
  public cotar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cepDestino, pesoKg, valorItens, cepOrigem } = parseCorpoCotacaoFrete(
        req.body as Record<string, unknown>,
      );
      if (!cepDestino.trim()) {
        res.status(400).json({ erro: 'cepDestino é obrigatório' });
        return;
      }
      if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
        res.status(400).json({ erro: 'pesoKg inválido' });
        return;
      }
      const opcoes = await this.servicoFrete.cotarEPersistir({
        cepDestino,
        cepOrigem,
        pesoKg,
        valorTotalItens: valorItens !== undefined && Number.isFinite(valorItens) ? valorItens : undefined,
      });

      res.status(200).json({
        provedor: this.servicoFrete.getCodigoProvedorAtivo(),
        cepOrigem: cepOrigem ? sanitizarCep8Digitos(cepOrigem) : cepOrigemPadrao(),
        cepDestino: sanitizarCep8Digitos(cepDestino),
        pesoTotal: pesoKg,
        opcoes: opcoes.map((o) => ({
          uuid: o.cotacaoUuid,
          cotacaoUuid: o.cotacaoUuid,
          tipo: o.tipo,
          valor: o.valor,
          prazo: o.prazo,
          selecionado: false,
        })),
      });
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  };
}
