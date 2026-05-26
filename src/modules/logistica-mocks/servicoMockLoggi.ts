import {
  CodigoRastreamento,
  RastreamentoLoggiResponse,
  CalculoFreteRequest,
  CalculoFreteResponse,
} from './ILogisticaMocks.dto';
import { IRepositorioRastreamento } from './repositorios/IRepositorioRastreamento';
import { IRepositorioEventoRastreamento } from './repositorios/IRepositorioEventoRastreamento';
import { calcularDistanciaPorCoordenadas } from './faixasCepPorEstado.util';
import { gerarEventosAteEstado, gerarLocalizacaoAtual } from './estadosRastreamento.util';

/**
 * Mock da API de rastreamento da Loggi
 * Simula comportamento real baseado em documentação oficial
 */
export class ServicoMockLoggi {
  private readonly companyID = 'mock_company_les_livraria';

  constructor(
    private readonly repositorioRastreamento: IRepositorioRastreamento,
    private readonly repositorioEventoRastreamento: IRepositorioEventoRastreamento,
  ) {}

  /**
   * Consulta rastreamento de pacote (simula GET /tracking/{trackingCode})
   */
  public async consultarRastreamento(trackingCode: string): Promise<RastreamentoLoggiResponse> {
    // Validar formato do código (alfanumérico, 9+ caracteres)
    if (!this.validarFormatoCodigo(trackingCode)) {
      return {
        trackingCode,
        companyID: this.companyID,
        status: 'invalid_format',
        events: [],
        error: 'Formato de código inválido. O código deve ter pelo menos 9 caracteres alfanuméricos.',
      };
    }

    let rastreamento;
    try {
      rastreamento = await this.repositorioRastreamento.obterPorCodigo(trackingCode);
    } catch (erro) {
      // Se o banco não estiver disponível, usa modo de simulação
      console.warn('Banco de dados não disponível, usando modo de simulação:', erro);
      rastreamento = null;
    }
    
    if (!rastreamento) {
      // Se não existe no banco, retorna um rastreamento em andamento com eventos realistas
      const eventos = gerarEventosAteEstado(new Date(), '01310-100', 'loggi', 'picked_up');
      const currentLocation = gerarLocalizacaoAtual('picked_up', '01310-100', '01310-100');
      
      return {
        trackingCode,
        companyID: this.companyID,
        status: 'picked_up',
        events: eventos.map(e => ({
          status: e.codigo,
          description: e.descricao,
          createdAt: e.data,
          location: e.local,
        })),
        promisedDate: this.calcularPrevisaoEntrega().toISOString(),
        currentLocation,
      };
    }

    // Buscar eventos de rastreamento no banco
    let eventos;
    try {
      eventos = await this.repositorioEventoRastreamento.listarPorRastreamento(rastreamento.uuid);
    } catch (erro) {
      // Se o banco não estiver disponível, usa modo de simulação
      console.warn('Banco de dados não disponível para eventos, usando modo de simulação:', erro);
      eventos = gerarEventosAteEstado(new Date(), '01310-100', 'loggi', 'picked_up');
    }
    
    // Converter eventos do banco para formato de saída
    const events = eventos.map((e) => ({
      status: e.codigo,
      description: e.descricao,
      createdAt: typeof e.data === 'string' ? e.data : e.data.toISOString(),
      location: e.local,
    }));

    // Determinar status atual
    const eventoMaisRecente = eventos[0];
    const status = eventoMaisRecente ? eventoMaisRecente.codigo : 'created';

    // Verificar se foi entregue
    const entregue = eventos.some((e) => e.codigo === 'delivered');
    const eventoEntregue = eventos.find((e) => e.codigo === 'delivered');
    const deliveredAt = entregue && eventoEntregue 
      ? (typeof eventoEntregue.data === 'string' ? eventoEntregue.data : eventoEntregue.data.toISOString()) 
      : undefined;

    return {
      trackingCode,
      companyID: this.companyID,
      status,
      events,
      promisedDate: rastreamento.dataEntregaPrevista?.toISOString(),
      deliveredAt,
      currentLocation: {
        latitude: -23.5505,
        longitude: -46.6333,
        address: eventoMaisRecente?.local || 'São Paulo/SP',
      },
    };
  }

  /**
   * Calcula frete e prazo de entrega (simula API de cálculo)
   */
  public calcularFrete(request: CalculoFreteRequest): CalculoFreteResponse {
    const { cepOrigem, cepDestino, peso, tipoFrete = 'LOGGI_STANDARD' } = request;

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

    // Cálculo de prazo baseado em distância real (em dias corridos)
    let prazoBase = 1; // dias
    if (distanciaKm > 300) prazoBase = 2;
    if (distanciaKm > 800) prazoBase = 3;
    if (distanciaKm > 1500) prazoBase = 4;
    if (distanciaKm > 2500) prazoBase = 5;
    if (distanciaKm > 3500) prazoBase = 7;

    // Ajuste por tipo de frete
    if (tipoFrete === 'LOGGI_EXPRESS') prazoBase -= 1;
    if (prazoBase < 1) prazoBase = 1;

    // Cálculo de valor baseado em distância real e peso
    const valorBase = tipoFrete === 'LOGGI_EXPRESS' ? 30.0 : 20.0;
    const valorPorKg = tipoFrete === 'LOGGI_EXPRESS' ? 3.0 : 2.0;
    const valorPorKm = tipoFrete === 'LOGGI_EXPRESS' ? 0.03 : 0.02;
    const valorFrete = valorBase + (peso * valorPorKg) + (distanciaKm * valorPorKm);

    // Data prevista de entrega (dias corridos)
    const dataPrevista = new Date();
    dataPrevista.setDate(dataPrevista.getDate() + prazoBase);

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
  public async adicionarEventoRastreamento(trackingCode: string, status: string, description: string, location?: string): Promise<void> {
    let rastreamento;
    try {
      rastreamento = await this.repositorioRastreamento.obterPorCodigo(trackingCode);
    } catch (erro) {
      // Se o banco não estiver disponível, retorna erro simulado
      console.warn('Banco de dados não disponível para adicionar evento:', erro);
      throw new Error('Banco de dados não disponível');
    }
    
    if (!rastreamento) {
      // Cria novo rastreamento se não existe
      try {
        await this.repositorioRastreamento.cadastrar({
          entUuid: '', // Será preenchido quando vinculado à entrega
          codigo: trackingCode,
          transportadora: 'Loggi',
        });
      } catch (erro) {
        console.warn('Erro ao criar rastreamento no banco:', erro);
        throw new Error('Erro ao criar rastreamento no banco de dados');
      }
    }

    let rastreamentoAtualizado;
    try {
      rastreamentoAtualizado = await this.repositorioRastreamento.obterPorCodigo(trackingCode);
    } catch (erro) {
      console.warn('Erro ao buscar rastreamento atualizado:', erro);
      throw new Error('Erro ao buscar rastreamento no banco de dados');
    }
    
    if (!rastreamentoAtualizado) throw new Error('Erro ao criar rastreamento');

    try {
      await this.repositorioEventoRastreamento.cadastrar({
        rasUuid: rastreamentoAtualizado.uuid,
        codigo: status,
        descricao: description,
        data: new Date(),
        local: location,
      });
    } catch (erro) {
      console.warn('Erro ao cadastrar evento no banco:', erro);
      throw new Error('Erro ao cadastrar evento no banco de dados');
    }
  }

  /**
   * Valida formato de código de rastreamento Loggi
   */
  private validarFormatoCodigo(codigo: string): boolean {
    // Formato: alfanumérico, 9+ caracteres
    const regex = /^[A-Z0-9]{9,}$/;
    return regex.test(codigo);
  }

  /**
   * Calcula previsão de entrega (simulado)
   */
  private calcularPrevisaoEntrega(): Date {
    const dias = 3; // prazo padrão Loggi
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data;
  }
}
