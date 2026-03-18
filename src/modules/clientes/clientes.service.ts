import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import {
  ICriarClienteDto,
  IAtualizarClienteDto,
  IAlterarSenhaDto,
  IEnderecoDto,
  IPerfilClienteDto,
  ITelefoneDto,
  ICartaoDto,
} from '@/modules/clientes/Iclientes.dto';
import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
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

  private readonly repositorioCartoes: IRepositorioCartaoUsuario;

  private readonly db: IConexaoBanco; // Acesso direto ao banco para queries customizadas

  /**
   * Construtor injetado com os repositórios — sem saber a implementação (Inversão de Dependência)
   */
  constructor(
    repositorioUsuarios: IRepositorioUsuarios,
    repositorioPerfil: IRepositorioPerfilCliente,
    repositorioTelefone: IRepositorioTelefoneUsuario,
    repositorioEndereco: IRepositorioEnderecoUsuario,
    repositorioCartoes: IRepositorioCartaoUsuario,
    db: IConexaoBanco,
  ) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioPerfil = repositorioPerfil;
    this.repositorioTelefone = repositorioTelefone;
    this.repositorioEndereco = repositorioEndereco;
    this.repositorioCartoes = repositorioCartoes;
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

  private static mascararEmail(email: string): string {
    const partes = email.split('@');
    if (partes.length !== 2) return email;
    const [usuario, dominio] = partes;
    if (usuario.length <= 2) {
      return `${usuario[0]}***@${dominio}`;
    }
    return `${usuario[0]}***${usuario[usuario.length - 1]}@${dominio}`;
  }

  private static async obterIdTipoResidencia(db: IConexaoBanco, descricao: string): Promise<number> {
    const query = `SELECT id_tipo_residencia FROM ecm_tipo_residencia WHERE dsc_tipo_residencia ILIKE $1 LIMIT 1`;
    const result = (await db.executar(query, [descricao])) as Record<string, unknown>[];
    return result.length > 0 ? Number(result[0].id_tipo_residencia) : 1; // Default Casa
  }

  private static async obterIdTipoLogradouro(db: IConexaoBanco, descricao: string): Promise<number> {
    const query = `SELECT id_tipo_logradouro FROM ecm_tipo_logradouro WHERE dsc_tipo_logradouro ILIKE $1 LIMIT 1`;
    const result = (await db.executar(query, [descricao])) as Record<string, unknown>[];
    return result.length > 0 ? Number(result[0].id_tipo_logradouro) : 1; // Default Rua
  }

  private async obterOuCriarLogradouro(tipoLogradouro: string, nomeLogradouro: string, numero: string): Promise<number> {
    const queryBuscar = `
      SELECT l.id_logradouro
      FROM ecm_logradouro l
      JOIN ecm_tipo_logradouro tl ON l.id_tipo_logradouro = tl.id_tipo_logradouro
      WHERE tl.dsc_tipo_logradouro ILIKE $1 AND l.dsc_logradouro = $2 AND l.num_logradouro = $3
    `;
    const existente = (await this.db.executar(queryBuscar, [
      tipoLogradouro,
      nomeLogradouro,
      numero,
    ])) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number(existente[0].id_logradouro);
    }

    const idTipoLogradouro = await ServicoClientes.obterIdTipoLogradouro(this.db, tipoLogradouro);
    const queryInserir = `
      INSERT INTO ecm_logradouro (id_tipo_logradouro, dsc_logradouro, num_logradouro)
      VALUES ($1, $2, $3)
      RETURNING id_logradouro
    `;
    const novo = (await this.db.executar(queryInserir, [
      idTipoLogradouro,
      nomeLogradouro,
      numero,
    ])) as Record<string, unknown>[];
    return Number(novo[0].id_logradouro);
  }

  private async obterOuCriarCidade(cidade: string, siglaEstado: string): Promise<number> {
    const queryEstado = `SELECT id_estado FROM ecm_estado_brasileiro WHERE sig_estado = $1 LIMIT 1`;
    const estadoResult = (await this.db.executar(queryEstado, [siglaEstado.toUpperCase().trim()])) as Record<string, unknown>[];
    const idEstado = estadoResult.length > 0 ? Number(estadoResult[0].id_estado) : null;

    const query = `SELECT id_cidade FROM ecm_cidade WHERE nom_cidade_norm = UPPER(TRIM($1)) AND (id_estado = $2 OR $2 IS NULL) LIMIT 1`;
    const existente = (await this.db.executar(query, [cidade, idEstado])) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number(existente[0].id_cidade);
    }

    const insertQuery = `INSERT INTO ecm_cidade (nom_cidade, nom_cidade_norm, id_estado) VALUES ($1::varchar, UPPER(TRIM($1::varchar)), $2) RETURNING id_cidade`;
    const novo = (await this.db.executar(insertQuery, [cidade, idEstado])) as Record<string, unknown>[];
    return Number(novo[0].id_cidade);
  }

  private async obterOuCriarBairro(bairro: string, idCidade: number): Promise<number> {
    const query = `SELECT id_bairro FROM ecm_bairro WHERE nom_bairro_norm = UPPER(TRIM($1)) AND id_cidade = $2 LIMIT 1`;
    const existente = (await this.db.executar(query, [bairro, idCidade])) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number(existente[0].id_bairro);
    }
    const insertQuery = `INSERT INTO ecm_bairro (nom_bairro, nom_bairro_norm, id_cidade) VALUES ($1::varchar, UPPER(TRIM($1::varchar)), $2) RETURNING id_bairro`;
    const novo = (await this.db.executar(insertQuery, [bairro, idCidade])) as Record<string, unknown>[];
    return Number(novo[0].id_bairro);
  }

  private async obterOuCriarCep(cep: string, idCidade: number, idBairro: number): Promise<number> {
    const cepLimpo = cep.replace(/\D/g, '');
    const query = `SELECT id_cep FROM ecm_cep WHERE num_cep = $1 LIMIT 1`;
    const existente = (await this.db.executar(query, [cepLimpo])) as Record<string, unknown>[];
    if (existente.length > 0) {
      return Number(existente[0].id_cep);
    }
    try {
      const insertQuery = `INSERT INTO ecm_cep (num_cep, id_cidade, id_bairro) VALUES ($1, $2, $3) RETURNING id_cep`;
      const novo = (await this.db.executar(insertQuery, [cepLimpo, idCidade, idBairro])) as Record<string, unknown>[];
      return Number(novo[0].id_cep);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const error = err as { message: string; code?: string };
        // Se der erro de unicidade, buscar o que já existe
        if (error.message.includes('unique constraint') || error.code === '23505') {
          const queryRebusca = `SELECT id_cep FROM ecm_cep WHERE num_cep = $1 LIMIT 1`;
          const rebuasca = (await this.db.executar(queryRebusca, [cepLimpo])) as Record<string, unknown>[];
          return Number(rebuasca[0].id_cep);
        }
      }
      throw err;
    }
  }

  private static obterOuCriarPais(_pais: string): number {
    // Brasil é 1 por padrão
    return 1;
  }

  private async obterCidadePorId(idCidade: number): Promise<Record<string, unknown> | null> {
    const query = `SELECT c.nom_cidade as "dscCidade", e.sig_estado as "dscEstado"
                   FROM ecm_cidade c
                   JOIN ecm_estado_brasileiro e ON c.id_estado = e.id_estado
                   WHERE c.id_cidade = $1`;
    const result = (await this.db.executar(query, [idCidade])) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterBairroPorId(idBairro: number): Promise<Record<string, unknown> | null> {
    const query = `SELECT nom_bairro as "dscBairro" FROM ecm_bairro WHERE id_bairro = $1`;
    const result = (await this.db.executar(query, [idBairro])) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterCepPorId(idCep: number): Promise<Record<string, unknown> | null> {
    const query = `SELECT num_cep as "numCep" FROM ecm_cep WHERE id_cep = $1`;
    const result = (await this.db.executar(query, [idCep])) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterPaisPorId(idPais: number): Promise<Record<string, unknown> | null> {
    const query = `SELECT nom_pais as "dscPais" FROM ecm_pais WHERE id_pais = $1`;
    const result = (await this.db.executar(query, [idPais])) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterTipoResidenciaPorId(idTipoResidencia: number): Promise<Record<string, unknown> | null> {
    const query = `SELECT dsc_tipo_residencia as "dscTipoResidencia" FROM ecm_tipo_residencia WHERE id_tipo_residencia = $1`;
    const result = (await this.db.executar(query, [idTipoResidencia])) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async obterLogradouroPorId(idLogradouro: number): Promise<Record<string, unknown> | null> {
    const query = `SELECT l.dsc_logradouro as "dscLogradouro", l.num_logradouro as "numLogradouro", tl.dsc_tipo_logradouro as "tipoLogradouro"
                   FROM ecm_logradouro l
                   JOIN ecm_tipo_logradouro tl ON l.id_tipo_logradouro = tl.id_tipo_logradouro
                   WHERE l.id_logradouro = $1`;
    const result = (await this.db.executar(query, [idLogradouro])) as Record<string, unknown>[];
    return result.length > 0 ? result[0] : null;
  }

  private async criarEndereco(
    idUsuario: number,
    enderecoDto: IEnderecoDto,
    tipo: 'cobranca' | 'entrega',
    principal: boolean = false,
  ): Promise<IEnderecoDto> {
    const idTipoResidencia = await ServicoClientes.obterIdTipoResidencia(this.db, enderecoDto.tipoResidencia || 'Casa');
    const idLogradouro = await this.obterOuCriarLogradouro(
      enderecoDto.tipoLogradouro || 'Rua',
      enderecoDto.logradouro,
      enderecoDto.numero,
    );
    const idCidade = await this.obterOuCriarCidade(enderecoDto.cidade, enderecoDto.estado);
    const idBairro = await this.obterOuCriarBairro(enderecoDto.bairro, idCidade);
    const idCep = await this.obterOuCriarCep(enderecoDto.cep, idCidade, idBairro);
    const idPais = ServicoClientes.obterOuCriarPais(enderecoDto.pais || 'Brasil');

    const endereco: IEnderecoUsuario = {
      idUsuario,
      tipoEndereco: tipo,
      apelido: enderecoDto.apelido,
      idPais,
      idTipoResidencia,
      idLogradouro,
      complemento: enderecoDto.complemento,
      idCidade,
      idBairro,
      idCep,
      principal,
    };

    const enderecoCriado = await this.repositorioEndereco.criar(endereco);
    const dtos = await this.converterEnderecosParaDto([enderecoCriado]);
    return dtos[0];
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
   * Suporta atualização parcial e exige senha para dados críticos (E-mail, CPF, Telefone).
   *
   * @param uuid Identificador único do cliente.
   * @param dados Dados a serem atualizados (parcial).
   */
  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    const usuarioNoBanco = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuarioNoBanco) {
      throw new Error('Usuário não encontrado.');
    }

    // 1. Verificar se há alteração de dados críticos que exijam senha
    const alterandoEmail = dados.email !== undefined && dados.email !== usuarioNoBanco.email && !dados.email.includes('*');
    const alterandoCpf = dados.cpf !== undefined && dados.cpf !== usuarioNoBanco.cpf && !dados.cpf.includes('*');
    
    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(usuarioNoBanco.id);
    const telefonePrincipal = telefonesExistentes.find(t => t.principal) || telefonesExistentes[0];
    const alterandoTelefone = dados.telefone !== undefined && 
                             dados.telefone.numero !== telefonePrincipal?.numero && 
                             !dados.telefone.numero.includes('*');

    if (alterandoEmail || alterandoCpf || alterandoTelefone) {
      if (!dados.senhaConfirmacao) {
        throw new Error('Senha de confirmação é obrigatória para alterar E-mail, CPF ou Telefone.');
      }
      const senhaValida = await bcrypt.compare(dados.senhaConfirmacao, usuarioNoBanco.senhaHash);
      if (!senhaValida) {
        throw new Error('Senha de confirmação inválida.');
      }
      
      // Se estiver alterando e-mail, verificar se já existe
      if (alterandoEmail) {
        const existente = await this.repositorioUsuarios.buscarPorEmail(dados.email!);
        if (existente && existente.uuid !== uuid) {
          throw new Error('Este e-mail já está em uso por outro usuário.');
        }
      }
    }

    // 2. Atualizar dados básicos (Nome, Email, CPF) no repositório de usuários
    const payloadUsuario: Partial<IUsuario> = {};
    if (dados.nome !== undefined) payloadUsuario.nome = dados.nome;
    if (alterandoEmail) payloadUsuario.email = dados.email;
    if (alterandoCpf) payloadUsuario.cpf = dados.cpf;
    if (alterandoTelefone && dados.telefone) payloadUsuario.telefone = dados.telefone.numero;

    let usuarioAtualizado = usuarioNoBanco;
    if (Object.keys(payloadUsuario).length > 0) {
      const resultado = await this.repositorioUsuarios.atualizarUsuario(uuid, payloadUsuario);
      if (!resultado) throw new Error('Erro ao atualizar dados básicos do usuário.');
      usuarioAtualizado = resultado;
    }

    // 3. Atualizar perfil (gênero / dataNascimento)
    if (dados.genero !== undefined || dados.dataNascimento !== undefined) {
      const perfilExistente = await this.repositorioPerfil.buscarPorIdUsuario(usuarioNoBanco.id);
      const perfilAtualizado: IPerfilCliente = {
        idUsuario: usuarioNoBanco.id,
        genero: dados.genero !== undefined ? dados.genero : perfilExistente?.genero,
        dataNascimento: dados.dataNascimento !== undefined ? new Date(dados.dataNascimento) : perfilExistente?.dataNascimento,
      };

      if (perfilExistente) {
        await this.repositorioPerfil.atualizar(perfilAtualizado);
      } else {
        await this.repositorioPerfil.criar(perfilAtualizado);
      }
    }

    // 4. Atualizar telefone (cirúrgico)
    if (alterandoTelefone && dados.telefone) {
      const dddNormalizado = ServicoClientes.normalizarDigitos(dados.telefone.ddd);
      const numeroNormalizado = ServicoClientes.normalizarDigitos(dados.telefone.numero);

      if (dddNormalizado.length !== 2) {
        throw new Error('DDD deve conter exatamente 2 dígitos numéricos.');
      }
      if (numeroNormalizado.length < 8 || numeroNormalizado.length > 9) {
        throw new Error('Número de telefone deve conter 8 ou 9 dígitos numéricos.');
      }

      if (telefonePrincipal && telefonePrincipal.uuid) {
        await this.repositorioTelefone.atualizar({
          ...telefonePrincipal,
          idTipoTelefone: ServicoClientes.mapearTipoTelefone(dados.telefone.tipo),
          ddd: dddNormalizado,
          numero: numeroNormalizado,
        });
      } else {
        await this.repositorioTelefone.criar({
          idUsuario: usuarioNoBanco.id,
          idTipoTelefone: ServicoClientes.mapearTipoTelefone(dados.telefone.tipo),
          ddd: dddNormalizado,
          numero: numeroNormalizado,
          principal: true,
        });
      }
    }

    // 5. Atualizar endereços (se fornecidos no payload)
    if (dados.enderecos !== undefined) {
      const enderecosExistentes = await this.repositorioEndereco.buscarPorIdUsuario(usuarioNoBanco.id);

      await Promise.all(
        enderecosExistentes
          .filter((end) => end.uuid)
          .map((end) => this.repositorioEndereco.deletar(usuarioNoBanco.id, end.uuid!)),
      );

      if (Array.isArray(dados.enderecos)) {
        await Promise.all(
          dados.enderecos.map((endereco, i) => this.criarEndereco(usuarioNoBanco.id, endereco, 'entrega', i === 0)),
        );
      }
    }

    return this.obterPerfil(uuid);
  }

  /**
   * Adiciona um novo endereço de entrega ou cobrança ao cliente. (RF0026)
   */
  public async adicionarEndereco(
    uuid: string,
    dados: IEnderecoDto & { tipoEndereco?: 'cobranca' | 'entrega' },
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) throw new Error('Usuário não encontrado.');

    return this.criarEndereco(usuario.id, dados, dados.tipoEndereco || 'entrega', false);
  }

  /**
   * Remove um endereço pelo UUID do endereço, validando o dono.
   */
  public async removerEndereco(uuidUsuario: string, uuidEndereco: string): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new Error('Usuário não encontrado.');

    const todosEnderecos = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecoExistente = todosEnderecos.find((e) => e.uuid === uuidEndereco);

    if (!enderecoExistente) {
      throw new Error('Endereço não encontrado.');
    }

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
    let telefonePrincipal = telefones.find((telefone) => telefone.principal) ?? telefones[0];

    // Fallback para dsc_telefone se a tabela normalizada estiver vazia
    if (!telefonePrincipal && usuario.telefone) {
      telefonePrincipal = {
        id: 0,
        uuid: '',
        idUsuario: usuario.id,
        idTipoTelefone: 1, // Celular
        ddd: '',
        numero: usuario.telefone,
        principal: true,
      };
    }

    // Buscar endereços
    const enderecosUsuario = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecosDto = await this.converterEnderecosParaDto(enderecosUsuario);

    // Buscar cartões
    const cartoesUsuario = await this.repositorioCartoes.buscarPorUsuario(usuario.id);
    const cartoesDto: ICartaoDto[] = cartoesUsuario.map((c) => ({
      uuid: c.uuid,
      final: c.finalCartao,
      nomeImpresso: c.nomeImpresso,
      bandeira: c.bandeira || 'Outra',
      validade: c.validade.toISOString().substring(0, 7),
      principal: c.principal,
    }));

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      emailMascarado: ServicoClientes.mascararEmail(usuario.email),
      cpf: usuario.cpf,
      cpfMascarado: ServicoClientes.mascararCpf(usuario.cpf),
      genero: perfil?.genero,
      dataNascimento: perfil?.dataNascimento ? perfil.dataNascimento.toISOString().split('T')[0] : undefined, // Formato YYYY-MM-DD
      telefone: telefonePrincipal ? ServicoClientes.converterTelefoneParaDto(telefonePrincipal) : undefined,
      enderecos: enderecosDto,
      cartoes: cartoesDto,
    };
  }

  /**
   * Converte telefone do banco para DTO.
   */
  private static converterTelefoneParaDto(telefone: ITelefoneUsuario): ITelefoneDto {
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
    return Promise.all(
      enderecos.map(async (endereco) => {
        // Buscar informações relacionadas (cidade, bairro, etc.) em paralelo para cada endereço
        const [cidade, bairro, cep, pais, tipoResidencia, logradouro] = await Promise.all([
          this.obterCidadePorId(endereco.idCidade),
          this.obterBairroPorId(endereco.idBairro),
          this.obterCepPorId(endereco.idCep),
          this.obterPaisPorId(endereco.idPais),
          this.obterTipoResidenciaPorId(endereco.idTipoResidencia),
          this.obterLogradouroPorId(endereco.idLogradouro),
        ]);

        return {
          uuid: endereco.uuid,
          apelido: endereco.apelido || (endereco.principal ? 'Principal' : `Endereço ${endereco.id}`),
          tipoResidencia: (tipoResidencia?.dscTipoResidencia as string) || 'Casa',
          tipoLogradouro: (logradouro?.tipoLogradouro as string) || 'Rua',
          logradouro: (logradouro?.dscLogradouro as string) || '',
          numero: (logradouro?.numLogradouro as string) || '',
          complemento: endereco.complemento,
          bairro: (bairro?.dscBairro as string) || '',
          cep: (cep?.numCep as string) || '',
          cidade: (cidade?.dscCidade as string) || '',
          estado: (cidade?.dscEstado as string) || '',
          pais: (pais?.dscPais as string) || 'Brasil',
        };
      }),
    );
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

  /**
   * Edita um endereço de um cliente (PATCH). (RF0026)
   */
  public async editarEndereco(
    uuidUsuario: string,
    uuidEndereco: string,
    dados: Partial<IEnderecoDto>,
  ): Promise<IEnderecoDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuidUsuario);
    if (!usuario) throw new Error('Usuário não encontrado.');

    const todosEnderecos = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecoExistente = todosEnderecos.find((e) => e.uuid === uuidEndereco);

    if (!enderecoExistente) {
      throw new Error('Endereço não encontrado.');
    }

    // Para manter dados não enviados, precisamos converter o endereço do banco para o estado atual do DTO
    const [dtoAtual] = await this.converterEnderecosParaDto([enderecoExistente]);

    if (dados.apelido !== undefined) enderecoExistente.apelido = dados.apelido;

    if (dados.cidade !== undefined || dados.estado !== undefined) {
      const cidade = dados.cidade || dtoAtual.cidade;
      const estado = dados.estado || dtoAtual.estado;
      enderecoExistente.idCidade = await this.obterOuCriarCidade(cidade, estado);
    }

    if (dados.bairro !== undefined) {
      enderecoExistente.idBairro = await this.obterOuCriarBairro(dados.bairro, enderecoExistente.idCidade);
    }

    if (dados.cep !== undefined) {
      enderecoExistente.idCep = await this.obterOuCriarCep(dados.cep, enderecoExistente.idCidade, enderecoExistente.idBairro);
    }

    if (dados.logradouro !== undefined || dados.numero !== undefined) {
      const logradouro = dados.logradouro || dtoAtual.logradouro;
      const numero = dados.numero || dtoAtual.numero;
      const tipoLogradouro = dados.tipoLogradouro || dtoAtual.tipoLogradouro || 'Rua';
      enderecoExistente.idLogradouro = await this.obterOuCriarLogradouro(tipoLogradouro, logradouro, numero);
    }

    if (dados.complemento !== undefined) enderecoExistente.complemento = dados.complemento;
    
    if (dados.pais !== undefined) {
      enderecoExistente.idPais = ServicoClientes.obterOuCriarPais(dados.pais);
    }

    if (dados.tipoResidencia !== undefined) {
      enderecoExistente.idTipoResidencia = await ServicoClientes.obterIdTipoResidencia(this.db, dados.tipoResidencia);
    }

    await this.repositorioEndereco.atualizar(enderecoExistente);

    const dtos = await this.converterEnderecosParaDto([enderecoExistente]);
    return dtos[0];
  }
}

