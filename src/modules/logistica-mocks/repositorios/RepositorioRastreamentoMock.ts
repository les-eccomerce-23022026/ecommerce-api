import { v4 as uuidv4 } from 'uuid';
import {
  IRastreamentoInputDto,
  IRastreamentoOutputDto,
  IRepositorioRastreamento,
} from './IRepositorioRastreamento';

/**
 * Implementação mock do repositório de rastreamentos (in-memory)
 * Usado em testes de integração sem dependência de banco de dados
 */
export class RepositorioRastreamentoMock implements IRepositorioRastreamento {
  private readonly rastreamentos: Map<string, IRastreamentoOutputDto> = new Map();
  private readonly rastreamentosPorCodigo: Map<string, IRastreamentoOutputDto> = new Map();
  private readonly rastreamentosPorEntrega: Map<string, IRastreamentoOutputDto[]> = new Map();

  public async cadastrar(dados: IRastreamentoInputDto): Promise<IRastreamentoOutputDto> {
    const uuid = uuidv4();
    const rastreamento: IRastreamentoOutputDto = {
      uuid,
      entUuid: dados.entUuid,
      codigo: dados.codigo,
      transportadora: dados.transportadora,
      dataCriacao: new Date(),
      dataEntregaPrevista: dados.dataEntregaPrevista,
    };

    this.rastreamentos.set(uuid, rastreamento);
    this.rastreamentosPorCodigo.set(dados.codigo, rastreamento);

    // Adicionar ao índice por entrega
    const porEntrega = this.rastreamentosPorEntrega.get(dados.entUuid) || [];
    porEntrega.push(rastreamento);
    this.rastreamentosPorEntrega.set(dados.entUuid, porEntrega);

    return rastreamento;
  }

  public async obterPorUuid(uuid: string): Promise<IRastreamentoOutputDto | null> {
    return this.rastreamentos.get(uuid) || null;
  }

  public async obterPorCodigo(codigo: string): Promise<IRastreamentoOutputDto | null> {
    return this.rastreamentosPorCodigo.get(codigo) || null;
  }

  public async listarPorEntrega(entUuid: string): Promise<IRastreamentoOutputDto[]> {
    return this.rastreamentosPorEntrega.get(entUuid) || [];
  }

  public async listarEmAndamento(): Promise<IRastreamentoOutputDto[]> {
    // No mock, retorna todos os rastreamentos (simplificação para testes)
    return Array.from(this.rastreamentos.values());
  }

  /**
   * Limpa todos os dados (útil para resetar entre testes)
   */
  public limpar(): void {
    this.rastreamentos.clear();
    this.rastreamentosPorCodigo.clear();
    this.rastreamentosPorEntrega.clear();
  }
}
