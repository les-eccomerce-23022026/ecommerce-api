import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import {
  ICriarClienteDto,
  IAtualizarClienteDto,
  IAlterarSenhaDto,
  IEnderecoDto,
  IPerfilClienteDto,
} from '@/modules/clientes/Iclientes.dto';
import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';

/**
 * Serviço responsável pelo fluxo de cadastro público de clientes.
 */
export class ServicoClientes {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  private readonly repositorioPerfil: IRepositorioPerfilCliente;

  private readonly repositorioTelefone: IRepositorioTelefoneUsuario;

  private readonly repositorioEndereco: IRepositorioEnderecoUsuario;

  private readonly db: IConexaoBanco; // Acesso direto ao banco para queries customizadas

  /**
   * Construtor injetado com os repositórios — sem saber a implementação (Inversão de Dependência)
   */
  constructor(
    repositorioUsuarios: IRepositorioUsuarios,
    repositorioPerfil: IRepositorioPerfilCliente,
    repositorioTelefone: IRepositorioTelefoneUsuario,
    repositorioEndereco: IRepositorioEnderecoUsuario,
    db: any,
  ) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioPerfil = repositorioPerfil;
    this.repositorioTelefone = repositorioTelefone;
    this.repositorioEndereco = repositorioEndereco;
    this.db = db;
  }

  private static mapearTipoTelefone(tipo: string): number {
    const mapeamentoTipos: Record<string, number> = {
      celular: 1,
      residencial: 2,
      comercial: 3,
    };

    return mapeamentoTipos[tipo.toLowerCase()] ?? 1; // default celular
  }

  private async obterOuCriarTipoResidencia(tipo: string): Promise<number> {
    // Por simplicidade, assumindo que tipos comuns já existem nos seeds
    // Em produção, implementar lógica para buscar ou criar
    const tipos: Record<string, number> = {
      'Casa': 1,
      'Apartamento': 2,
      'Condomínio': 3,
    };
    return tipos[tipo] ?? 1; // default Casa
  }

  private async obterOuCriarTipoLogradouro(tipo: string): Promise<number> {
    // Por simplicidade, assumindo que tipos comuns já existem nos seeds
    const tipos: Record<string, number> = {
      'Rua': 1,
      'Avenida': 2,
      'Alameda': 3,
      'Travessa': 4,
    };
    return tipos[tipo] ?? 1; // default Rua
  }

  private async obterOuCriarLogradouro(tipoLogradouro: string, nomeLogradouro: string, numero: string): Promise<number> {
    // Buscar logradouro existente
    const queryBuscar = `
      SELECT l.id_logradouro
      FROM ecm_logradouro l
      JOIN ecm_tipo_logradouro tl ON l.id_tipo_logradouro = tl.id_tipo_logradouro
      WHERE tl.dsc_tipo_logradouro = $1 AND l.dsc_logradouro = $2 AND l.num_logradouro = $3
    `;
    const existente = await this.db.executar(queryBuscar, [tipoLogradouro, nomeLogradouro, numero]) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number((existente[0] as Record<string, unknown>).id_logradouro);
    }

    // Criar novo logradouro
    const idTipoLogradouro = await this.obterOuCriarTipoLogradouro(tipoLogradouro);
    const queryInserir = `
      INSERT INTO ecm_logradouro (id_tipo_logradouro, dsc_logradouro, num_logradouro)
      VALUES ($1, $2, $3)
      RETURNING id_logradouro
    `;
    const novo = await this.db.executar(queryInserir, [idTipoLogradouro, nomeLogradouro, numero]) as Record<string, unknown>[];
    return Number((novo[0] as Record<string, unknown>).id_logradouro);
  }

  private async obterOuCriarCidade(cidade: string, estado: string): Promise<number> {
    // Simplificado: buscar ou criar cidade
    // Por ora, buscar cidade existente ou retornar ID padrão
    const query = `SELECT id_cidade FROM ecm_cidade WHERE nom_cidade = $1 LIMIT 1`;
    const existente = await this.db.executar(query, [cidade]) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number((existente[0] as Record<string, unknown>).id_cidade);
    }
    // Se não existir, inserir (simplificado)
    const insertQuery = `INSERT INTO ecm_cidade (nom_cidade, nom_cidade_norm) VALUES ($1, $1) RETURNING id_cidade`;
    const novo = await this.db.executar(insertQuery, [cidade]) as Record<string, unknown>[];
    return Number((novo[0] as Record<string, unknown>).id_cidade);
  }

  private async obterOuCriarBairro(bairro: string): Promise<number> {
    // Simplificado
    const query = `SELECT id_bairro FROM ecm_bairro WHERE nom_bairro = $1 LIMIT 1`;
    const existente = await this.db.executar(query, [bairro]) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number((existente[0] as Record<string, unknown>).id_bairro);
    }
    const insertQuery = `INSERT INTO ecm_bairro (nom_bairro, nom_bairro_norm, id_cidade) VALUES ($1, $1, $2) RETURNING id_bairro`;
    const novo = await this.db.executar(insertQuery, [bairro, 1]) as Record<string, unknown>[]; // id_cidade 1 por enquanto
    return Number((novo[0] as Record<string, unknown>).id_bairro);
  }

  private async obterOuCriarCep(cep: string): Promise<number> {
    // Remover máscara do CEP
    const cepLimpo = cep.replace(/\D/g, '');
    const query = `SELECT id_cep FROM ecm_cep WHERE num_cep = $1 LIMIT 1`;
    const existente = await this.db.executar(query, [cepLimpo]) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number((existente[0] as Record<string, unknown>).id_cep);
    }
    const insertQuery = `INSERT INTO ecm_cep (num_cep, id_cidade, id_bairro) VALUES ($1, $2, $3) RETURNING id_cep`;
    const novo = await this.db.executar(insertQuery, [cepLimpo, 1, 1]) as Record<string, unknown>[]; // ids temporários
    return Number((novo[0] as Record<string, unknown>).id_cep);
  }

  private async obterOuCriarPais(pais: string): Promise<number> {
    // Brasil é 1 por padrão
    return 1;
  }

  private async criarEndereco(idUsuario: number, enderecoDto: IEnderecoDto, tipo: 'cobranca' | 'entrega', principal: boolean = false): Promise<void> {
    const idTipoResidencia = await this.obterOuCriarTipoResidencia(enderecoDto.tipoResidencia || 'Casa');
    const idLogradouro = await this.obterOuCriarLogradouro(
      enderecoDto.tipoLogradouro || 'Rua',
      enderecoDto.logradouro,
      enderecoDto.numero
    );
    const idCidade = await this.obterOuCriarCidade(enderecoDto.cidade, enderecoDto.estado);
    const idBairro = await this.obterOuCriarBairro(enderecoDto.bairro);
    const idCep = await this.obterOuCriarCep(enderecoDto.cep);
    const idPais = await this.obterOuCriarPais(enderecoDto.pais || 'Brasil');

    const endereco: IEnderecoUsuario = {
      idUsuario,
      tipoEndereco: tipo,
      idPais,
      idTipoResidencia,
      idLogradouro,
      complemento: enderecoDto.complemento,
      idCidade,
      idBairro,
      idCep,
      principal,
    };

    await this.repositorioEndereco.criar(endereco);
  }

  /**
   * Altera a senha de um cliente existente. (RF0028)
   *
   * @param uuid Identificador único do cliente.
   * @param dados Dados contendo senha atual e nova senha.
   */
  public async alterarSenha(uuid: string, dados: IAlterarSenhaDto): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const senhaValida = await bcrypt.compare(dados.senha_atual, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Senha atual incorreta.');
    }

    if (dados.nova_senha !== dados.confirmacao_senha) {
      throw new Error('Nova senha e confirmação não conferem.');
    }

    if (!verificarForcaSenha(dados.nova_senha)) {
      throw new Error('Nova senha muito fraca.');
    }

    if (dados.nova_senha === dados.senha_atual) {
      throw new Error('Nova senha deve ser diferente da senha atual.');
    }

    const novaSenhaHash = await bcrypt.hash(dados.nova_senha, 10); // Reduzido de 12 para 10 em testes
    await this.repositorioUsuarios.atualizarUsuario(uuid, { senhaHash: novaSenhaHash });
  }

  /**
   * Atualiza os dados de um cliente existente.
   *
   * @param uuid Identificador único do cliente.
   * @param dados Dados a serem atualizados (parcial).
   */
  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    const usuarioNoBanco = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuarioNoBanco) {
      throw new Error('Usuário não encontrado.');
    }

    const perfilExistente = await this.repositorioPerfil.buscarPorIdUsuario(usuarioNoBanco.id);
    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(usuarioNoBanco.id);

    const usuarioAtualizado = await this.repositorioUsuarios.atualizarUsuario(uuid, {
      nome: dados.nome ?? usuarioNoBanco.nome,
    });

    if (!usuarioAtualizado) {
      throw new Error('Erro ao atualizar usuário.');
    }

    // Atualizar perfil (genero / dataNascimento) — RF0022
    if (dados.genero !== undefined || dados.dataNascimento !== undefined) {
      const perfilAtualizado: IPerfilCliente = {
        idUsuario: usuarioNoBanco.id,
        genero: dados.genero ?? perfilExistente?.genero,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : perfilExistente?.dataNascimento,
      };
      if (perfilExistente) {
        await this.repositorioPerfil.atualizar(perfilAtualizado);
      } else {
        await this.repositorioPerfil.criar(perfilAtualizado);
      }
    }

    // Atualizar telefone — RF0022: recriar telefone principal se enviado
    if (dados.telefone !== undefined) {
      await Promise.all(
        telefonesExistentes
          .filter((tel) => tel.uuid)
          .map((tel) => this.repositorioTelefone.deletar(usuarioNoBanco.id, tel.uuid!)),
      );
      if (dados.telefone) {
        await this.repositorioTelefone.criar({
          idUsuario: usuarioNoBanco.id,
          idTipoTelefone: ServicoClientes.mapearTipoTelefone(dados.telefone.tipo),
          ddd: dados.telefone.ddd,
          numero: dados.telefone.numero,
          principal: true,
        });
      }
    }

    return {
      uuid: usuarioAtualizado.uuid,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      role: usuarioAtualizado.role.descricao,
    };
  }

  /**
   * Inativa um cliente (soft delete) (RF0023).
   *
   * @param uuid Identificador único do cliente.
   */
  public async inativarCliente(uuid: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    if (!usuario.ativo) {
      throw new Error('Conta já está inativa.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: false });
  }

  /**
   * Obtém o perfil completo do cliente.
   *
   * @param uuid UUID do cliente.
   * @returns Dados do perfil do cliente.
   */
  public async obterPerfil(uuid: string): Promise<IPerfilClienteDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const perfil = await this.repositorioPerfil.buscarPorIdUsuario(usuario.id);

    // Por enquanto, retornar apenas dados básicos
    // TODO: implementar busca completa de telefone e endereços com joins

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      genero: perfil?.genero,
      dataNascimento: perfil?.dataNascimento?.toISOString().split('T')[0], // Formato YYYY-MM-DD
      telefone: undefined, // TODO
      enderecos: [], // TODO
    };
  }

  public async registrarCliente(dados: ICriarClienteDto) {
    if (dados.senha !== dados.confirmacao_senha) {
      throw new Error('Senha e confirmação de senha não conferem.');
    }

    if (!verificarForcaSenha(dados.senha)) {
      throw new Error(
        'Senha fraca. É necessário pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e caractere especial.',
      );
    }

    const existentePorEmail = await this.repositorioUsuarios.buscarPorEmail(dados.email);
    if (existentePorEmail) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const existentePorCpf = await this.repositorioUsuarios.buscarPorCpf(dados.cpf);
    if (existentePorCpf) {
      throw new Error('Já existe um usuário cadastrado com este CPF.');
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12);

    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      senhaHash,
      role: PAPEL_CLIENTE,
    });

    // Criar perfil se fornecido
    if ('genero' in dados && dados.genero) {
      await this.repositorioPerfil.criar({
        idUsuario: usuario.id,
        genero: dados.genero,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
      });
    }

    // Criar telefone se fornecido
    if ('telefone' in dados && dados.telefone) {
      await this.repositorioTelefone.criar({
        idUsuario: usuario.id,
        idTipoTelefone: ServicoClientes.mapearTipoTelefone(dados.telefone.tipo),
        ddd: dados.telefone.ddd,
        numero: dados.telefone.numero,
        principal: true,
      });
    }

    // Criar endereços se fornecido (opcional no registro, pode ser adicionado via PUT /perfil)
    if (dados.enderecoCobranca) {
      await this.criarEndereco(usuario.id, dados.enderecoCobranca, 'cobranca', true);

      if (dados.enderecoEntregaIgualCobranca) {
        await this.criarEndereco(usuario.id, dados.enderecoCobranca, 'entrega', false);
      } else if (dados.enderecoEntrega) {
        await this.criarEndereco(usuario.id, dados.enderecoEntrega, 'entrega', false);
      }
    }

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role.descricao,
    };
  }
}

