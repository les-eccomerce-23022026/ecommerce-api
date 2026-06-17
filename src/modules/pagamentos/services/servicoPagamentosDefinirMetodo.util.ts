import { v4 as uuidv4 } from 'uuid';
import type { IRepositorioPagamentos, IPagamento } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';
import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IPagamentoInputDto, IResultadoDefinirMetodoLiquidacao, PARCELAS_CARTAO_MAX } from '@/modules/pagamentos/entities/IPagamento.dto';
import { FormaPagamento, TipoPagamento } from '@/modules/pagamentos/entities/FormaPagamento';
import { CartaoCredito } from '@/modules/pagamentos/entities/CartaoCredito';
import { StatusPagamento } from '@/modules/pagamentos/entities/IPagamento';
import { gerarDadosCobrancaPixSimulada } from '@/modules/pagamentos/pix/gerarCobrancaPixSimulada';
import { sincronizarStatusVendaAposPagamentos } from '@/modules/pagamentos/services/servicoPagamentosVenda.util';

function obterDetalhesPorTipo(dados: IPagamentoInputDto): string | undefined {
  const mapaDetalhes: Partial<Record<TipoPagamento, () => string | undefined>> = {
    [TipoPagamento.PIX]: () => dados.detalhesCupom ?? `PIX-${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    [TipoPagamento.CARTAO_CREDITO]: () => `parcelas:${dados.parcelasCartao ?? 1}`,
  };
  return mapaDetalhes[dados.tipoPagamento]?.() ?? dados.detalhesCupom;
}

function processarDadosCartao(dados: IPagamentoInputDto, forma: FormaPagamento): CartaoCredito | undefined {
  if (forma.isCartao()) {
    if (!dados.cartao) {
      throw new Error('Dados do cartão são obrigatórios para pagamento com cartão');
    }
    return new CartaoCredito(
      dados.cartao.numero,
      dados.cartao.nomeTitular,
      dados.cartao.validade,
      dados.cartao.bandeira,
    );
  }
  if (dados.cartao) {
    throw new Error('Cartão não deve ser enviado para este tipo de pagamento');
  }
  return undefined;
}

function validarParcelasCartaoSeInformado(dados: IPagamentoInputDto): void {
  if (dados.parcelasCartao == null) {
    return;
  }
  if (dados.tipoPagamento !== TipoPagamento.CARTAO_CREDITO) throw new Error('parcelasCartao só permitido para cartão de crédito');
  const n = Number(dados.parcelasCartao);
  if (!Number.isInteger(n) || n < 1 || n > PARCELAS_CARTAO_MAX) throw new Error('parcelasCartao inválido');
}

export function validarDadosPagamento(dados: IPagamentoInputDto): void {
  if (!dados.vendaUuid) throw new Error('UUID da venda é obrigatório');
  if (dados.valor <= 0) throw new Error('Valor deve ser positivo');
  if (!Object.values(TipoPagamento).includes(dados.tipoPagamento)) throw new Error('Tipo inválido');
  validarParcelasCartaoSeInformado(dados);
}

async function validarCupomPromocional(
  repositorioPagamentos: IRepositorioPagamentos,
  codigo: string,
  valor: number
): Promise<boolean> {
  console.log('[DEBUG validarCupomPromocional] codigo:', codigo, 'valor:', valor);
  if (!codigo || valor <= 0) return false;
  const cupons = await repositorioPagamentos.listarCuponsPromocionais();
  console.log('[DEBUG validarCupomPromocional] cupons encontrados:', cupons.length, cupons);
  const cupom = cupons.find((c) => c.codigo === codigo && c.ativo);
  console.log('[DEBUG validarCupomPromocional] cupom encontrado:', cupom);
  if (!cupom) return false;
  // valorMinimo é o valor mínimo do PEDIDO (não do desconto). A validação do
  // mínimo já foi feita no frontend; aqui apenas confirmamos que o cupom existe e está ativo.
  return true;
}

async function validarCupomTrocaSeNecessario(
  repositorioPagamentos: IRepositorioPagamentos,
  forma: FormaPagamento,
  valor: number,
): Promise<void> {
  if (!forma.isCupomTroca()) {
    return;
  }
  const codigo = forma.getDetalhes();
  if (!codigo) throw new Error('Código do cupom de troca é obrigatório');
  const cupom = await repositorioPagamentos.obterCupomTrocaPorCodigo(codigo);
  if (!cupom) {
    throw new Error('Cupom de troca não encontrado');
  }
  if (!cupom.ativo) {
    throw new Error('Cupom de troca está inativo');
  }
  const valorAtualNumero = Number(cupom.valorAtual);
  if (valorAtualNumero < valor) {
    throw new Error(
      `Saldo insuficiente no cupom de troca. Saldo disponível: R$ ${valorAtualNumero.toFixed(2)}, Valor solicitado: R$ ${valor.toFixed(2)}`
    );
  }
}

async function validarRegrasNegocio(
  repositorioPagamentos: IRepositorioPagamentos,
  forma: FormaPagamento,
  valor: number,
): Promise<void> {
  if (forma.isCupomPromocional()) {
    const codigo = forma.getDetalhes();
    if (!codigo || !(await validarCupomPromocional(repositorioPagamentos, codigo, valor))) {
      throw new Error('Cupom promocional inválido');
    }
  }
  await validarCupomTrocaSeNecessario(repositorioPagamentos, forma, valor);
  if (forma.isPix() && valor < 10) throw new Error('Valor mínimo por linha PIX é R$ 10,00');
}

async function gerarCobrancaPix(
  repositorioPagamentos: IRepositorioPagamentos,
  repositorioVendas: IRepositorioVendas,
  pagamento: IPagamento,
  valor: number,
  vendaUuid: string,
): Promise<IResultadoDefinirMetodoLiquidacao> {
  const pix = gerarDadosCobrancaPixSimulada(valor);
  const pagId = await repositorioPagamentos.obterPagIdInternoPorUuid(pagamento.id);
  if (pagId === null) {
    throw new Error('Falha ao obter pagamento para cobrança PIX');
  }
  await repositorioPagamentos.inserirPixSimulado(pagId, {
    copiaCola: pix.copiaCola,
    qrBase64: pix.qrBase64,
    expiraEm: pix.expiraEm,
    segredoConfirmacao: pix.segredoConfirmacao,
  });
  await sincronizarStatusVendaAposPagamentos(repositorioPagamentos, repositorioVendas, vendaUuid);
  return {
    pagamento,
    pixCobranca: {
      copiaCola: pix.copiaCola,
      qrCodeBase64: pix.qrBase64,
      expiraEm: pix.expiraEm,
      segredoConfirmacao: pix.segredoConfirmacao,
    },
  };
}

export async function definirMetodoLiquidacaoServico(
  repositorioPagamentos: IRepositorioPagamentos,
  repositorioVendas: IRepositorioVendas,
  dados: IPagamentoInputDto,
): Promise<IResultadoDefinirMetodoLiquidacao> {
  validarDadosPagamento(dados);
  const detalhesAux = obterDetalhesPorTipo(dados);
  const formaPagamento = new FormaPagamento(dados.tipoPagamento, detalhesAux);
  const cartao = processarDadosCartao(dados, formaPagamento);
  await validarRegrasNegocio(repositorioPagamentos, formaPagamento, dados.valor);
  const pagamento: IPagamento = {
    id: uuidv4(),
    vendaUuid: dados.vendaUuid,
    valor: dados.valor,
    formaPagamento,
    cartao,
    status: StatusPagamento.PENDENTE,
    criadoEm: new Date(),
  };
  const salvo = await repositorioPagamentos.cadastrar(pagamento, {
    idempotencyKey: dados.idempotencyKey
  });
  if (formaPagamento.isPix()) {
    return gerarCobrancaPix(repositorioPagamentos, repositorioVendas, salvo, dados.valor, dados.vendaUuid);
  }
  return { pagamento: salvo };
}
