import type { ICotacaoFreteEntrada, IOpcaoFreteCalculada } from '@/modules/frete/IFrete.dto';
import { sanitizarCep8Digitos } from '@/modules/frete/freteCepUtil';
import type { IProvedorFrete } from './IProvedorFrete';

export function arredondarParaDecimal(valor: number, casas: number): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

function fatorRegionalPorCep(cep8: string): number {
  const prefixo = parseInt(cep8.slice(0, 2), 10);
  if (Number.isNaN(prefixo)) return 1.2;
  if (prefixo <= 9) return 1.0;
  if (prefixo <= 19) return 1.08;
  if (prefixo <= 28) return 1.12;
  if (prefixo <= 39) return 1.15;
  if (prefixo <= 59) return 1.18;
  return 1.22;
}

function pesoEfetivo(pesoKg: number): number {
  const p = Number(pesoKg);
  if (!Number.isFinite(p) || p <= 0) {
    throw new Error('Peso deve ser um número positivo');
  }
  const padrao = parseFloat(process.env.FRETE_PESO_MINIMO_KG ?? '0.3');
  const min = Number.isFinite(padrao) && padrao > 0 ? padrao : 0.3;
  return Math.max(p, min);
}

/**
 * Transportadora simulada própria: CEP + peso + modalidade, sem API externa.
 */
export class ProvedorFreteSimulado implements IProvedorFrete {
  // eslint-disable-next-line class-methods-use-this
  public getCodigo(): string {
    return 'simulado';
  }

  // eslint-disable-next-line class-methods-use-this
  public async calcularOpcoes(entrada: ICotacaoFreteEntrada): Promise<IOpcaoFreteCalculada[]> {
    const cepDest = sanitizarCep8Digitos(entrada.cepDestino);
    if (cepDest === '00000000') {
      throw new Error('CEP não encontrado');
    }
    const peso = pesoEfetivo(entrada.pesoKg);
    const fatorRegiao = fatorRegionalPorCep(cepDest);

    const base = parseFloat(process.env.FRETE_SIM_BASE_REAIS ?? '8');
    const porKg = parseFloat(process.env.FRETE_SIM_POR_KG ?? '3.5');
    const b = Number.isFinite(base) && base >= 0 ? base : 8;
    const pk = Number.isFinite(porKg) && porKg >= 0 ? porKg : 3.5;

    const nucleo = (b + pk * peso) * fatorRegiao;

    const multPac = 1.0;
    const multSedex = parseFloat(process.env.FRETE_SIM_MULT_SEDEX ?? '1.9');
    const ms = Number.isFinite(multSedex) && multSedex > 0 ? multSedex : 1.9;

    const valorPac = arredondarParaDecimal(nucleo * multPac, 2);
    const valorSedex = arredondarParaDecimal(nucleo * ms, 2);
    const valorRetira = 0;

    const prazoPac = '5 a 8 dias úteis';
    const prazoSedex = '1 a 3 dias úteis';
    const prazoRetira = 'Retirar em até 24h';

    const meta = { fatorRegiao, pesoArredondado: arredondarParaDecimal(peso, 3) };

    return [
      { tipoServico: 'PAC', valor: valorPac, prazoTexto: prazoPac, metaSimulada: meta },
      { tipoServico: 'SEDEX', valor: valorSedex, prazoTexto: prazoSedex, metaSimulada: meta },
      { tipoServico: 'RETIRA_EM_LOJA', valor: valorRetira, prazoTexto: prazoRetira, metaSimulada: meta },
    ];
  }
}
