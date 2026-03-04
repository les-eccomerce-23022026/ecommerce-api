import { IRepositorioUsuarios } from '../usuarios/IRepositorioUsuarios';

export interface IFiltrosConsultaClientes {
  nome?: string;
  cpf?: string;
  email?: string;
  pagina: number;
  limite: number;
}

export interface IResultadoConsultaClientes {
  clientes: Array<{
    uuid: string;
    nome: string;
    email: string;
    cpf: string;
    ativo: boolean;
    dataCriacao: Date;
  }>;
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Serviço responsável pela consulta administrativa de clientes.
 */
export class ServicoConsultaClientes {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  constructor(repositorioUsuarios: IRepositorioUsuarios) {
    this.repositorioUsuarios = repositorioUsuarios;
  }

  /**
   * Consulta clientes com filtros e paginação (RF0024).
   */
  async consultarClientes(filtros: IFiltrosConsultaClientes): Promise<IResultadoConsultaClientes> {
    const offset = (filtros.pagina - 1) * filtros.limite;

    // Buscar clientes com filtros
    const clientes = await this.repositorioUsuarios.buscarClientesComFiltros({
      nome: filtros.nome,
      cpf: filtros.cpf,
      email: filtros.email,
      offset,
      limite: filtros.limite
    });

    // Contar total para paginação
    const total = await this.repositorioUsuarios.contarClientesComFiltros({
      nome: filtros.nome,
      cpf: filtros.cpf,
      email: filtros.email
    });

    const totalPaginas = Math.ceil(total / filtros.limite);

    return {
      clientes: clientes.map(cliente => ({
        uuid: cliente.uuid,
        nome: cliente.nome,
        email: cliente.email,
        cpf: cliente.cpf,
        ativo: cliente.ativo,
        dataCriacao: cliente.dataCriacao || new Date()
      })),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas
    };
  }
}