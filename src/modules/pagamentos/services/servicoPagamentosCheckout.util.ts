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

  // Preparar todos os pagamentos em lote
  const pagamentosParaCriar: IPagamento[] = [];

  // Adicionar cupons
  (dados.cuponsAplicados ?? []).forEach(c => {
    const tipo = c.tipo === 'troca' ? TipoPagamento.CUPOM_TROCA : TipoPagamento.CUPOM_PROMOCIONAL;
    pagamentosParaCriar.push({
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: c.valor,
      formaPagamento: new FormaPagamento(tipo, c.codigo),
      status: StatusPagamento.APROVADO,
      criadoEm: new Date(),
      processadoEm: new Date(),
    });
  });

  /** Uma intenção de pagamento vincula-se a um único registro em `pagamento.inp_id` (índice único legado / migração 019). Várias linhas de cartão na mesma intenção só podem repetir `inp_id` se o índice for não-único (migração 020); para compatibilidade total, ancoramos a FK só na primeira linha de cartão. */
  const inpIdPrimeiraLinhaCartao = dados.registroIntencao?.inpId;
  dados.pagamentosCartao.forEach((p, indice) => {
    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: p.valor,
      formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, `parcelas:${p.parcelasCartao ?? 1}`),
      status: StatusPagamento.APROVADO,
      criadoEm: new Date(),
      processadoEm: new Date(),
    };
    pagamentosParaCriar.push(pagamento);
  });

  // Criar todos os pagamentos em lote (batch operation)
  const inpIdParaLote = inpIdPrimeiraLinhaCartao;
  const pagamentosSalvos = await repositorio.cadastrarEmLote(pagamentosParaCriar, {
    inpIdIntencao: inpIdParaLote
  });

  return pagamentosSalvos.map(p => p.id);
}
