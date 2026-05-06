import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IEnderecoDto } from '@/modules/clientes/Iclientes.dto';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';
import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { IRowIdSimples } from '@/shared/types/db-rows.types';
import { GestaoEnderecoLeituras } from '@/modules/clientes/gestaoIdentidadeClienteEndereco.leituras';
import { mapearEnderecoUsuarioParaDto } from '@/modules/clientes/gestaoIdentidadeClienteEndereco.dto.mapper';

type RefEnderecoUsuario = { current: IEnderecoUsuario };

/**
 * Resolução de logradouros, CEP e persistência de endereços do cliente.
 */
export class GestaoEnderecoCliente {
  private readonly leituras: GestaoEnderecoLeituras;

  constructor(
    private readonly db: IConexaoBanco,
    private readonly repositorioEndereco: IRepositorioEnderecoUsuario,
  ) {
    this.leituras = new GestaoEnderecoLeituras(db);
  }

  public static async obterIdTipoResidencia(db: IConexaoBanco, descricao: string): Promise<number> {
    const query = `SELECT tre_id FROM tipos_residencias WHERE tre_descricao ILIKE $1 LIMIT 1`;
    const result = await db.executar<IRowIdSimples>(query, [descricao]);
    return result.length > 0 ? Number(result[0].tre_id) : 1;
  }

  public static async obterIdTipoLogradouro(db: IConexaoBanco, descricao: string): Promise<number> {
    const query = `SELECT tlo_id FROM tipos_logradouros WHERE tlo_descricao ILIKE $1 LIMIT 1`;
    const result = await db.executar<IRowIdSimples>(query, [descricao]);
    return result.length > 0 ? Number(result[0].tlo_id) : 1;
  }

  public static obterOuCriarPais(_pais: string): number {
    return 1;
  }

  private async obterOuCriarLogradouro(tipoLogradouro: string, nomeLogradouro: string): Promise<number> {
    const queryBuscar = `
      SELECT l.log_id
      FROM logradouros l
      JOIN tipos_logradouros tl ON l.tlo_id = tl.tlo_id
      WHERE tl.tlo_descricao ILIKE $1 AND l.log_nome = $2
    `;
    const existente = await this.db.executar<IRowIdSimples>(queryBuscar, [tipoLogradouro, nomeLogradouro]);
    if (existente.length > 0) {
      return Number(existente[0].log_id);
    }
    const idTipoLogradouro = await GestaoEnderecoCliente.obterIdTipoLogradouro(this.db, tipoLogradouro);
    const queryInserir = `
      INSERT INTO logradouros (tlo_id, log_nome)
      VALUES ($1, $2)
      RETURNING log_id
    `;
    const novo = await this.db.executar<IRowIdSimples>(queryInserir, [idTipoLogradouro, nomeLogradouro]);
    return Number(novo[0].log_id);
  }

  public async garantirLocalidade(cidade: string, siglaEstado: string): Promise<number> {
    const queryEstado = `SELECT est_id FROM estados WHERE est_sigla = $1 LIMIT 1`;
    const estadoResult = await this.db.executar<IRowIdSimples>(queryEstado, [siglaEstado.toUpperCase().trim()]);
    const idEstado = estadoResult.length > 0 ? Number(estadoResult[0].est_id) : null;
    const query = `SELECT cid_id FROM cidades WHERE cid_nome_norm = UPPER(TRIM($1)) AND (est_id = $2 OR $2 IS NULL) LIMIT 1`;
    const existente = await this.db.executar<IRowIdSimples>(query, [cidade, idEstado]);
    if (existente.length > 0) {
      return Number(existente[0].cid_id);
    }
    const insertQuery = `INSERT INTO cidades (cid_nome, cid_nome_norm, est_id) VALUES ($1::varchar, UPPER(TRIM($1::varchar)), $2) RETURNING cid_id`;
    const novo = await this.db.executar<IRowIdSimples>(insertQuery, [cidade, idEstado]);
    return Number(novo[0].cid_id);
  }

  public async obterOuCriarBairro(bairro: string, idCidade: number): Promise<number> {
    const query = `SELECT bai_id FROM bairros WHERE bai_nome_norm = UPPER(TRIM($1)) AND cid_id = $2 LIMIT 1`;
    const existente = await this.db.executar<IRowIdSimples>(query, [bairro, idCidade]);
    if (existente.length > 0) {
      return Number(existente[0].bai_id);
    }
    const insertQuery = `INSERT INTO bairros (bai_nome, bai_nome_norm, cid_id) VALUES ($1::varchar, UPPER(TRIM($1::varchar)), $2) RETURNING bai_id`;
    const novo = await this.db.executar<IRowIdSimples>(insertQuery, [bairro, idCidade]);
    return Number(novo[0].bai_id);
  }

  public async obterOuCriarCep(cep: string, idCidade: number, idBairro: number): Promise<number> {
    const cepLimpo = cep.replace(/\D/g, '');
    const query = `SELECT cep_id FROM ceps WHERE cep_numero = $1 LIMIT 1`;
    const existente = await this.db.executar<IRowIdSimples>(query, [cepLimpo]);
    if (existente.length > 0) {
      return Number(existente[0].cep_id);
    }
    try {
      const insertQuery = `INSERT INTO ceps (cep_numero, cid_id, bai_id) VALUES ($1, $2, $3) RETURNING cep_id`;
      const novo = await this.db.executar<IRowIdSimples>(insertQuery, [cepLimpo, idCidade, idBairro]);
      return Number(novo[0].cep_id);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const error = err as { message: string; code?: string };
        if (error.message.includes('unique constraint') || error.code === '23505') {
          const queryRebusca = `SELECT cep_id FROM ceps WHERE cep_numero = $1 LIMIT 1`;
          const rebuasca = await this.db.executar<IRowIdSimples>(queryRebusca, [cepLimpo]);
          return Number(rebuasca[0].cep_id);
        }
      }
      throw err;
    }
  }

  public async converterEnderecosParaDto(enderecos: IEnderecoUsuario[]): Promise<IEnderecoDto[]> {
    return Promise.all(enderecos.map((e) => mapearEnderecoUsuarioParaDto(this.leituras, e)));
  }

  public async criarEndereco(
    idUsuario: number,
    enderecoDto: IEnderecoDto,
    tipo: 'cobranca' | 'entrega',
    principal: boolean = false,
  ): Promise<IEnderecoDto> {
    const idTipoResidencia = await GestaoEnderecoCliente.obterIdTipoResidencia(
      this.db,
      enderecoDto.tipoResidencia || 'Casa',
    );
    const idLogradouro = await this.obterOuCriarLogradouro(
      enderecoDto.tipoLogradouro || 'Rua',
      enderecoDto.logradouro,
    );
    const idCidade = await this.garantirLocalidade(enderecoDto.cidade, enderecoDto.estado);
    const idBairro = await this.obterOuCriarBairro(enderecoDto.bairro, idCidade);
    const idCep = await this.obterOuCriarCep(enderecoDto.cep, idCidade, idBairro);
    const idPais = GestaoEnderecoCliente.obterOuCriarPais(enderecoDto.pais || 'Brasil');
    const enderecosAtuais = await this.repositorioEndereco.buscarPorIdUsuario(idUsuario);
    if (enderecosAtuais.length >= 5) {
      throw new Error('Limite de 5 endereços atingido. Você só pode atualizar os endereços existentes.');
    }
    const endereco: IEnderecoUsuario = {
      idUsuario,
      tipo,
      apelido: enderecoDto.apelido,
      idPais,
      idTipoResidencia,
      idLogradouro,
      numero: enderecoDto.numero,
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

  private static aplicarApelidoSeInformado(ref: RefEnderecoUsuario, dados: Partial<IEnderecoDto>): void {
    if (dados.apelido !== undefined) {
      // eslint-disable-next-line no-param-reassign
      ref.current.apelido = dados.apelido;
    }
  }

  private async aplicarCidadeEstadoSeInformado(
    ref: RefEnderecoUsuario,
    dtoAtual: IEnderecoDto,
    dados: Partial<IEnderecoDto>,
  ): Promise<void> {
    if (dados.cidade === undefined && dados.estado === undefined) {
      return;
    }
    const cidade = dados.cidade ?? dtoAtual.cidade;
    const estado = dados.estado ?? dtoAtual.estado;
    // eslint-disable-next-line no-param-reassign
    ref.current.idCidade = await this.garantirLocalidade(cidade, estado);
  }

  private async aplicarBairroSeInformado(ref: RefEnderecoUsuario, dados: Partial<IEnderecoDto>): Promise<void> {
    if (dados.bairro === undefined) {
      return;
    }
    // eslint-disable-next-line no-param-reassign
    ref.current.idBairro = await this.obterOuCriarBairro(dados.bairro, ref.current.idCidade);
  }

  private async aplicarCepSeInformado(ref: RefEnderecoUsuario, dados: Partial<IEnderecoDto>): Promise<void> {
    if (dados.cep === undefined) {
      return;
    }
    // eslint-disable-next-line no-param-reassign
    ref.current.idCep = await this.obterOuCriarCep(dados.cep, ref.current.idCidade, ref.current.idBairro);
  }

  private async aplicarLogradouroENumeroSeInformado(
    ref: RefEnderecoUsuario,
    dtoAtual: IEnderecoDto,
    dados: Partial<IEnderecoDto>,
  ): Promise<void> {
    if (dados.logradouro === undefined && dados.numero === undefined) {
      return;
    }
    const logradouro = dados.logradouro ?? dtoAtual.logradouro;
    const numero = dados.numero ?? dtoAtual.numero;
    const tipoLogradouro = dados.tipoLogradouro ?? dtoAtual.tipoLogradouro ?? 'Rua';
    // eslint-disable-next-line no-param-reassign
    ref.current.idLogradouro = await this.obterOuCriarLogradouro(tipoLogradouro, logradouro);
    // eslint-disable-next-line no-param-reassign
    ref.current.numero = numero;
  }

  private static aplicarComplementoSeInformado(ref: RefEnderecoUsuario, dados: Partial<IEnderecoDto>): void {
    if (dados.complemento !== undefined) {
      // eslint-disable-next-line no-param-reassign
      ref.current.complemento = dados.complemento;
    }
  }

  private static aplicarPaisSeInformado(ref: RefEnderecoUsuario, dados: Partial<IEnderecoDto>): void {
    if (dados.pais !== undefined) {
      // eslint-disable-next-line no-param-reassign
      ref.current.idPais = GestaoEnderecoCliente.obterOuCriarPais(dados.pais);
    }
  }

  private async aplicarTipoResidenciaSeInformado(
    ref: RefEnderecoUsuario,
    dados: Partial<IEnderecoDto>,
  ): Promise<void> {
    if (dados.tipoResidencia === undefined) {
      return;
    }
    // eslint-disable-next-line no-param-reassign
    ref.current.idTipoResidencia = await GestaoEnderecoCliente.obterIdTipoResidencia(this.db, dados.tipoResidencia);
  }

  public async editarEndereco(
    usuario: IUsuario,
    uuidEndereco: string,
    dados: Partial<IEnderecoDto>,
  ): Promise<IEnderecoDto> {
    const todosEnderecos = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecoExistente = todosEnderecos.find((e) => e.uuid === uuidEndereco);
    if (!enderecoExistente) {
      throw new Error('Endereço não encontrado.');
    }
    const [dtoAtual] = await this.converterEnderecosParaDto([enderecoExistente]);
    const ref: RefEnderecoUsuario = { current: enderecoExistente };
    GestaoEnderecoCliente.aplicarApelidoSeInformado(ref, dados);
    await this.aplicarCidadeEstadoSeInformado(ref, dtoAtual, dados);
    await this.aplicarBairroSeInformado(ref, dados);
    await this.aplicarCepSeInformado(ref, dados);
    await this.aplicarLogradouroENumeroSeInformado(ref, dtoAtual, dados);
    GestaoEnderecoCliente.aplicarComplementoSeInformado(ref, dados);
    GestaoEnderecoCliente.aplicarPaisSeInformado(ref, dados);
    await this.aplicarTipoResidenciaSeInformado(ref, dados);
    await this.repositorioEndereco.atualizar(ref.current);
    const dtos = await this.converterEnderecosParaDto([ref.current]);
    return dtos[0];
  }
}
