import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';

import { mascararCpf, mascararEmail } from '@/modules/clientes/gestaoIdentidadeClienteTexto.util';
import { IRepositorioUsuarios } from '../usuarios/IRepositorioUsuarios';

export interface IFiltrosConsultaClientes {
  nome?: string;
  cpf?: string;
  email?: string;
  ativo?: boolean;
  pagina: number;
  limite: number;
}

export interface IEnderecoResumoDto {
  apelido: string | undefined;
  logradouro: string;
  numero: string;
  complemento: string | undefined;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal: boolean;
}

export interface ICartaoResumoDto {
  apelido: string | undefined;
  bandeira: string;
  ultimos4Digitos: string;
  principal: boolean;
}

export interface IResumoPedidosDto {
  totalPedidos: number;
  totalGasto: number;
  ultimoPedidoEm: string | null;
}

export interface IDetalheClienteAdminDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string | undefined;
  cnpj: string | undefined;
  tipoPessoa: string | undefined;
  ativo: boolean;
  criadoEm: string | null;
  enderecos: IEnderecoResumoDto[];
  cartoes: ICartaoResumoDto[];
  resumoPedidos: IResumoPedidosDto;
}

export interface IResultadoConsultaClientes {
  clientes: Array<{
    uuid: string;
    nome: string;
    email: string;
    cpf?: string;
    ativo: boolean;
    criadoEm: string | null;
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

  private readonly repositorioEnderecos: IRepositorioEnderecoUsuario;

  private readonly repositorioCartoes: IRepositorioCartaoUsuario;

  private readonly repositorioVendas: IRepositorioVendas;

  constructor(
    repositorioUsuarios: IRepositorioUsuarios,
    repositorioEnderecos: IRepositorioEnderecoUsuario,
    repositorioCartoes: IRepositorioCartaoUsuario,
    repositorioVendas: IRepositorioVendas,
  ) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioEnderecos = repositorioEnderecos;
    this.repositorioCartoes = repositorioCartoes;
    this.repositorioVendas = repositorioVendas;
  }

  /**
   * Obtém detalhes completos de um cliente por UUID (RF0024).
   */
  async obterClientePorUuid(uuid: string): Promise<IDetalheClienteAdminDto | null> {
    const cliente = await this.repositorioUsuarios.buscarPorUuid(uuid);

    if (!cliente) {
      return null;
    }

    const [enderecos, cartoes, resumoPedidos] = await Promise.all([
      this.buscarEnderecosDoCliente(cliente.id),
      this.buscarCartoesDoCliente(cliente.id),
      this.buscarResumoPedidosDoCliente(cliente.id),
    ]);

    return {
      uuid: cliente.uuid,
      nome: cliente.nome,
      email: mascararEmail(cliente.email),
      cpf: cliente.cpf ? mascararCpf(cliente.cpf) : undefined,
      cnpj: cliente.cnpj,
      tipoPessoa: cliente.tipoPessoa,
      ativo: cliente.ativo,
      criadoEm: cliente.criadoEm ? cliente.criadoEm.toISOString() : null,
      enderecos,
      cartoes,
      resumoPedidos,
    };
  }

  private async buscarEnderecosDoCliente(idUsuario: number): Promise<IEnderecoResumoDto[]> {
    const rows = await this.repositorioEnderecos.buscarResumoPorIdUsuario(idUsuario);

    return rows.map((row) => ({
      apelido: row.apelido ?? undefined,
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento ?? undefined,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
      principal: row.principal,
    }));
  }

  private async buscarCartoesDoCliente(idUsuario: number): Promise<ICartaoResumoDto[]> {
    const rows = await this.repositorioCartoes.buscarResumoPorUsuario(idUsuario);

    return rows.map((row) => ({
      apelido: row.apelido ?? undefined,
      bandeira: row.bandeira,
      ultimos4Digitos: row.ultimos4Digitos,
      principal: row.principal,
    }));
  }

  private async buscarResumoPedidosDoCliente(idUsuario: number): Promise<IResumoPedidosDto> {
    return this.repositorioVendas.obterResumoPedidosPorUsuario(idUsuario);
  }

  /**
   * Inativa ou reativa um cliente por UUID.
   */
  async inativarCliente(uuid: string, ativo: boolean): Promise<{ uuid: string; ativo: boolean }> {
    const cliente = await this.repositorioUsuarios.buscarPorUuid(uuid);

    if (!cliente) throw new Error('Cliente não encontrado.');

    await this.repositorioUsuarios.atualizarStatusAtivo(uuid, ativo);

    return { uuid, ativo };
  }

  /**
   * Consulta clientes com filtros e paginação (RF0024).
   */
  async consultarClientes(filtros: IFiltrosConsultaClientes): Promise<IResultadoConsultaClientes> {
    const offset = (filtros.pagina - 1) * filtros.limite;

    const clientes = await this.repositorioUsuarios.buscarClientesComFiltros({
      nome: filtros.nome,
      cpf: filtros.cpf,
      email: filtros.email,
      ativo: filtros.ativo,
      offset,
      limite: filtros.limite,
    });

    const total = await this.repositorioUsuarios.contarClientesComFiltros({
      nome: filtros.nome,
      cpf: filtros.cpf,
      email: filtros.email,
      ativo: filtros.ativo,
    });

    const totalPaginas = Math.ceil(total / filtros.limite);

    return {
      clientes: clientes.map((cliente) => ({
        uuid: cliente.uuid,
        nome: cliente.nome,
        email: mascararEmail(cliente.email),
        cpf: cliente.cpf ? mascararCpf(cliente.cpf) : undefined,
        ativo: cliente.ativo,
        criadoEm: cliente.criadoEm ? cliente.criadoEm.toISOString() : null,
      })),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas,
    };
  }
}
