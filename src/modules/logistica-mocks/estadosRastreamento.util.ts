/**
 * Utilitário para gerar estados realistas de rastreamento
 * Simula progresso temporal realista de entregas
 */

import { EventoRastreamento } from './ILogisticaMocks.dto';

/**
 * Estados possíveis de rastreamento (padrão Loggi)
 */
export type StatusRastreamentoLoggi = 
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

/**
 * Códigos de evento dos Correios (baseados em documentação real)
 */
export const CODIGOS_EVENTOS_CORREIOS: Record<string, { codigo: string; descricao: string; detalhe: string }> = {
  created: { codigo: 'PO', descricao: 'Objeto postado', detalhe: 'Objeto postado' },
  picked_up: { codigo: 'RO', descricao: 'Objeto recebido', detalhe: 'Objeto recebido na unidade' },
  in_transit: { codigo: 'DO', descricao: 'Objeto em trânsito', detalhe: 'Objeto em trânsito para unidade de distribuição' },
  out_for_delivery: { codigo: 'OEC', descricao: 'Saiu para entrega', detalhe: 'Objeto saiu para entrega ao destinatário' },
  delivered: { codigo: 'BDE', descricao: 'Objeto entregue', detalhe: 'Objeto entregue ao destinatário' },
  failed: { codigo: 'BDI', descricao: 'Entrega não efetuada', detalhe: 'Tentativa de entrega não efetuada' },
};

/**
 * Locais de rastreamento baseados em rota típica São Paulo → Destino
 */
export const LOCAIS_ROTA = [
  'Centro de Distribuição - São Paulo/SP',
  'Unidade de Tratamento - São Paulo/SP',
  'Centro de Distribuição - Campinas/SP',
  'Unidade de Distribuição - Destino',
  'Agência de Entrega - Destino',
];

/**
 * Gera sequência de eventos de rastreamento com timestamps progressivos
 * @param dataCriacao Data de criação do rastreamento
 * @param cepDestino CEP de destino para determinar rota
 * @param transportadora Tipo de transportadora (correios ou loggi)
 * @returns Array de eventos com timestamps progressivos
 */
export function gerarEventosRastreamento(
  dataCriacao: Date,
  cepDestino: string,
  transportadora: 'correios' | 'loggi'
): EventoRastreamento[] {
  const eventos: EventoRastreamento[] = [];
  const agora = new Date(dataCriacao);
  
  // Estado inicial: created
  eventos.push({
    codigo: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.created.codigo : 'created',
    descricao: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.created.descricao : 'Pedido criado',
    detalhe: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.created.detalhe : 'Pedido criado no sistema',
    data: agora.toISOString(),
    local: LOCAIS_ROTA[0],
  });
  
  // Estado: picked_up (após 2-4 horas)
  agora.setHours(agora.getHours() + 3);
  eventos.push({
    codigo: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.picked_up.codigo : 'picked_up',
    descricao: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.picked_up.descricao : 'Coleta realizada',
    detalhe: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.picked_up.detalhe : 'Pacote coletado pelo transportador',
    data: agora.toISOString(),
    local: LOCAIS_ROTA[1],
  });
  
  // Estado: in_transit (após 12-24 horas)
  agora.setHours(agora.getHours() + 18);
  eventos.push({
    codigo: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.in_transit.codigo : 'in_transit',
    descricao: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.in_transit.descricao : 'Em trânsito',
    detalhe: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.in_transit.detalhe : 'Pacote em trânsito para destino',
    data: agora.toISOString(),
    local: LOCAIS_ROTA[2],
    destino: obterNomeCidadePorCep(cepDestino),
  });
  
  // Estado: out_for_delivery (após 1-2 dias)
  agora.setDate(agora.getDate() + 1);
  agora.setHours(agora.getHours() + 8);
  eventos.push({
    codigo: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.out_for_delivery.codigo : 'out_for_delivery',
    descricao: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.out_for_delivery.descricao : 'Saiu para entrega',
    detalhe: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.out_for_delivery.detalhe : 'Pacote saiu para entrega ao destinatário',
    data: agora.toISOString(),
    local: LOCAIS_ROTA[3],
    destino: obterNomeCidadePorCep(cepDestino),
  });
  
  // Estado: delivered (após 4-8 horas)
  agora.setHours(agora.getHours() + 6);
  eventos.push({
    codigo: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.delivered.codigo : 'delivered',
    descricao: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.delivered.descricao : 'Entregue',
    detalhe: transportadora === 'correios' ? CODIGOS_EVENTOS_CORREIOS.delivered.detalhe : 'Pacote entregue ao destinatário',
    data: agora.toISOString(),
    local: obterNomeCidadePorCep(cepDestino),
  });
  
  return eventos;
}

/**
 * Gera eventos de rastreamento até um estado específico
 * Útil para simular rastreamentos em andamento
 */
export function gerarEventosAteEstado(
  dataCriacao: Date,
  cepDestino: string,
  transportadora: 'correios' | 'loggi',
  estadoFinal: StatusRastreamentoLoggi
): EventoRastreamento[] {
  const todosEventos = gerarEventosRastreamento(dataCriacao, cepDestino, transportadora);
  
  const ordemEstados: StatusRastreamentoLoggi[] = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const indiceFinal = ordemEstados.indexOf(estadoFinal);
  
  if (indiceFinal === -1) {
    return todosEventos;
  }
  
  // Mapear código para índice
  const codigoParaIndice: Record<string, number> = {
    [CODIGOS_EVENTOS_CORREIOS.created.codigo]: 0,
    [CODIGOS_EVENTOS_CORREIOS.picked_up.codigo]: 1,
    [CODIGOS_EVENTOS_CORREIOS.in_transit.codigo]: 2,
    [CODIGOS_EVENTOS_CORREIOS.out_for_delivery.codigo]: 3,
    [CODIGOS_EVENTOS_CORREIOS.delivered.codigo]: 4,
    created: 0,
    picked_up: 1,
    in_transit: 2,
    out_for_delivery: 3,
    delivered: 4,
  };
  
  return todosEventos.filter(evento => {
    const indiceEvento = codigoParaIndice[evento.codigo];
    return indiceEvento <= indiceFinal;
  });
}

/**
 * Determina nome da cidade/estado baseado no CEP
 * (simplificado - em produção usaria API de CEP)
 */
function obterNomeCidadePorCep(cep: string): string {
  const estado = obterEstadoPorCepSimplificado(cep);
  return `Cidade Destino/${estado}`;
}

/**
 * Determina UF baseada nos primeiros dígitos do CEP
 * (simplificado - em produção usaria tabela completa)
 */
function obterEstadoPorCepSimplificado(cep: string): string {
  const prefixo = parseInt(cep.substring(0, 2));
  
  const faixasUf: Record<number, string> = {
    0: 'SP', 1: 'SP', 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'SP', 8: 'SP', 9: 'SP',
    10: 'RJ', 11: 'RJ', 12: 'RJ', 13: 'RJ', 14: 'RJ', 15: 'RJ', 16: 'RJ', 17: 'RJ', 18: 'RJ', 19: 'RJ',
    20: 'ES', 21: 'ES', 22: 'ES', 23: 'ES', 24: 'ES', 25: 'ES', 26: 'ES', 27: 'ES', 28: 'ES', 29: 'ES',
    30: 'MG', 31: 'MG', 32: 'MG', 33: 'MG', 34: 'MG', 35: 'MG', 36: 'MG', 37: 'MG', 38: 'MG', 39: 'MG',
    40: 'BA', 41: 'BA', 42: 'BA', 43: 'BA', 44: 'BA', 45: 'BA', 46: 'BA', 47: 'BA', 48: 'BA', 49: 'BA',
    50: 'PE', 51: 'PE', 52: 'PE', 53: 'PE', 54: 'PE', 55: 'PE', 56: 'PE', 57: 'AL', 58: 'PB', 59: 'RN',
    60: 'CE', 61: 'CE', 62: 'CE', 63: 'CE', 64: 'PI', 65: 'MA', 66: 'PA', 67: 'AP', 68: 'PA', 69: 'PA',
    70: 'DF', 71: 'DF', 72: 'DF', 73: 'DF', 74: 'GO', 75: 'GO', 76: 'GO', 77: 'TO', 78: 'TO', 79: 'TO',
    80: 'PR', 81: 'PR', 82: 'PR', 83: 'PR', 84: 'PR', 85: 'PR', 86: 'PR', 87: 'PR', 88: 'SC', 89: 'SC',
    90: 'RS', 91: 'RS', 92: 'RS', 93: 'RS', 94: 'RS', 95: 'RS', 96: 'RS', 97: 'RS', 98: 'RS', 99: 'RS',
  };
  
  return faixasUf[prefixo] || 'SP';
}

/**
 * Calcula coordenadas intermediárias entre origem e destino
 * Simula geolocalização dinâmica baseada em progresso
 */
export function calcularCoordenadasIntermediarias(
  progresso: number, // 0.0 a 1.0
  latOrigem: number,
  lonOrigem: number,
  latDestino: number,
  lonDestino: number
): { latitude: number; longitude: number } {
  const latitude = latOrigem + (latDestino - latOrigem) * progresso;
  const longitude = lonOrigem + (lonDestino - lonOrigem) * progresso;
  
  return { latitude, longitude };
}

/**
 * Gera localização atual baseada no estado do rastreamento
 */
export function gerarLocalizacaoAtual(
  estado: StatusRastreamentoLoggi,
  cepOrigem: string,
  cepDestino: string
): { latitude: number; longitude: number; address: string } {
  const { COORDENADAS_ESTADO } = require('./faixasCepPorEstado.util');
  
  const estadoOrigem = obterEstadoPorCepSimplificado(cepOrigem);
  const estadoDestino = obterEstadoPorCepSimplificado(cepDestino);
  
  const coordsOrigem = COORDENADAS_ESTADO[estadoOrigem] || { latitude: -23.5505, longitude: -46.6333 };
  const coordsDestino = COORDENADAS_ESTADO[estadoDestino] || { latitude: -23.5505, longitude: -46.6333 };
  
  const progressoPorEstado: Record<StatusRastreamentoLoggi, number> = {
    created: 0.0,
    picked_up: 0.1,
    in_transit: 0.5,
    out_for_delivery: 0.9,
    delivered: 1.0,
    failed: 0.8,
  };
  
  const progresso = progressoPorEstado[estado];
  const coords = calcularCoordenadasIntermediarias(
    progresso,
    coordsOrigem.latitude,
    coordsOrigem.longitude,
    coordsDestino.latitude,
    coordsDestino.longitude
  );
  
  const cidade = progresso < 0.5 ? estadoOrigem : estadoDestino;
  
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    address: progresso === 1.0 ? `${obterNomeCidadePorCep(cepDestino)}` : `Em trânsito - ${cidade}`,
  };
}
