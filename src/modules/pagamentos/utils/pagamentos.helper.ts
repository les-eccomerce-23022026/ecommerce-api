import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { IPerfilClienteDto } from '@/modules/clientes/Iclientes.dto';
import type { IPagamento } from '../entities/IPagamento';

export class PagamentosHelper {
  public static extrairParametros(req: Request) {
    const cepQ = typeof req.query.cepDestino === 'string' ? req.query.cepDestino : '';
    const pesoQ = req.query.pesoKg ?? req.query.peso;
    const valorItensQ = req.query.valorTotalItens;

    return {
      cepDestino: cepQ.trim() || '01000000',
      pesoKg: (pesoQ !== undefined && String(pesoQ).length > 0) ? Number(pesoQ) : 1,
      valorTotalItens: (valorItensQ !== undefined && String(valorItensQ).length > 0) ? Number(valorItensQ) : undefined,
    };
  }

  public static mapearEnderecos(perfil: IPerfilClienteDto) {
    return (perfil.enderecos ?? []).map((e) => ({
      uuid: e.uuid ?? '',
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento ?? '',
      bairro: e.bairro,
      cep: e.cep,
      cidade: e.cidade,
      estado: e.estado,
      tipo: 'ambos',
    }));
  }

  public static mapearCartoes(perfil: IPerfilClienteDto) {
    return (perfil.cartoes ?? []).map((c) => ({
      uuid: c.uuid,
      ultimosDigitosCartao: c.ultimosDigitosCartao,
      nomeCliente: c.nomeImpresso,
      nomeImpresso: c.nomeImpresso,
      bandeira: c.bandeira,
      validade: c.validade,
      principal: c.principal,
    }));
  }

  public static obterCuponsSimulados() {
    return [
      { uuid: uuidv4(), codigo: 'DESCONTO10', tipo: 'promocional', valor: 10, descricao: '10% de desconto (simulado)' },
      { uuid: uuidv4(), codigo: 'TROCA50', tipo: 'troca', valor: 50, descricao: 'Cupom de troca R$50 (simulado)' },
    ];
  }

  public static mapearFreteOpcoes(opcoes: Array<{ cotacaoUuid: string; tipo: string; valor: number; prazo: string }>) {
    return opcoes.map((o) => ({
      uuid: o.cotacaoUuid,
      tipo: o.tipo,
      valor: o.valor,
      prazo: o.prazo,
      selecionado: false,
    }));
  }

  public static mapearPagamentoParaDto(pagamento: IPagamento) {
    return {
      id: pagamento.id,
      vendaUuid: pagamento.vendaUuid,
      valor: pagamento.valor,
      formaPagamento: {
        tipo: pagamento.formaPagamento.getTipo(),
        detalhes: pagamento.formaPagamento.getDetalhes()
      },
      cartao: pagamento.cartao ? {
        numeroTokenizado: pagamento.cartao.getNumeroTokenizado(),
        nomeTitular: pagamento.cartao.getNomeTitular(),
        validade: pagamento.cartao.getValidade(),
        bandeira: pagamento.cartao.getBandeira()
      } : undefined,
      status: pagamento.status,
      criadoEm: pagamento.criadoEm,
      processadoEm: pagamento.processadoEm
    };
  }
}
