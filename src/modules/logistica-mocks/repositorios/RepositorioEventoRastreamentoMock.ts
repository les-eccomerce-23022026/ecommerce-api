import { v4 as uuidv4 } from 'uuid';
import {
  IEventoRastreamentoInputDto,
  IEventoRastreamentoOutputDto,
  IRepositorioEventoRastreamento,
} from './IRepositorioEventoRastreamento';

/**
 * Implementação mock do repositório de eventos de rastreamento (in-memory)
 * Usado em testes de integração sem dependência de banco de dados
 */
export class RepositorioEventoRastreamentoMock implements IRepositorioEventoRastreamento {
  private readonly eventos: Map<string, IEventoRastreamentoOutputDto> = new Map();
  private readonly eventosPorRastreamento: Map<string, IEventoRastreamentoOutputDto[]> = new Map();

  public async cadastrar(dados: IEventoRastreamentoInputDto): Promise<IEventoRastreamentoOutputDto> {
    const uuid = uuidv4();
    const evento: IEventoRastreamentoOutputDto = {
      uuid,
      rasUuid: dados.rasUuid,
      codigo: dados.codigo,
      descricao: dados.descricao,
      detalhe: dados.detalhe,
      data: dados.data,
      local: dados.local,
      destino: dados.destino,
    };

    this.eventos.set(uuid, evento);

    // Adicionar ao índice por rastreamento
    const porRastreamento = this.eventosPorRastreamento.get(dados.rasUuid) || [];
    porRastreamento.push(evento);
    // Ordenar por data (mais antigo primeiro)
    porRastreamento.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    this.eventosPorRastreamento.set(dados.rasUuid, porRastreamento);

    return evento;
  }

  public async listarPorRastreamento(rasUuid: string): Promise<IEventoRastreamentoOutputDto[]> {
    return this.eventosPorRastreamento.get(rasUuid) || [];
  }

  public async obterMaisRecente(rasUuid: string): Promise<IEventoRastreamentoOutputDto | null> {
    const eventos = this.eventosPorRastreamento.get(rasUuid);
    if (!eventos || eventos.length === 0) {
      return null;
    }
    // Retorna o último (mais recente) já que estão ordenados por data ASC
    return eventos[eventos.length - 1];
  }

  /**
   * Limpa todos os dados (útil para resetar entre testes)
   */
  public limpar(): void {
    this.eventos.clear();
    this.eventosPorRastreamento.clear();
  }
}
