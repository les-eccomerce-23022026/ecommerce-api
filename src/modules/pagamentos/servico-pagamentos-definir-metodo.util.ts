import { v4 as uuidv4 } from 'uuid';
import type { IRepositorioPagamentos, IPagamento } from '@/modules/pagamentos/IRepositorioPagamentos';
import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IPagamentoInputDto, IResultadoDefinirMetodoLiquidacao, PARCELAS_CARTAO_MAX } from '@/modules/pagamentos/IPagamento.dto';
import { FormaPagamento, TipoPagamento } from '@/modules/pagamentos/FormaPagamento';
import { CartaoCredito } from '@/modules/pagamentos/CartaoCredito';
import { StatusPagamento } from '@/modules/pagamentos/IPagamento';
import { gerarDadosCobrancaPixSimulada } from '@/modules/pagamentos/pix/gerarCobrancaPixSimulada';
import { sincronizarStatusVendaAposPagamentos } from '@/modules/pagamentos/servico-pagamentos-venda.util';

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
  if (dados.tipoPagamento !== TipoPagamento.CARTAO_CREDITO) throw new Error('Parcelas só para cartão');
  const n = Number(dados.parcelasCartao);
  if (!Number.isInteger(n) || n < 1 || n > PARCELAS_CARTAO_MAX) throw new Error('Parcelas inválidas');
}

export function validarDadosPagamento(dados: IPagamentoInputDto): void {
  if (!dados.vendaUuid) throw new Error('UUID da venda é obrigatório');
  if (dados.valor <= 0) throw new Error('Valor deve ser positivo');
  if (!Object.values(TipoPagamento).includes(dados.tipoPagamento)) throw new Error('Tipo inválido');
  validarParcelasCartaoSeInformado(dados);
}

function validarCupomPromocional(codigo: string, valor: number): boolean {
  return codigo === 'DESCONTO10' && valor > 0;
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
  if (!cupom || !cupom.ativo || cupom.valorAtual < valor) {
    throw new Error('Cupom de troca inválido ou saldo insuficiente');
  }
}

async function validarRegrasNegocio(
  repositorioPagamentos: IRepositorioPagamentos,
  forma: FormaPagamento,
  valor: number,
): Promise<void> {
  if (forma.isCupomPromocional()) {
    const codigo = forma.getDetalhes();
    if (!codigo || !validarCupomPromocional(codigo, valor)) {
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
  const salvo = await repositorioPagamentos.cadastrar(pagamento);
  if (formaPagamento.isPix()) {
    return gerarCobrancaPix(repositorioPagamentos, repositorioVendas, salvo, dados.valor, dados.vendaUuid);
  }
  return { pagamento: salvo };
}
