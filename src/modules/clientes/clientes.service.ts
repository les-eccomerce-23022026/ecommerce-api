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
  ITelefoneDto,
} from '@/modules/clientes/Iclientes.dto';
import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
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

  private static normalizarDigitos(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private static mascararCpf(cpf: string): string {
    const cpfSomenteDigitos = ServicoClientes.normalizarDigitos(cpf);

    if (cpfSomenteDigitos.length !== 11) {
      return cpf;
    }

    return `***.${cpfSomenteDigitos.slice(3, 6)}.***-**`;
  }

  private static mascararNumeroTelefone(numero: string): string {
    const numeroSomenteDigitos = ServicoClientes.normalizarDigitos(numero);

    if (numeroSomenteDigitos.length <= 4) {
      return numeroSomenteDigitos;
    }

    const quantidadeMascarada = numeroSomenteDigitos.length - 4;
    return `${'*'.repeat(quantidadeMascarada)}${numeroSomenteDigitos.slice(-4)}`;
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
    const existente = await this.db.executar(queryBuscar, [tipoLogradouro, nomeLogradouro, numero]) as Record<string, any>[];
    if (existente.length > 0) {
      return Number(existente[0].id_logradouro);
    }

    // Criar novo logradouro
    const idTipoLogradouro = await this.obterOuCriarTipoLogradouro(tipoLogradouro);
    const queryInserir = `
      INSERT INTO ecm_logradouro (id_tipo_logradouro, dsc_logradouro, num_logradouro)
      VALUES ($1, $2, $3)
      RETURNING id_logradouro
    `;
    const novo = await this.db.executar(queryInserir, [idTipoLogradouro, nomeLogradouro, numero]) as Record<string, any>[];
    return Number(novo[0].id_logradouro);
  }

  private async obterOuCriarCidade(cidade: string, estado: string): Promise<number> {
    // Simplificado: buscar ou criar cidade
    // Por ora, buscar cidade existente ou retornar ID padrão
    const query = `SELECT id_cidade FROM ecm_cidade WHERE nom_cidade = $1 LIMIT 1`;
    const existente = await this.db.executar(query, [cidade]) as Record<string, any>[];
    if (existente.length > 0) {
      return Number(existente[0].id_cidade);
    }
    // Se não existir, inserir (simplificado)
    const insertQuery = `INSERT INTO ecm_cidade (nom_cidade, nom_cidade_norm) VALUES ($1, $1) RETURNING id_cidade`;
    const novo = await this.db.executar(insertQuery, [cidade]) as Record<string, any>[];
    return Number(novo[0].id_cidade);
  }

  private async obterOuCriarBairro(bairro: string): Promise<number> {
    // Simplificado
    const query = `SELECT id_bairro FROM ecm_bairro WHERE nom_bairro = $1 LIMIT 1`;
    const existente = await this.db.executar(query, [bairro]) as Record<string, any>[];
    if (existente.length > 0) {
      return Number(existente[0].id_bairro);
    }
    const insertQuery = `INSERT INTO ecm_bairro (nom_bairro, nom_bairro_norm, id_cidade) VALUES ($1, $1, $2) RETURNING id_bairro`;
    const novo = await this.db.executar(insertQuery, [bairro, 1]) as Record<string, any>[]; // id_cidade 1 por enquanto
    return Number(novo[0].id_bairro);
  }

  private async obterOuCriarCep(cep: string): Promise<number> {
    // Remover máscara do CEP
    const cepLimpo = cep.replace(/\D/g, '');
    const query = `SELECT id_cep FROM ecm_cep WHERE num_cep = $1 LIMIT 1`;
    const existente = await this.db.executar(query, [cepLimpo]) as Record<string, any>[];
    if (existente.length > 0) {
      return Number(existente[0].id_cep);
    }
    const insertQuery = `INSERT INTO ecm_cep (num_cep, id_cidade, id_bairro) VALUES ($1, $2, $3) RETURNING id_cep`;
    const novo = await this.db.executar(insertQuery, [cepLimpo, 1, 1]) as Record<string, any>[]; // ids temporários
    return Number(novo[0].id_cep);
  }

  private async obterOuCriarPais(pais: string): Promise<number> {
    // Brasil é 1 por padrão
    return 1;
  }

  private async obterCidadePorId(idCidade: number): Promise<any> {
    const query = `SELECT c.nom_cidade as "dscCidade", e.sig_estado as "dscEstado"
                   FROM ecm_cidade c
                   JOIN ecm_estado_brasileiro e ON c.id_estado = e.id_estado
                   WHERE c.id_cidade = $1`;
    const result = await this.db.executar(query, [idCidade]) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterBairroPorId(idBairro: number): Promise<any> {
    const query = `SELECT nom_bairro as "dscBairro" FROM ecm_bairro WHERE id_bairro = $1`;
    const result = await this.db.executar(query, [idBairro]) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterCepPorId(idCep: number): Promise<any> {
    const query = `SELECT num_cep as "numCep" FROM ecm_cep WHERE id_cep = $1`;
    const result = await this.db.executar(query, [idCep]) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterPaisPorId(idPais: number): Promise<any> {
    const query = `SELECT nom_pais as "dscPais" FROM ecm_pais WHERE id_pais = $1`;
    const result = await this.db.executar(query, [idPais]) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterTipoResidenciaPorId(idTipoResidencia: number): Promise<any> {
    const query = `SELECT dsc_tipo_residencia as "dscTipoResidencia" FROM ecm_tipo_residencia WHERE id_tipo_residencia = $1`;
    const result = await this.db.executar(query, [idTipoResidencia]) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterLogradouroPorId(idLogradouro: number): Promise<any> {
    const query = `SELECT l.dsc_logradouro as "dscLogradouro", l.num_logradouro as "numLogradouro", tl.dsc_tipo_logradouro as "tipoLogradouro"
                   FROM ecm_logradouro l
                   JOIN ecm_tipo_logradouro tl ON l.id_tipo_logradouro = tl.id_tipo_logradouro
                   WHERE l.id_logradouro = $1`;
    const result = await this.db.executar(query, [idLogradouro]) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
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

    const senhaValida = await bcrypt.compare(dados.senhaAtual, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Senha atual incorreta.');
    }

    if (dados.novaSenha !== dados.confirmacaoNovaSenha) {
      throw new Error('Nova senha e confirmação não conferem.');
    }

    if (!verificarForcaSenha(dados.novaSenha)) {
      throw new Error('Nova senha muito fraca.');
    }

    if (dados.novaSenha === dados.senhaAtual) {
      throw new Error('Nova senha deve ser diferente da senha atual.');
    }

    const novaSenhaHash = await bcrypt.hash(dados.novaSenha, 10); // Reduzido de 12 para 10 em testes
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

    // Atualizar endereços (substituição total para simplificar sincronia do front)
    if (dados.enderecos !== undefined) {
      const enderecosExistentes = await this.repositorioEndereco.buscarPorIdUsuario(usuarioNoBanco.id);
      
      // Remover endereços existentes (deletar logradouros etc é complexo, aqui deletamos apenas o vínculo usuario_endereco)
      for (const end of enderecosExistentes) {
        if (end.uuid) {
          await this.repositorioEndereco.deletar(usuarioNoBanco.id, end.uuid);
        }
      }

      // Adicionar novos endereços fornecidos
      if (Array.isArray(dados.enderecos)) {
        for (let i = 0; i < dados.enderecos.length; i++) {
          const endDto = dados.enderecos[i];
          // O primeiro endereço enviado será marcado como principal (ou baseado em alguma lógica póstuma)
          await this.criarEndereco(usuarioNoBanco.id, endDto, 'entrega', i === 0);
        }
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
   * Adiciona um novo endereço de entrega ou cobrança ao cliente. (RF0026)
   */
  public async adicionarEndereco(uuid: string, dados: any): Promise<any> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) throw new Error('Usuário não encontrado.');

    await this.criarEndereco(usuario.id, dados, dados.tipoEndereco || 'entrega', false);
    
    // Retornar o perfil atualizado ou o novo endereço (simplificado)
    const enderecos = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    return this.converterEnderecosParaDto(enderecos);
  }

  /**
   * Remove um endereço pelo UUID do endereço, validando o dono.
   */
  public async removerEndereco(uuidUsuario: string, uuidEndereco: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new Error('Usuário não encontrado.');

    await this.repositorioEndereco.deletar(usuario.id, uuidEndereco);
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

    // Buscar telefone principal
    const telefones = await this.repositorioTelefone.buscarPorIdUsuario(usuario.id);
    const telefonePrincipal = telefones.find((telefone) => telefone.principal) ?? telefones[0];

    // Buscar endereços
    const enderecosUsuario = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecosDto = await this.converterEnderecosParaDto(enderecosUsuario);

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      cpfMascarado: ServicoClientes.mascararCpf(usuario.cpf),
      genero: perfil?.genero,
      dataNascimento: perfil?.dataNascimento
        ? perfil.dataNascimento.toISOString().split('T')[0]
        : undefined, // Formato YYYY-MM-DD
      telefone: telefonePrincipal ? this.converterTelefoneParaDto(telefonePrincipal) : undefined,
      enderecos: enderecosDto,
    };
  }

  /**
   * Converte telefone do banco para DTO.
   */
  private converterTelefoneParaDto(telefone: ITelefoneUsuario): ITelefoneDto {
    const tipos: Record<number, string> = {
      1: 'Celular',
      2: 'Residencial',
      3: 'Comercial',
    };

    return {
      tipo: tipos[telefone.idTipoTelefone] || 'Celular',
      ddd: telefone.ddd,
      numero: telefone.numero,
      numeroMascarado: ServicoClientes.mascararNumeroTelefone(telefone.numero),
    };
  }

  /**
   * Converte endereços do banco para DTOs.
   */
  private async converterEnderecosParaDto(enderecos: IEnderecoUsuario[]): Promise<IEnderecoDto[]> {
    const enderecosDto: IEnderecoDto[] = [];

    for (const endereco of enderecos) {
      // Buscar informações relacionadas (cidade, bairro, etc.)
      const cidade = await this.obterCidadePorId(endereco.idCidade);
      const bairro = await this.obterBairroPorId(endereco.idBairro);
      const cep = await this.obterCepPorId(endereco.idCep);
      const pais = await this.obterPaisPorId(endereco.idPais);
      const tipoResidencia = await this.obterTipoResidenciaPorId(endereco.idTipoResidencia);
      const logradouro = await this.obterLogradouroPorId(endereco.idLogradouro);

      enderecosDto.push({
        uuid: endereco.uuid,
        apelido: endereco.principal ? 'Principal' : `Endereço ${endereco.id}`,
        tipoResidencia: tipoResidencia?.dscTipoResidencia || 'Casa',
        tipoLogradouro: logradouro?.tipoLogradouro || 'Rua',
        logradouro: logradouro?.dscLogradouro || '',
        numero: logradouro?.numLogradouro || '',
        complemento: endereco.complemento,
        bairro: bairro?.dscBairro || '',
        cep: cep?.numCep || '',
        cidade: cidade?.dscCidade || '',
        estado: cidade?.dscEstado || '',
        pais: pais?.dscPais || 'Brasil',
      });
    }

    return enderecosDto;
  }

  public async registrarCliente(dados: ICriarClienteDto) {
    if (dados.senha !== dados.confirmacaoSenha) {
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
    if (dados.genero || dados.dataNascimento) {
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

