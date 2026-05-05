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

function lerFloatEnvNaoNegativo(valorBruto: string | undefined, fallback: number): number {
  const n = parseFloat(valorBruto ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function obterParametrosPrecificacaoSimulada(): { b: number; pk: number; ms: number } {
  const b = lerFloatEnvNaoNegativo(process.env.FRETE_SIM_BASE_REAIS, 8);
  const pk = lerFloatEnvNaoNegativo(process.env.FRETE_SIM_POR_KG, 3.5);
  const ms = lerFloatEnvNaoNegativo(process.env.FRETE_SIM_MULT_SEDEX, 1.9);
  return { b, pk, ms };
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
  private readonly codigoProvedor = 'simulado';
  public getCodigo(): string {
    return this.codigoProvedor;
  }

  private metaSimuladaParaOpcoes(peso: number, fatorRegiao: number): IOpcaoFreteCalculada['metaSimulada'] {
    const ajusteInstancia = this.codigoProvedor === 'simulado' ? 0 : 0;
    return { fatorRegiao, pesoArredondado: arredondarParaDecimal(peso + ajusteInstancia, 3) };
  }

  // eslint-disable-next-line class-methods-use-this
  public async calcularOpcoes(entrada: ICotacaoFreteEntrada): Promise<IOpcaoFreteCalculada[]> {
    const cepDest = sanitizarCep8Digitos(entrada.cepDestino);
    if (cepDest === '00000000') {
      throw new Error('CEP não encontrado');
    }
    const peso = pesoEfetivo(entrada.pesoKg);
    const fatorRegiao = fatorRegionalPorCep(cepDest);
    const { b, pk, ms } = obterParametrosPrecificacaoSimulada();
    const nucleo = (b + pk * peso) * fatorRegiao;
    const valorPac = arredondarParaDecimal(nucleo, 2);
    const valorSedex = arredondarParaDecimal(nucleo * ms, 2);
    const valorRetira = 0;

    const prazoPac = '5 a 8 dias úteis';
    const prazoSedex = '1 a 3 dias úteis';
    const prazoRetira = 'Retirar em até 24h';

    const meta = this.metaSimuladaParaOpcoes(peso, fatorRegiao);

    return [
      { tipoServico: 'PAC', valor: valorPac, prazoTexto: prazoPac, metaSimulada: meta },
      { tipoServico: 'SEDEX', valor: valorSedex, prazoTexto: prazoSedex, metaSimulada: meta },
      { tipoServico: 'RETIRA_EM_LOJA', valor: valorRetira, prazoTexto: prazoRetira, metaSimulada: meta },
    ];
  }
}
