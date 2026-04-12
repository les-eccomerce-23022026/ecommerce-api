import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { IProvedorPagamento } from './IProvedorPagamento';
import type {
  DadosConfirmacaoProvedor,
  ResultadoConfirmacaoPagamento,
  ResultadoIntencaoPagamento
} from './DadosConfirmacaoProvedor';
import type {
  IRepositorioIntencaoPagamento,
  IntencaoPagamentoPersistida
} from '../intencaoPagamento/IRepositorioIntencaoPagamento';
import { EstadosIntencaoPagamento } from '../intencaoPagamento/EstadosIntencaoPagamento';
import {
  hashSegredoIntencao,
  obterTtlMinutosIntencaoPagamento,
  verificarSegredoIntencao
} from '../intencaoPagamento/segredoIntencaoHmac';

function obterTetoSimulacao(): number {
  const bruto = process.env.SIMULACAO_TETO_PAGAMENTO?.trim();
  if (!bruto) {
    return 1000;
  }
  const n = Number(bruto);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('SIMULACAO_TETO_PAGAMENTO deve ser um número positivo');
  }
  return n;
}

/**
 * Provedor simulado: intenções persistidas no banco (hash segredo, TTL); política de teto na confirmação.
 */
export class ProvedorPagamentoSimulado implements IProvedorPagamento {
  private readonly repositorioIntencao: IRepositorioIntencaoPagamento;

  constructor(repositorioIntencao: IRepositorioIntencaoPagamento) {
    this.repositorioIntencao = repositorioIntencao;
  }

  public async registrarIntencaoPagamento(valor: number): Promise<ResultadoIntencaoPagamento> {
    if (valor <= 0 || !Number.isFinite(valor)) {
      throw new Error('Valor da intenção de pagamento deve ser positivo');
    }
    const idIntencao = uuidv4();
    const segredoConfirmacao = randomBytes(24).toString('hex');
    const hashSegredo = hashSegredoIntencao(segredoConfirmacao);
    const ttlMin = obterTtlMinutosIntencaoPagamento();
    const expiraEm = new Date(Date.now() + ttlMin * 60 * 1000);

    await this.repositorioIntencao.inserirSimulado({
      inpUuid: idIntencao,
      valor,
      hashSegredo,
      expiraEm
    });

    return { idIntencao, segredoConfirmacao };
  }

  public async confirmarPagamento(dados: DadosConfirmacaoProvedor): Promise<ResultadoConfirmacaoPagamento> {
    const teto = obterTetoSimulacao();
    const valorTotal = Number(dados.valorTotal);

    if (dados.confirmacaoServicoInterna) {
      return ProvedorPagamentoSimulado.resultadoPorTeto(valorTotal, teto);
    }

    return this.confirmarComIntencaoPersistida(dados, valorTotal, teto);
  }

  private static resultadoPorTeto(valorTotal: number, teto: number): ResultadoConfirmacaoPagamento {
    const aprovado = valorTotal <= teto;
    return {
      sucesso: aprovado,
      status: aprovado ? 'APROVADO' : 'RECUSADO'
    };
  }

  private async confirmarComIntencaoPersistida(
    dados: DadosConfirmacaoProvedor,
    valorTotal: number,
    teto: number
  ): Promise<ResultadoConfirmacaoPagamento> {
    const faltaIds = ProvedorPagamentoSimulado.faltaIdentificadores(dados);
    if (faltaIds) {
      return faltaIds;
    }

    const { idIntencao, segredoConfirmacao } = dados;
    const registro = await this.repositorioIntencao.obterPorUuid(idIntencao!);
    const preRegistro = ProvedorPagamentoSimulado.registroInvalido(registro);
    if (preRegistro) {
      return preRegistro;
    }

    const expirada = await this.tratarExpiracaoSeNecessario(idIntencao!, registro!);
    if (expirada) {
      return expirada;
    }

    if (!verificarSegredoIntencao(segredoConfirmacao!, registro!.inpHashSegredo)) {
      await this.repositorioIntencao.incrementarTentativas(idIntencao!);
      return { sucesso: false, status: 'RECUSADO' };
    }

    if (Math.abs(registro!.inpValor - valorTotal) > 0.01) {
      await this.repositorioIntencao.atualizarEstado(idIntencao!, EstadosIntencaoPagamento.RECUSADA, {
        recusadoEm: new Date()
      });
      return { sucesso: false, status: 'RECUSADO' };
    }

    const falhaSoma = ProvedorPagamentoSimulado.falhaSeSomaCartoesInconsistente(dados, valorTotal);
    if (falhaSoma) {
      await this.repositorioIntencao.atualizarEstado(idIntencao!, EstadosIntencaoPagamento.RECUSADA, {
        recusadoEm: new Date()
      });
      return falhaSoma;
    }

    return this.finalizarPorTeto(idIntencao!, valorTotal, teto);
  }

  private async tratarExpiracaoSeNecessario(
    idIntencao: string,
    registro: IntencaoPagamentoPersistida
  ): Promise<ResultadoConfirmacaoPagamento | null> {
    if (Date.now() <= registro.inpExpiraEm.getTime()) {
      return null;
    }
    await this.repositorioIntencao.atualizarEstado(idIntencao, EstadosIntencaoPagamento.EXPIRADA, {});
    return { sucesso: false, status: 'RECUSADO' };
  }

  private async finalizarPorTeto(
    idIntencao: string,
    valorTotal: number,
    teto: number
  ): Promise<ResultadoConfirmacaoPagamento> {
    const aprovado = valorTotal <= teto;
    const agoraDate = new Date();

    if (aprovado) {
      await this.repositorioIntencao.atualizarEstado(idIntencao, EstadosIntencaoPagamento.CONFIRMADA, {
        confirmadoEm: agoraDate
      });
      return { sucesso: true, status: 'APROVADO' };
    }

    await this.repositorioIntencao.atualizarEstado(idIntencao, EstadosIntencaoPagamento.RECUSADA, {
      recusadoEm: agoraDate
    });

    return { sucesso: false, status: 'RECUSADO' };
  }

  private static faltaIdentificadores(
    dados: DadosConfirmacaoProvedor
  ): ResultadoConfirmacaoPagamento | null {
    if (!dados.idIntencao || !dados.segredoConfirmacao) {
      return { sucesso: false, status: 'RECUSADO' };
    }
    return null;
  }

  private static registroInvalido(
    registro: IntencaoPagamentoPersistida | null
  ): ResultadoConfirmacaoPagamento | null {
    if (!registro) {
      return { sucesso: false, status: 'RECUSADO' };
    }
    if (registro.inpEstado !== EstadosIntencaoPagamento.CRIADA) {
      return { sucesso: false, status: 'RECUSADO' };
    }
    return null;
  }

  private static falhaSeSomaCartoesInconsistente(
    dados: DadosConfirmacaoProvedor,
    valorTotal: number
  ): ResultadoConfirmacaoPagamento | null {
    if (dados.pagamentosCartao === undefined || dados.pagamentosCartao.length === 0) {
      return null;
    }
    const soma = dados.pagamentosCartao.reduce((acc, p) => acc + p.valor, 0);
    if (Math.abs(soma - valorTotal) > 0.01) {
      return { sucesso: false, status: 'RECUSADO' };
    }
    return null;
  }
}
