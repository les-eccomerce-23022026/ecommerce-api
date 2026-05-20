import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import type { ServicoFrete } from '@/modules/frete/ServicoFrete';
import { cepOrigemPadrao, sanitizarCep8Digitos } from '@/modules/frete/freteCepUtil';
import type { GestaoIdentidadeCliente } from '@/modules/clientes/clientes.service';
import { Logger } from '@/shared/utils/Logger.util';
import { PARCELAS_CARTAO_MAX } from '@/modules/pagamentos/entities/IPagamento.dto';
import type { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';

const POLITICA_PARCELAMENTO_CARTAO_PADRAO = {
  parcelasMaximas: PARCELAS_CARTAO_MAX,
  parcelasSemJuros: 6,
} as const;

type DepsObterInfo = {
  servicoFrete: ServicoFrete;
  repoPagamentos: IRepositorioPagamentos;
  gestaoCliente?: GestaoIdentidadeCliente;
};

function parsePesoEValorItens(req: Request): { pesoNum: number; valorItensNum: number | undefined } {
  const pesoQ = req.query.pesoKg ?? req.query.peso;
  const valorItensQ = req.query.valorTotalItens;
  const pesoNum = pesoQ !== undefined && String(pesoQ).length > 0 ? Number(pesoQ) : 1;
  const valorItensNum =
    valorItensQ !== undefined && String(valorItensQ).length > 0 ? Number(valorItensQ) : undefined;
  return { pesoNum, valorItensNum };
}

async function carregarPerfilCheckout(
  deps: DepsObterInfo,
  usuarioUuid: string,
): Promise<{
  enderecosCliente: Array<{
    uuid: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
    tipo: 'cobranca' | 'entrega' | 'ambos';
  }>;
  cartoesCliente: Array<{
    uuid: string;
    ultimosDigitosCartao: string;
    nomeCliente: string;
    nomeImpresso: string;
    bandeira: string;
    validade: string;
    principal: boolean;
  }>;
  cuponsTroca: Array<{ codigo: string; valor: number; tipo: 'troca'; descricao: string }>;
}> {
  const vazio = { enderecosCliente: [], cartoesCliente: [], cuponsTroca: [] };
  if (!deps.gestaoCliente) {
    return vazio;
  }
  const perfil = await deps.gestaoCliente.obterPerfil(usuarioUuid);
  const usuId = await deps.repoPagamentos.obterUsuarioIdInternoPorUuid(usuarioUuid);
  let cuponsTroca: Array<{ codigo: string; valor: number; tipo: 'troca'; descricao: string }> = [];
  if (usuId !== null) {
    const realCupons = await deps.repoPagamentos.listarCuponsTrocaPorUsuario(usuId);
    cuponsTroca = realCupons
      .filter((c) => c.ativo && c.valorAtual > 0)
      .map((c) => ({
        codigo: c.codigo,
        valor: c.valorAtual,
        tipo: 'troca' as const,
        descricao: `Saldo de troca: R$ ${c.valorAtual.toFixed(2)}`,
      }));
  }
  const enderecosCliente = (perfil.enderecos ?? []).map((e) => ({
    uuid: e.uuid ?? '',
    logradouro: e.logradouro,
    numero: e.numero,
    complemento: e.complemento ?? '',
    bairro: e.bairro,
    cep: e.cep,
    cidade: e.cidade,
    estado: e.estado,
    tipo: 'ambos' as const,
  }));
  const cartoesCliente = (perfil.cartoes ?? []).map((c) => ({
    uuid: c.uuid,
    ultimosDigitosCartao: c.ultimosDigitosCartao,
    nomeCliente: c.nomeImpresso,
    nomeImpresso: c.nomeImpresso,
    bandeira: c.bandeira,
    validade: c.validade,
    principal: c.principal,
  }));
  return { enderecosCliente, cartoesCliente, cuponsTroca };
}

type BlocoPerfilCheckout = Awaited<ReturnType<typeof carregarPerfilCheckout>>;

async function coletarBlocoClienteCheckoutSeguro(
  deps: DepsObterInfo,
  usuarioUuid: string | undefined,
): Promise<BlocoPerfilCheckout> {
  const vazio: BlocoPerfilCheckout = { enderecosCliente: [], cartoesCliente: [], cuponsTroca: [] };
  if (!deps.gestaoCliente || !usuarioUuid) {
    return vazio;
  }
  try {
    return await carregarPerfilCheckout(deps, usuarioUuid);
  } catch (erro) {
    Logger.error(
      '[pagamentos.obterPagamentoInfo] Falha ao obter perfil do cliente; endereços e cartões ficam vazios.',
      erro instanceof Error ? erro.message : String(erro),
    );
    return vazio;
  }
}

function montarFreteOpcoesResposta(
  opcoes: Awaited<ReturnType<ServicoFrete['cotarEPersistir']>>,
): Array<{ uuid: string; tipo: string; valor: number; prazo: string; selecionado: boolean }> {
  return opcoes.map((o) => ({
    uuid: o.cotacaoUuid,
    tipo: o.tipo,
    valor: o.valor,
    prazo: o.prazo,
    selecionado: false,
  }));
}

async function montarRespostaCheckoutJson(
  deps: DepsObterInfo,
  params: {
    cepQ: string;
    pesoNum: number;
    opcoes: Awaited<ReturnType<ServicoFrete['cotarEPersistir']>>;
    blocoCliente: BlocoPerfilCheckout;
  },
) {
  const { cepQ, pesoNum, opcoes, blocoCliente } = params;
  const freteOpcoes = montarFreteOpcoesResposta(opcoes);
  
  // Buscar cupons promocionais do banco
  const cuponsPromocionais = await deps.repoPagamentos.listarCuponsPromocionais();
  const cuponsPromocionaisFormatados = cuponsPromocionais.map((c) => ({
    uuid: c.uuid,
    codigo: c.codigo,
    tipo: 'promocional' as const,
    valor: c.valorDesconto,
    descricao: `${c.valorDesconto}% de desconto`,
  }));

  return {
    enderecosCliente: blocoCliente.enderecosCliente,
    cartoesCliente: blocoCliente.cartoesCliente,
    politicaParcelamentoCartao: { ...POLITICA_PARCELAMENTO_CARTAO_PADRAO },
    cuponsDisponiveis: [
      ...cuponsPromocionaisFormatados,
      ...blocoCliente.cuponsTroca,
    ],
    bandeirasPermitidas: ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'],
    freteOpcoes,
    freteMeta: {
      provedor: deps.servicoFrete.getCodigoProvedorAtivo(),
      cepOrigem: cepOrigemPadrao(),
      cepDestino: cepQ.trim() ? sanitizarCep8Digitos(cepQ) : '01000000',
      pesoKg: pesoNum,
    },
  };
}

/**
 * GET /pagamento/info — monta payload de checkout (frete + dados do cliente quando autenticado).
 */
export async function executarObterPagamentoInfo(req: Request, res: Response, deps: DepsObterInfo): Promise<void> {
  try {
    const cepQ = typeof req.query.cepDestino === 'string' ? req.query.cepDestino : '';
    const { pesoNum, valorItensNum } = parsePesoEValorItens(req);
    const cepDestino = cepQ.trim() || '01000000';
    if (!Number.isFinite(pesoNum) || pesoNum <= 0) {
      res.status(400).json({ erro: 'pesoKg inválido' });
      return;
    }
    const opcoes = await deps.servicoFrete.cotarEPersistir({
      cepDestino,
      pesoKg: pesoNum,
      valorTotalItens: valorItensNum !== undefined && Number.isFinite(valorItensNum) ? valorItensNum : undefined,
    });
    const blocoCliente = await coletarBlocoClienteCheckoutSeguro(deps, req.usuario?.uuid);
    const respostaJson = await montarRespostaCheckoutJson(deps, { cepQ, pesoNum, opcoes, blocoCliente });
    res.status(200).json(respostaJson);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
}
