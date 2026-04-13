import { v4 as uuidv4 } from 'uuid';
import type { IRepositorioPagamentos, IPagamento } from '@/modules/pagamentos/IRepositorioPagamentos';
import { FormaPagamento, TipoPagamento } from '@/modules/pagamentos/FormaPagamento';
import { StatusPagamento } from '@/modules/pagamentos/IPagamento';
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

  const idsCartoes = dados.pagamentosCartao.map(async (p) => {
    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: p.valor,
      formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, `parcelas:${p.parcelasCartao ?? 1}`),
      status: StatusPagamento.APROVADO,
      criadoEm: new Date(),
      processadoEm: new Date(),
    };
    const salvo = await repositorio.cadastrar(pagamento, { inpIdIntencao: dados.registroIntencao?.inpId });
    return salvo.id;
  });

  const uuidsCupons = await Promise.all(idsCupons);
  const uuidsCartoes = await Promise.all(idsCartoes);
  return [...uuidsCupons, ...uuidsCartoes];
}
