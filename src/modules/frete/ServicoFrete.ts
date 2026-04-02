import type { ICotacaoFreteEntrada, IFreteOpcaoPersistida } from '@/modules/frete/IFrete.dto';
import type { IProvedorFrete } from '@/modules/frete/provedoresFrete/IProvedorFrete';
import type { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { EstadosCotacaoFrete } from '@/modules/frete/cotacaoFrete/EstadosCotacaoFrete';
import { cepOrigemPadrao, sanitizarCep8Digitos } from '@/modules/frete/freteCepUtil';

function obterTtlMinutos(): number {
  const bruto = process.env.FRETE_COTACAO_TTL_MINUTOS?.trim();
  if (!bruto) return 60;
  const n = Number(bruto);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('FRETE_COTACAO_TTL_MINUTOS deve ser um número positivo');
  }
  return n;
}

/**
 * Orquestra cotação, persistência e leitura para checkout e vendas.
 */
export class ServicoFrete {
  constructor(
    private readonly provedor: IProvedorFrete,
    private readonly repo: IRepositorioCotacaoFrete,
  ) {}

  public getCodigoProvedorAtivo(): string {
    return this.provedor.getCodigo();
  }

  /**
   * Calcula via provedor, persiste uma linha por modalidade e devolve opções com UUID.
   */
  public async cotarEPersistir(entrada: ICotacaoFreteEntrada): Promise<IFreteOpcaoPersistida[]> {
    await this.repo.marcarExpiradasCriadasVencidas();

    const opcoesCalc = await this.provedor.calcularOpcoes(entrada);
    const cepOrig = entrada.cepOrigem ? sanitizarCep8Digitos(entrada.cepOrigem) : cepOrigemPadrao();
    const cepDest = sanitizarCep8Digitos(entrada.cepDestino);
    const peso = entrada.pesoKg;
    const expiraEm = new Date(Date.now() + obterTtlMinutos() * 60 * 1000);

    const linhas = opcoesCalc.map((o) => ({
      provedor: this.provedor.getCodigo(),
      estado: EstadosCotacaoFrete.CRIADA,
      cepOrigem: cepOrig.length === 8 ? cepOrig : '01000000',
      cepDestino: cepDest,
      pesoKg: peso,
      valorItens: entrada.valorTotalItens ?? null,
      tipoServico: o.tipoServico,
      valor: o.valor,
      prazoTexto: o.prazoTexto,
      expiraEm,
      metaSimulada: o.metaSimulada,
    }));

    const inseridos = await this.repo.inserirLinhas(linhas);

    return inseridos.map((row, i) => ({
      cotacaoUuid: row.cfrUuid,
      tipo: opcoesCalc[i].tipoServico,
      valor: opcoesCalc[i].valor,
      prazo: opcoesCalc[i].prazoTexto,
      provedor: this.provedor.getCodigo(),
    }));
  }
}
