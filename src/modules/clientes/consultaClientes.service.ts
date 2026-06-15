import { IRepositorioUsuarios } from '../usuarios/IRepositorioUsuarios';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { mascararCpf, mascararEmail } from '@/modules/clientes/gestaoIdentidadeClienteTexto.util';

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
  criadoEm: string;
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
    criadoEm: Date;
  }>;
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

interface IRowEndereco {
  apelido: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal: boolean;
}

interface IRowCartao {
  apelido: string | null;
  bandeira: string;
  ultimos4Digitos: string;
  principal: boolean;
}

interface IRowResumoPedidos {
  totalPedidos: string;
  totalGasto: string | null;
  ultimoPedidoEm: string | null;
}

/**
 * Serviço responsável pela consulta administrativa de clientes.
 */
export class ServicoConsultaClientes {
  private readonly repositorioUsuarios: IRepositorioUsuarios;
  private readonly db: IConexaoBanco;

  constructor(repositorioUsuarios: IRepositorioUsuarios, db: IConexaoBanco) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.db = db;
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
      criadoEm: (cliente.criadoEm ?? new Date()).toISOString(),
      enderecos,
      cartoes,
      resumoPedidos,
    };
  }

  private async buscarEnderecosDoCliente(idUsuario: number): Promise<IEnderecoResumoDto[]> {
    const query = `
      SELECT
        e.end_apelido AS "apelido",
        COALESCE(tl.tlo_descricao || ' ', '') || l.log_nome AS "logradouro",
        e.end_numero AS "numero",
        e.end_complemento AS "complemento",
        b.bai_nome AS "bairro",
        c.cid_nome AS "cidade",
        est.est_sigla AS "estado",
        LPAD(cep.cep_numero::text, 8, '0') AS "cep",
        e.end_principal AS "principal"
      FROM livraria_gestao.enderecos e
      LEFT JOIN livraria_ref.logradouros l ON l.log_id = e.log_id
      LEFT JOIN livraria_ref.tipos_logradouros tl ON tl.tlo_id = l.tlo_id
      LEFT JOIN livraria_ref.bairros b ON b.bai_id = e.bai_id
      LEFT JOIN livraria_ref.cidades c ON c.cid_id = e.cid_id
      LEFT JOIN livraria_ref.estados est ON est.est_id = c.est_id
      LEFT JOIN livraria_ref.ceps cep ON cep.cep_numero = e.cep_id
      WHERE e.usu_id = $1
      ORDER BY e.end_principal DESC, e.end_criado_em DESC
    `;

    const rows = await this.db.executar<IRowEndereco>(query, [idUsuario]);

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
    const query = `
      SELECT
        NULL::text AS "apelido",
        b.ban_descricao AS "bandeira",
        c.crt_final AS "ultimos4Digitos",
        c.crt_principal AS "principal"
      FROM livraria_financeiro.cartoes c
      JOIN livraria_financeiro.bandeiras_cartao b ON b.ban_id = c.ban_id
      WHERE c.usu_id = $1
      ORDER BY c.crt_principal DESC, c.crt_criado_em DESC
    `;

    const rows = await this.db.executar<IRowCartao>(query, [idUsuario]);

    return rows.map((row) => ({
      apelido: row.apelido ?? undefined,
      bandeira: row.bandeira,
      ultimos4Digitos: row.ultimos4Digitos,
      principal: row.principal,
    }));
  }

  private async buscarResumoPedidosDoCliente(idUsuario: number): Promise<IResumoPedidosDto> {
    const query = `
      SELECT
        COUNT(*) AS "totalPedidos",
        SUM(v.ven_total_venda)::text AS "totalGasto",
        MAX(v.ven_criado_em)::text AS "ultimoPedidoEm"
      FROM livraria_comercial.vendas v
      WHERE v.usu_id = $1
    `;

    const rows = await this.db.executar<IRowResumoPedidos>(query, [idUsuario]);
    const row = rows[0];

    return {
      totalPedidos: Number(row?.totalPedidos ?? 0),
      totalGasto: row?.totalGasto ? parseFloat(row.totalGasto) : 0,
      ultimoPedidoEm: row?.ultimoPedidoEm ?? null,
    };
  }

  /**
   * Inativa ou reativa um cliente por UUID.
   */
  async inativarCliente(uuid: string, ativo: boolean): Promise<{ uuid: string; ativo: boolean }> {
    const cliente = await this.repositorioUsuarios.buscarPorUuid(uuid);

    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    await this.db.executar(
      'UPDATE livraria_gestao.usuarios SET usu_ativo = $1 WHERE usu_uuid = $2',
      [ativo, uuid],
    );

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
        criadoEm: cliente.criadoEm ?? new Date(),
      })),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas,
    };
  }
}
