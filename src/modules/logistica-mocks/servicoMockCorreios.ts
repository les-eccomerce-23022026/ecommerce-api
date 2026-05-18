import {
  CodigoRastreamento,
  RastreamentoCorreiosResponse,
  CalculoFreteRequest,
  CalculoFreteResponse,
  EventoRastreamento,
} from './ILogisticaMocks.dto';
import { IRepositorioRastreamento } from './repositorios/IRepositorioRastreamento';
import { IRepositorioEventoRastreamento } from './repositorios/IRepositorioEventoRastreamento';
import { calcularDistanciaPorCoordenadas } from './faixasCepPorEstado.util';
import { gerarEventosAteEstado } from './estadosRastreamento.util';

/**
 * Mock da API de rastreamento dos Correios
 * Simula comportamento real baseado em documentação oficial
 */
export class ServicoMockCorreios {
  constructor(
    private readonly repositorioRastreamento: IRepositorioRastreamento,
    private readonly repositorioEventoRastreamento: IRepositorioEventoRastreamento,
  ) {}

  /**
   * Consulta rastreamento de objeto (simula GET /v1/sro-rastro/{codigo})
   */
  public async consultarRastreamento(codigo: CodigoRastreamento): Promise<RastreamentoCorreiosResponse> {
    // Validar formato do código (13 caracteres, termina com BR)
    if (!this.validarFormatoCodigo(codigo)) {
      return {
        codigo,
        status: 'invalid_format',
        success: false,
        eventoMaisRecente: {} as EventoRastreamento,
        linkDetalhesCompletos: `https://rastreamento.correios.com.br/app/index.php?objeto=${codigo}`,
        message: 'Formato de código não reconhecido. O código deve ter 13 caracteres e terminar com BR.',
      };
    }

    let rastreamento;
    try {
      rastreamento = await this.repositorioRastreamento.obterPorCodigo(codigo);
    } catch (erro) {
      // Se o banco não estiver disponível, usa modo de simulação
      console.warn('Banco de dados não disponível, usando modo de simulação:', erro);
      rastreamento = null;
    }
    
    if (!rastreamento) {
      // Se não existe no banco, retorna um rastreamento em andamento com eventos realistas
      const eventos = gerarEventosAteEstado(new Date(), '01310-100', 'correios', 'picked_up');
      const eventoMaisRecente = eventos[eventos.length - 1];
      
      return {
        codigo,
        status: 'found',
        success: true,
        eventoMaisRecente,
        historico: eventos,
        previsaoEntrega: this.calcularPrevisaoEntrega(),
        linkDetalhesCompletos: `https://rastreamento.correios.com.br/app/index.php?objeto=${codigo}`,
        message: 'Evento mais recente encontrado.',
      };
    }

    // Buscar eventos de rastreamento no banco
    let eventos;
    let eventoMaisRecente;
    try {
      eventos = await this.repositorioEventoRastreamento.listarPorRastreamento(rastreamento.uuid);
      eventoMaisRecente = await this.repositorioEventoRastreamento.obterMaisRecente(rastreamento.uuid);
    } catch (erro) {
      // Se o banco não estiver disponível, usa modo de simulação
      console.warn('Banco de dados não disponível para eventos, usando modo de simulação:', erro);
      eventos = gerarEventosAteEstado(new Date(), '01310-100', 'correios', 'picked_up');
      eventoMaisRecente = eventos[eventos.length - 1];
    }
    
    // Converter eventos do banco para formato de saída
    const historico: EventoRastreamento[] = eventos.map((e) => ({
      codigo: e.codigo,
      descricao: e.descricao,
      detalhe: e.detalhe,
      data: typeof e.data === 'string' ? e.data : e.data.toISOString(),
      local: e.local,
      destino: e.destino,
    }));
    
    return {
      codigo,
      status: 'found',
      success: true,
      eventoMaisRecente: eventoMaisRecente ? {
        codigo: eventoMaisRecente.codigo,
        descricao: eventoMaisRecente.descricao,
        detalhe: eventoMaisRecente.detalhe,
        data: typeof eventoMaisRecente.data === 'string' ? eventoMaisRecente.data : eventoMaisRecente.data.toISOString(),
        local: eventoMaisRecente.local,
        destino: eventoMaisRecente.destino,
      } : historico[historico.length - 1] || {} as EventoRastreamento,
      historico,
      previsaoEntrega: rastreamento.dataEntregaPrevista?.toISOString(),
      linkDetalhesCompletos: `https://rastreamento.correios.com.br/app/index.php?objeto=${codigo}`,
      message: 'Evento mais recente encontrado.',
    };
  }

  /**
   * Calcula frete e prazo de entrega (simula API de cálculo)
   */
  public calcularFrete(request: CalculoFreteRequest): CalculoFreteResponse {
    const { cepOrigem, cepDestino, peso, tipoFrete = 'SEDEX' } = request;

    // Validar CEP de origem
    if (!cepOrigem || cepOrigem.trim() === '') {
      throw new Error('CEP de origem é obrigatório');
    }

    // Validar CEP de destino
    if (!cepDestino || cepDestino.trim() === '') {
      throw new Error('CEP de destino é obrigatório');
    }

    // Validar peso
    if (peso <= 0) {
      throw new Error('Peso deve ser maior que zero');
    }

    // Calcular distância real usando coordenadas das capitais
    const distanciaKm = calcularDistanciaPorCoordenadas(cepOrigem, cepDestino);

    // Cálculo de prazo baseado em distância real (em dias úteis)
    let prazoBase = 1; // dias
    if (distanciaKm > 300) prazoBase = 2;
    if (distanciaKm > 800) prazoBase = 3;
    if (distanciaKm > 1500) prazoBase = 5;
    if (distanciaKm > 2500) prazoBase = 7;
    if (distanciaKm > 3500) prazoBase = 10;

    // Ajuste por tipo de frete
    if (tipoFrete === 'PAC') prazoBase += 3;

    // Cálculo de valor baseado em distância real e peso
    const valorBase = tipoFrete === 'SEDEX' ? 25.0 : 15.0;
    const valorPorKg = tipoFrete === 'SEDEX' ? 2.5 : 1.5;
    const valorPorKm = tipoFrete === 'SEDEX' ? 0.02 : 0.01;
    const valorFrete = valorBase + (peso * valorPorKg) + (distanciaKm * valorPorKm);

    // Data prevista de entrega (dias úteis)
    const dataPrevista = this.calcularDataPrevista(prazoBase);

    return {
      valorFrete: Math.round(valorFrete * 100) / 100,
      prazoEntrega: prazoBase,
      dataPrevistaEntrega: dataPrevista.toISOString(),
      tipoFrete,
    };
  }

  /**
   * Adiciona evento de rastreamento (para simulação)
   */
  public async adicionarEventoRastreamento(codigo: CodigoRastreamento, evento: EventoRastreamento): Promise<void> {
    let rastreamento;
    try {
      rastreamento = await this.repositorioRastreamento.obterPorCodigo(codigo);
    } catch (erro) {
      // Se o banco não estiver disponível, retorna erro simulado
      console.warn('Banco de dados não disponível para adicionar evento:', erro);
      throw new Error('Banco de dados não disponível');
    }
    
    if (!rastreamento) {
      throw new Error('Rastreamento não encontrado');
    }

    try {
      await this.repositorioEventoRastreamento.cadastrar({
        rasUuid: rastreamento.uuid,
        codigo: evento.codigo,
        descricao: evento.descricao,
        detalhe: evento.detalhe,
        data: new Date(evento.data),
        local: evento.local,
        destino: evento.destino,
      });
    } catch (erro) {
      console.warn('Erro ao cadastrar evento no banco:', erro);
      throw new Error('Erro ao cadastrar evento no banco de dados');
    }
  }

  /**
   * Valida formato de código de rastreamento Correios
   */
  private validarFormatoCodigo(codigo: string): boolean {
    // Formato: 13 caracteres, termina com BR
    const regex = /^[A-Z]{2}\d{9}BR$/;
    return regex.test(codigo);
  }

  /**
   * Calcula previsão de entrega (simulado)
   */
  private calcularPrevisaoEntrega(): string {
    const diasUteis = 5; // prazo padrão
    return this.calcularDataPrevista(diasUteis).toISOString();
  }

  /**
   * Calcula data prevista considerando dias úteis
   */
  private calcularDataPrevista(diasUteis: number): Date {
    const data = new Date();
    let diasAdicionados = 0;

    while (diasAdicionados < diasUteis) {
      data.setDate(data.getDate() + 1);
      const diaSemana = data.getDay();
      // Pular sábados (6) e domingos (0)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAdicionados++;
      }
    }

    return data;
  }
}
