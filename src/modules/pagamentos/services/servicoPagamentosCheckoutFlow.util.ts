import { extrairCheckoutPagamento } from '@/modules/pagamentos/utils/extracaoPagamentoCheckout';
import type { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';
import type { IProvedorPagamento } from '@/modules/pagamentos/provedoresPagamento/IProvedorPagamento';
import type {
  IRepositorioIntencaoPagamento,
  IntencaoPagamentoPersistida,
} from '@/modules/pagamentos/intencaoPagamento/IRepositorioIntencaoPagamento';
import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import {
  persistirPagamentosCheckoutAprovados,
  processarSaldosCuponsTroca,
  type CupomCheckoutLinha,
  type PagamentoCartaoCheckoutLinha,
} from '@/modules/pagamentos/services/servicoPagamentosCheckout.util';
import { sincronizarStatusVendaAposPagamentos } from '@/modules/pagamentos/services/servicoPagamentosVenda.util';

export type DepsCheckoutPagamentos = {
  repositorioPagamentos: IRepositorioPagamentos;
  repositorioIntencao: IRepositorioIntencaoPagamento;
  repositorioVendas: IRepositorioVendas;
  provedorPagamento: IProvedorPagamento;
};

function validarVinculoVendaCheckout(registro: IntencaoPagamentoPersistida, vendaUuid?: string): void {
  if (registro.venId === null) return;
  if (!vendaUuid) throw new Error('vendaUuid é obrigatório para esta intenção');
  if (registro.vendaUuid !== vendaUuid) throw new Error('vendaUuid não confere');
}

async function resolverIntencaoCheckout(
  repositorioIntencao: IRepositorioIntencaoPagamento,
  idIntencao: string,
  vendaUuid?: string,
): Promise<IntencaoPagamentoPersistida | null> {
  if (idIntencao === 'CUPOM-ONLY') {
    return null;
  }
  const registroIntencao = await repositorioIntencao.obterPorUuid(idIntencao);
  if (registroIntencao === null) throw new Error('Intenção de pagamento não encontrada');
  validarVinculoVendaCheckout(registroIntencao, vendaUuid);
  return registroIntencao;
}

async function persistirSeCheckoutAprovado(
  deps: DepsCheckoutPagamentos,
  sucesso: boolean,
  vendaUuid: string | undefined,
  registroIntencao: IntencaoPagamentoPersistida | null,
  pagamentosCartao: PagamentoCartaoCheckoutLinha[],
  cuponsAplicados?: CupomCheckoutLinha[],
): Promise<string[]> {
  if (!sucesso || !vendaUuid?.trim()) {
    return [];
  }
  const v = vendaUuid.trim();
  const pagamentosUuids = await persistirPagamentosCheckoutAprovados(deps.repositorioPagamentos, {
    vendaUuid: v,
    registroIntencao,
    pagamentosCartao,
    cuponsAplicados,
  });
  if (cuponsAplicados && cuponsAplicados.length > 0) {
    await processarSaldosCuponsTroca(deps.repositorioPagamentos, cuponsAplicados);
  }
  await sincronizarStatusVendaAposPagamentos(deps.repositorioPagamentos, deps.repositorioVendas, v);
  return pagamentosUuids;
}

export async function confirmarAutorizacaoFinanceiraCheckoutServico(
  deps: DepsCheckoutPagamentos,
  corpo: Record<string, unknown>,
) {
  const { idIntencao, segredoConfirmacao, valorTotal, pagamentosCartao, cuponsAplicados, vendaUuid } =
    extrairCheckoutPagamento(corpo);
  const registroIntencao = await resolverIntencaoCheckout(deps.repositorioIntencao, idIntencao, vendaUuid);
  const resultado =
    valorTotal > 0
      ? await deps.provedorPagamento.confirmarPagamento({
          valorTotal,
          pagamentosCartao,
          idIntencao,
          segredoConfirmacao,
        })
      : { sucesso: true, status: 'APROVADO' };
  const pagamentosUuids = await persistirSeCheckoutAprovado(
    deps,
    resultado.sucesso,
    vendaUuid,
    registroIntencao,
    pagamentosCartao,
    cuponsAplicados,
  );
  return {
    sucesso: resultado.sucesso,
    statusTexto: resultado.sucesso ? 'APROVADA' : ('REPROVADA' as const),
    pagamentoUuid: pagamentosUuids[0],
    pagamentosUuids,
  };
}
