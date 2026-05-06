import { v4 as uuidv4 } from 'uuid';
import type { IRepositorioPagamentos, IPagamento } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';
import { FormaPagamento, TipoPagamento } from '@/modules/pagamentos/entities/FormaPagamento';
import { StatusPagamento } from '@/modules/pagamentos/entities/IPagamento';
import type { IntencaoPagamentoPersistida } from '@/modules/pagamentos/intencaoPagamento/IRepositorioIntencaoPagamento';

export type CupomCheckoutLinha = { uuid: string; codigo: string; tipo: string; valor: number };

export type PagamentoCartaoCheckoutLinha = {
  valor: number;
  parcelasCartao?: number;
  magicRecusar?: boolean;
};

export async function processarSaldosCuponsTroca(
  repositorio: IRepositorioPagamentos,
  cupons: CupomCheckoutLinha[],
): Promise<void> {
  const troca = cupons.filter((c) => c.tipo === 'troca');
  await Promise.all(
    troca.map(async (c) => {
      const cupomReal = await repositorio.obterCupomTrocaPorCodigo(c.codigo);
      if (!cupomReal) {
        return;
      }
      const novoSaldo = cupomReal.valorAtual - c.valor;
      await repositorio.atualizarSaldoCupomTroca(cupomReal.id, Math.max(0, novoSaldo));
    }),
  );
}

export async function persistirPagamentosCheckoutAprovados(
  repositorio: IRepositorioPagamentos,
  dados: {
    vendaUuid: string;
    registroIntencao: IntencaoPagamentoPersistida | null;
    pagamentosCartao: PagamentoCartaoCheckoutLinha[];
    cuponsAplicados?: CupomCheckoutLinha[];
  },
): Promise<string[]> {
  const venId = await repositorio.obterVenIdPorVendaUuid(dados.vendaUuid);
  if (venId === null) throw new Error('Venda não encontrada');

  const idsCupons = (dados.cuponsAplicados ?? []).map(async (c) => {
    const tipo = c.tipo === 'troca' ? TipoPagamento.CUPOM_TROCA : TipoPagamento.CUPOM_PROMOCIONAL;
    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: c.valor,
      formaPagamento: new FormaPagamento(tipo, c.codigo),
      status: StatusPagamento.APROVADO,
      criadoEm: new Date(),
      processadoEm: new Date(),
    };
    const salvo = await repositorio.cadastrar(pagamento);
    return salvo.id;
  });

  /** Uma intenção de pagamento vincula-se a um único registro em `pagamento.inp_id` (índice único legado / migração 019). Várias linhas de cartão na mesma intenção só podem repetir `inp_id` se o índice for não-único (migração 020); para compatibilidade total, ancoramos a FK só na primeira linha de cartão. */
  const inpIdPrimeiraLinhaCartao = dados.registroIntencao?.inpId;
  const idsCartoes = dados.pagamentosCartao.map(async (p, indice) => {
    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: p.valor,
      formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, `parcelas:${p.parcelasCartao ?? 1}`),
      status: StatusPagamento.APROVADO,
      criadoEm: new Date(),
      processadoEm: new Date(),
    };
    const inpSomentPrimeira =
      indice === 0 && inpIdPrimeiraLinhaCartao !== undefined ? inpIdPrimeiraLinhaCartao : undefined;
    const salvo = await repositorio.cadastrar(pagamento, { inpIdIntencao: inpSomentPrimeira });
    return salvo.id;
  });

  const uuidsCupons = await Promise.all(idsCupons);
  const uuidsCartoes = await Promise.all(idsCartoes);
  return [...uuidsCupons, ...uuidsCartoes];
}
