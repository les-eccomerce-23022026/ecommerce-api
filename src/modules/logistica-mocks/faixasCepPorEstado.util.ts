/**
 * Utilitário para cálculo de frete baseado em faixas de CEP por estado
 * Simula comportamento real de transportadoras brasileiras
 */

export interface FaixaCepEstado {
  estado: string;
  uf: string;
  cepInicio: string;
  cepFim: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
}

export interface CoordenadasEstado {
  latitude: number;
  longitude: number;
}

/**
 * Tabela de faixas de CEP por estado brasileiro
 * Baseado em faixas reais dos Correios
 */
export const FAIXAS_CEP_POR_ESTADO: FaixaCepEstado[] = [
  { estado: 'Acre', uf: 'AC', cepInicio: '69900-000', cepFim: '69999-999', regiao: 'Norte' },
  { estado: 'Alagoas', uf: 'AL', cepInicio: '57000-000', cepFim: '57999-999', regiao: 'Nordeste' },
  { estado: 'Amapá', uf: 'AP', cepInicio: '68900-000', cepFim: '68999-999', regiao: 'Norte' },
  { estado: 'Amazonas', uf: 'AM', cepInicio: '69000-000', cepFim: '69299-999', regiao: 'Norte' },
  { estado: 'Amazonas (Interior)', uf: 'AM', cepInicio: '69300-000', cepFim: '69999-999', regiao: 'Norte' },
  { estado: 'Bahia', uf: 'BA', cepInicio: '40000-000', cepFim: '48999-999', regiao: 'Nordeste' },
  { estado: 'Ceará', uf: 'CE', cepInicio: '60000-000', cepFim: '63999-999', regiao: 'Nordeste' },
  { estado: 'Distrito Federal', uf: 'DF', cepInicio: '70000-000', cepFim: '73699-999', regiao: 'Centro-Oeste' },
  { estado: 'Espírito Santo', uf: 'ES', cepInicio: '29000-000', cepFim: '29999-999', regiao: 'Sudeste' },
  { estado: 'Goiás', uf: 'GO', cepInicio: '74000-000', cepFim: '76999-999', regiao: 'Centro-Oeste' },
  { estado: 'Maranhão', uf: 'MA', cepInicio: '65000-000', cepFim: '65999-999', regiao: 'Nordeste' },
  { estado: 'Mato Grosso', uf: 'MT', cepInicio: '78000-000', cepFim: '78899-999', regiao: 'Centro-Oeste' },
  { estado: 'Mato Grosso do Sul', uf: 'MS', cepInicio: '79000-000', cepFim: '79999-999', regiao: 'Centro-Oeste' },
  { estado: 'Minas Gerais', uf: 'MG', cepInicio: '30000-000', cepFim: '39999-999', regiao: 'Sudeste' },
  { estado: 'Pará', uf: 'PA', cepInicio: '66000-000', cepFim: '68899-999', regiao: 'Norte' },
  { estado: 'Paraíba', uf: 'PB', cepInicio: '58000-000', cepFim: '58999-999', regiao: 'Nordeste' },
  { estado: 'Paraná', uf: 'PR', cepInicio: '80000-000', cepFim: '87999-999', regiao: 'Sul' },
  { estado: 'Pernambuco', uf: 'PE', cepInicio: '50000-000', cepFim: '56999-999', regiao: 'Nordeste' },
  { estado: 'Piauí', uf: 'PI', cepInicio: '64000-000', cepFim: '64999-999', regiao: 'Nordeste' },
  { estado: 'Rio de Janeiro', uf: 'RJ', cepInicio: '20000-000', cepFim: '28999-999', regiao: 'Sudeste' },
  { estado: 'Rio Grande do Norte', uf: 'RN', cepInicio: '59000-000', cepFim: '59999-999', regiao: 'Nordeste' },
  { estado: 'Rio Grande do Sul', uf: 'RS', cepInicio: '90000-000', cepFim: '99999-999', regiao: 'Sul' },
  { estado: 'Rondônia', uf: 'RO', cepInicio: '78900-000', cepFim: '78999-999', regiao: 'Norte' },
  { estado: 'Roraima', uf: 'RR', cepInicio: '69300-000', cepFim: '69389-999', regiao: 'Norte' },
  { estado: 'Santa Catarina', uf: 'SC', cepInicio: '88000-000', cepFim: '89999-999', regiao: 'Sul' },
  { estado: 'São Paulo', uf: 'SP', cepInicio: '01000-000', cepFim: '19999-999', regiao: 'Sudeste' },
  { estado: 'Sergipe', uf: 'SE', cepInicio: '49000-000', cepFim: '49999-999', regiao: 'Nordeste' },
  { estado: 'Tocantins', uf: 'TO', cepInicio: '77000-000', cepFim: '77999-999', regiao: 'Norte' },
];

/**
 * Coordenadas aproximadas das capitais para cálculo de distância
 */
export const COORDENADAS_ESTADO: Record<string, CoordenadasEstado> = {
  AC: { latitude: -9.9754, longitude: -67.8249 },
  AL: { latitude: -9.6658, longitude: -35.7350 },
  AP: { latitude: 0.0349, longitude: -51.0694 },
  AM: { latitude: -3.1190, longitude: -60.0217 },
  BA: { latitude: -12.9714, longitude: -38.5014 },
  CE: { latitude: -3.7172, longitude: -38.5433 },
  DF: { latitude: -15.7942, longitude: -47.8825 },
  ES: { latitude: -20.3155, longitude: -40.3128 },
  GO: { latitude: -16.6869, longitude: -49.2648 },
  MA: { latitude: -2.5307, longitude: -44.3068 },
  MT: { latitude: -15.6014, longitude: -56.0979 },
  MS: { latitude: -20.4697, longitude: -54.6201 },
  MG: { latitude: -19.9167, longitude: -43.9345 },
  PA: { latitude: -1.4558, longitude: -48.5044 },
  PB: { latitude: -7.1195, longitude: -34.8450 },
  PR: { latitude: -25.4284, longitude: -49.2733 },
  PE: { latitude: -8.0476, longitude: -34.8770 },
  PI: { latitude: -5.0892, longitude: -42.8019 },
  RJ: { latitude: -22.9068, longitude: -43.1729 },
  RN: { latitude: -5.7945, longitude: -35.2110 },
  RS: { latitude: -30.0346, longitude: -51.2177 },
  RO: { latitude: -8.7612, longitude: -63.9004 },
  RR: { latitude: 2.8235, longitude: -60.6758 },
  SC: { latitude: -27.5954, longitude: -48.5480 },
  SP: { latitude: -23.5505, longitude: -46.6333 },
  SE: { latitude: -10.9472, longitude: -37.0731 },
  TO: { latitude: -10.2491, longitude: -48.3243 },
};

/**
 * Matriz de distâncias aproximadas entre regiões (em km)
 * Usada para cálculo de frete quando não há coordenadas precisas
 */
export const DISTANCIA_ENTRE_REGIOES: Record<string, Record<string, number>> = {
  'Norte': { 'Norte': 500, 'Nordeste': 1500, 'Centro-Oeste': 1200, 'Sudeste': 2000, 'Sul': 2500 },
  'Nordeste': { 'Norte': 1500, 'Nordeste': 600, 'Centro-Oeste': 1000, 'Sudeste': 1500, 'Sul': 2000 },
  'Centro-Oeste': { 'Norte': 1200, 'Nordeste': 1000, 'Centro-Oeste': 500, 'Sudeste': 800, 'Sul': 1200 },
  'Sudeste': { 'Norte': 2000, 'Nordeste': 1500, 'Centro-Oeste': 800, 'Sudeste': 400, 'Sul': 600 },
  'Sul': { 'Norte': 2500, 'Nordeste': 2000, 'Centro-Oeste': 1200, 'Sudeste': 600, 'Sul': 400 },
};

/**
 * Determina o estado e região a partir do CEP
 */
export function obterEstadoPorCep(cep: string): FaixaCepEstado | null {
  const cepNumerico = cep.replace(/\D/g, '');
  
  for (const faixa of FAIXAS_CEP_POR_ESTADO) {
    const inicioNumerico = faixa.cepInicio.replace(/\D/g, '');
    const fimNumerico = faixa.cepFim.replace(/\D/g, '');
    
    if (cepNumerico >= inicioNumerico && cepNumerico <= fimNumerico) {
      return faixa;
    }
  }
  
  return null;
}

/**
 * Calcula distância aproximada entre dois CEPs (em km)
 */
export function calcularDistanciaCep(cepOrigem: string, cepDestino: string): number {
  const estadoOrigem = obterEstadoPorCep(cepOrigem);
  const estadoDestino = obterEstadoPorCep(cepDestino);
  
  if (!estadoOrigem || !estadoDestino) {
    // Fallback para cálculo simplificado
    const regiaoOrigem = parseInt(cepOrigem.substring(0, 2));
    const regiaoDestino = parseInt(cepDestino.substring(0, 2));
    return Math.abs(regiaoOrigem - regiaoDestino) * 100;
  }
  
  // Mesmo estado
  if (estadoOrigem.uf === estadoDestino.uf) {
    return 100;
  }
  
  // Mesma região
  if (estadoOrigem.regiao === estadoDestino.regiao) {
    return DISTANCIA_ENTRE_REGIOES[estadoOrigem.regiao][estadoDestino.regiao] * 0.5;
  }
  
  // Regiões diferentes
  return DISTANCIA_ENTRE_REGIOES[estadoOrigem.regiao][estadoDestino.regiao];
}

/**
 * Calcula distância usando fórmula de Haversine (mais precisa)
 */
export function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  
  return distancia;
}

/**
 * Calcula distância entre dois CEPs usando coordenadas das capitais
 */
export function calcularDistanciaPorCoordenadas(cepOrigem: string, cepDestino: string): number {
  const estadoOrigem = obterEstadoPorCep(cepOrigem);
  const estadoDestino = obterEstadoPorCep(cepDestino);
  
  if (!estadoOrigem || !estadoDestino) {
    return calcularDistanciaCep(cepOrigem, cepDestino);
  }
  
  const coordsOrigem = COORDENADAS_ESTADO[estadoOrigem.uf];
  const coordsDestino = COORDENADAS_ESTADO[estadoDestino.uf];
  
  if (!coordsOrigem || !coordsDestino) {
    return calcularDistanciaCep(cepOrigem, cepDestino);
  }
  
  return calcularDistanciaHaversine(
    coordsOrigem.latitude,
    coordsOrigem.longitude,
    coordsDestino.latitude,
    coordsDestino.longitude
  );
}
