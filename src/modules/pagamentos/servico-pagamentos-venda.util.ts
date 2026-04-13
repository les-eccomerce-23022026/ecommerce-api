import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import type { IRepositorioPagamentos, IPagamento } from '@/modules/pagamentos/IRepositorioPagamentos';
import { TipoPagamento } from '@/modules/pagamentos/FormaPagamento';
import { StatusPagamento } from '@/modules/pagamentos/IPagamento';
import type { IProvedorPagamento } from '@/modules/pagamentos/provedoresPagamento/IProvedorPagamento';

const MAPA_SATISFACAO_PAGAMENTO: Record<TipoPagamento, (p: IPagamento) => boolean> = {
  [TipoPagamento.CUPOM_PROMOCIONAL]: (p) =>
    p.status === StatusPagamento.PENDENTE || p.status === StatusPagamento.APROVADO,
  [TipoPagamento.CUPOM_TROCA]: (p) =>
    p.status === StatusPagamento.PENDENTE || p.status === StatusPagamento.APROVADO,
  [TipoPagamento.PIX]: (p) => p.status === StatusPagamento.APROVADO,
  [TipoPagamento.CARTAO_CREDITO]: (p) => p.status === StatusPagamento.APROVADO,
};

function pagamentoSatisfeitoParaVenda(p: IPagamento): boolean {
  const satisfacao = MAPA_SATISFACAO_PAGAMENTO[p.formaPagamento.getTipo()];
  return satisfacao ? satisfacao(p) : false;
}

export async function sincronizarStatusVendaAposPagamentos(
  repositorioPagamentos: IRepositorioPagamentos,
  repositorioVendas: IRepositorioVendas,
  vendaUuid: string,
): Promise<void> {
  const pagamentos = await repositorioPagamentos.listarPorVenda(vendaUuid);
  if (pagamentos.length === 0) return;
  if (pagamentos.some((p) => p.status === StatusPagamento.RECUSADO)) {
    await repositorioVendas.atualizarStatus(vendaUuid, 'REPROVADA');
    return;
  }
  if (pagamentos.some((p) => p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE)) {
    await repositorioVendas.atualizarStatus(vendaUuid, 'AGUARDANDO PAGAMENTO');
    return;
  }
  if (pagamentos.every((p) => pagamentoSatisfeitoParaVenda(p))) {
    await repositorioVendas.atualizarStatus(vendaUuid, 'APROVADA');
  }
}

export async function obterResumoPagamentosVenda(
  repositorioPagamentos: IRepositorioPagamentos,
  repositorioVendas: IRepositorioVendas,
  vendaUuid: string,
  usuarioUuidCliente: string,
) {
  const venda = await repositorioVendas.obterPorUuid(vendaUuid);
  if (!venda || venda.usuarioUuid !== usuarioUuidCliente) {
    throw new Error('Venda não encontrada');
  }
  const pagamentos = await repositorioPagamentos.listarPorVenda(vendaUuid);
  const detalhes = await Promise.all(
    pagamentos.map(async (p) => {
      const base = { id: p.id, tipo: p.formaPagamento.getTipo(), status: p.status, valor: p.valor };
      if (p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE) {
        const pix = await repositorioPagamentos.obterPixSimuladoPorPagUuid(p.id);
        return { ...base, ...(pix ? { pixExpiraEm: pix.expiraEm.toISOString() } : {}) };
      }
      return base;
    }),
  );
  return {
    vendaStatus: venda.status,
    aguardandoPix: pagamentos.some(
      (p) => p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE,
    ),
    pagamentos: detalhes,
  };
}

export async function solicitarAutorizacaoFinanceiraServico(
  repositorioPagamentos: IRepositorioPagamentos,
  provedorPagamento: IProvedorPagamento,
  repositorioVendas: IRepositorioVendas,
  pagamentoUuid: string,
): Promise<IPagamento> {
  const pagamento = await repositorioPagamentos.obterPorUuid(pagamentoUuid);
  if (!pagamento) {
    throw new Error('Pagamento não encontrado');
  }
  if (pagamento.status !== StatusPagamento.PENDENTE) {
    throw new Error('Pagamento já processado');
  }
  if (pagamento.formaPagamento.getTipo() === TipoPagamento.PIX) {
    throw new Error('PIX aguarda confirmação assíncrona.');
  }
  const resultado = await provedorPagamento.confirmarPagamento({
    valorTotal: pagamento.valor,
    confirmacaoServicoInterna: true,
  });
  const statusFinal = resultado.sucesso ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO;
  const atualizado = await repositorioPagamentos.atualizar(pagamentoUuid, {
    ...pagamento,
    status: statusFinal,
    processadoEm: new Date(),
  });
  await sincronizarStatusVendaAposPagamentos(repositorioPagamentos, repositorioVendas, pagamento.vendaUuid);
  return atualizado;
}

export async function confirmarPagamentoPixWebhookServico(
  repositorioPagamentos: IRepositorioPagamentos,
  repositorioVendas: IRepositorioVendas,
  pagamentoUuid: string,
  segredoConfirmacao: string,
): Promise<IPagamento> {
  const pagamento = await repositorioPagamentos.obterPorUuid(pagamentoUuid);
  if (!pagamento || pagamento.formaPagamento.getTipo() !== TipoPagamento.PIX) {
    throw new Error('Pagamento não encontrado ou não é PIX');
  }
  if (pagamento.status !== StatusPagamento.PENDENTE) {
    throw new Error('Pagamento PIX já processado');
  }
  const pix = await repositorioPagamentos.obterPixSimuladoPorPagUuid(pagamentoUuid);
  if (!pix || pix.segredoConfirmacao !== segredoConfirmacao) {
    throw new Error('Cobrança PIX não encontrada ou segredo inválido');
  }
  if (Date.now() > pix.expiraEm.getTime()) {
    await repositorioPagamentos.atualizar(pagamentoUuid, {
      ...pagamento,
      status: StatusPagamento.RECUSADO,
      processadoEm: new Date(),
    });
    await sincronizarStatusVendaAposPagamentos(repositorioPagamentos, repositorioVendas, pagamento.vendaUuid);
    throw new Error('Cobrança PIX expirada');
  }
  const salvo = await repositorioPagamentos.atualizar(pagamentoUuid, {
    ...pagamento,
    status: StatusPagamento.APROVADO,
    processadoEm: new Date(),
  });
  await sincronizarStatusVendaAposPagamentos(repositorioPagamentos, repositorioVendas, pagamento.vendaUuid);
  return salvo;
}
