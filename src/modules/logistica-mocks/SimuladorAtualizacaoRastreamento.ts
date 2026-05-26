import { IRepositorioRastreamento } from './repositorios/IRepositorioRastreamento';
import { IRepositorioEventoRastreamento } from './repositorios/IRepositorioEventoRastreamento';

/**
 * Simulador de atualização automática de rastreamento
 * Atualiza status de rastreamento aleatoriamente dentro do prazo de entrega (1-5 dias úteis)
 */
export class SimuladorAtualizacaoRastreamento {
  private intervalo: NodeJS.Timeout | null = null;
  private readonly intervaloMinutos: number;

  constructor(
    private readonly repositorioRastreamento: IRepositorioRastreamento,
    private readonly repositorioEventoRastreamento: IRepositorioEventoRastreamento,
    intervaloMinutos: number = 30, // Executa a cada 30 minutos por padrão
  ) {
    this.intervaloMinutos = intervaloMinutos;
  }

  /**
   * Inicia o simulador de atualização
   */
  public iniciar(): void {
    if (this.intervalo) {
      console.log('[SimuladorRastreamento] Simulador já está em execução');
      return;
    }

    console.log(`[SimuladorRastreamento] Iniciando simulador (intervalo: ${this.intervaloMinutos} minutos)`);
    
    // Aguarda DNS resolver antes da primeira execução (evita EAI_AGAIN)
    setTimeout(() => {
      this.processarAtualizacoes();
    }, 5000); // 5 segundos para DNS resolver

    // Configura intervalo
    this.intervalo = setInterval(() => {
      this.processarAtualizacoes();
    }, this.intervaloMinutos * 60 * 1000);
  }

  /**
   * Para o simulador de atualização
   */
  public parar(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      console.log('[SimuladorRastreamento] Simulador parado');
    }
  }

  /**
   * Processa atualizações de rastreamento para todos os rastreamentos em andamento
   */
  private async processarAtualizacoes(): Promise<void> {
    try {
      console.log('[SimuladorRastreamento] Processando atualizações de rastreamento');

      const rastreamentosEmAndamento = await this.repositorioRastreamento.listarEmAndamento();
      
      for (const rastreamento of rastreamentosEmAndamento) {
        await this.atualizarRastreamento(rastreamento);
      }

      console.log(`[SimuladorRastreamento] Processados ${rastreamentosEmAndamento.length} rastreamentos`);
    } catch (erro) {
      console.error('[SimuladorRastreamento] Erro ao processar atualizações:', erro);
    }
  }

  /**
   * Atualiza um rastreamento específico com base no tempo decorrido
   */
  private async atualizarRastreamento(rastreamento: any): Promise<void> {
    const tempoDecorridoMs = Date.now() - rastreamento.dataCriacao.getTime();
    const tempoDecorridoHoras = tempoDecorridoMs / (1000 * 60 * 60);
    const tempoDecorridoDias = tempoDecorridoHoras / 24;

    // Prazo de entrega em dias (assumindo 1-5 dias úteis)
    const prazoEntrega = this.calcularPrazoEntrega(rastreamento.transportadora);

    // Probabilidade de atualização aumenta com o tempo decorrido
    const probabilidadeAtualizacao = Math.min(tempoDecorridoDias / prazoEntrega, 1.0);
    const deveAtualizar = Math.random() < probabilidadeAtualizacao;

    if (!deveAtualizar) {
      return;
    }

    // Determinar próximo status baseado no tempo decorrido
    const evento = this.gerarProximoEvento(rastreamento.transportadora, tempoDecorridoDias, prazoEntrega);

    // Adicionar evento ao rastreamento
    await this.repositorioEventoRastreamento.cadastrar({
      rasUuid: rastreamento.uuid,
      codigo: evento.codigo,
      descricao: evento.descricao,
      detalhe: evento.detalhe,
      data: new Date(),
      local: evento.local,
      destino: evento.destino,
    });

    console.log(`[SimuladorRastreamento] Atualizado rastreamento ${rastreamento.codigo}: ${evento.codigo}`);

    // Se foi entregue, log para manualmente atualizar status da venda
    if (evento.codigo === 'BDE' || evento.codigo === 'delivered') {
      console.log(`[SimuladorRastreamento] Rastreamento ${rastreamento.codigo} entregue. Atualize manualmente o status da venda associada.`);
    }
  }

  /**
   * Calcula prazo de entrega baseado na transportadora
   */
  private calcularPrazoEntrega(transportadora: string): number {
    if (transportadora === 'Loggi') {
      return 3; // Loggi: 3 dias corridos
    }
    // Correios: 1-5 dias úteis
    return Math.floor(Math.random() * 5) + 1;
  }

  /**
   * Gera próximo evento de rastreamento baseado no tempo decorrido
   */
  private gerarProximoEvento(transportadora: string, tempoDecorridoDias: number, prazoEntrega: number): any {
    const progresso = tempoDecorridoDias / prazoEntrega;

    if (transportadora === 'Loggi') {
      if (progresso < 0.2) {
        return {
          codigo: 'picked_up',
          descricao: 'Coletado pelo entregador',
          detalhe: 'Pacote coletado no centro de distribuição',
          local: 'Centro de Distribuição - São Paulo',
        };
      } else if (progresso < 0.5) {
        return {
          codigo: 'in_transit',
          descricao: 'Em trânsito',
          detalhe: 'Pacote em trânsito para entrega',
          local: 'Centro de Distribuição - Campinas',
          destino: 'Campinas/SP',
        };
      } else if (progresso < 0.8) {
        return {
          codigo: 'out_for_delivery',
          descricao: 'Saiu para entrega',
          detalhe: 'Pacote saiu para entrega ao destinatário',
          local: 'Campinas/SP',
        };
      } else {
        return {
          codigo: 'delivered',
          descricao: 'Entregue ao destinatário',
          detalhe: 'Entrega realizada com sucesso',
          local: 'Campinas/SP',
        };
      }
    } else {
      // Correios
      if (progresso < 0.3) {
        return {
          codigo: 'RO',
          descricao: 'Objeto em trânsito',
          detalhe: 'Objeto em trânsito - por favor aguarde',
          local: 'São Paulo/SP',
          destino: 'Campinas/SP',
        };
      } else if (progresso < 0.6) {
        return {
          codigo: 'OEC',
          descricao: 'Objeto saiu para entrega ao destinatário',
          detalhe: 'Objeto saiu para entrega ao destinatário',
          local: 'Campinas/SP',
          destino: 'Campinas/SP',
        };
      } else {
        return {
          codigo: 'BDE',
          descricao: 'Objeto entregue ao destinatário',
          detalhe: 'Entrega realizada',
          local: 'Campinas/SP',
        };
      }
    }
  }
}
