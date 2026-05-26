import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IEnderecoDto } from '@/modules/clientes/Iclientes.dto';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';
import { ClientesUtils } from './clientesUtils.service';

export class ClientesEnderecoService {
  constructor(
    private readonly repositorioEndereco: IRepositorioEnderecoUsuario,
    private readonly db: IConexaoBanco,
  ) {}

  public async criarEndereco(
    idUsuario: number,
    enderecoDto: IEnderecoDto,
    tipo: 'cobranca' | 'entrega',
    principal: boolean = false,
  ): Promise<IEnderecoDto> {
    const idTipoResidencia = await ClientesUtils.obterIdTipoResidencia(this.db, enderecoDto.tipoResidencia || 'Casa');
    const idLogradouro = await ClientesUtils.obterOuCriarLogradouro(
      this.db,
      enderecoDto.tipoLogradouro || 'Rua',
      enderecoDto.logradouro,
    );
    const idCidade = await ClientesUtils.garantirLocalidade(this.db, enderecoDto.cidade, enderecoDto.estado);
    const idBairro = await ClientesUtils.obterOuCriarBairro(this.db, enderecoDto.bairro, idCidade);
    const idCep = await ClientesUtils.obterOuCriarCep(this.db, enderecoDto.cep, idCidade, idBairro);
    const idPais = ClientesUtils.obterOuCriarPais(enderecoDto.pais || 'Brasil');

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

  public async converterEnderecosParaDto(enderecos: IEnderecoUsuario[]): Promise<IEnderecoDto[]> {
    return Promise.all(enderecos.map((e) => this.mapearEnderecoEntidadeParaDto(e)));
  }

  private async mapearEnderecoEntidadeParaDto(endereco: IEnderecoUsuario): Promise<IEnderecoDto> {
    const [cidade, bairro, cep, pais, tipoResidencia, logradouro] = await Promise.all([
      ClientesUtils.obterCidadePorId(this.db, endereco.idCidade),
      ClientesUtils.obterBairroPorId(this.db, endereco.idBairro),
      ClientesUtils.obterCepPorId(this.db, String(endereco.idCep)),
      ClientesUtils.obterPaisPorId(this.db, endereco.idPais),
      ClientesUtils.obterTipoResidenciaPorId(this.db, endereco.idTipoResidencia),
      ClientesUtils.obterLogradouroPorId(this.db, endereco.idLogradouro),
    ]);

    return {
      uuid: endereco.uuid,
      apelido: endereco.apelido || (endereco.principal ? 'Principal' : `Endereço ${endereco.id}`),
      tipoResidencia: tipoResidencia?.dscTipoResidencia || 'Casa',
      tipoLogradouro: logradouro?.tipoLogradouro || 'Rua',
      logradouro: logradouro?.dscLogradouro || '',
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: bairro?.dscBairro || '',
      cep: cep?.numCep || '',
      cidade: cidade?.dscCidade || '',
      estado: cidade?.dscEstado || '',
      pais: pais?.dscPais || 'Brasil',
    };
  }

  public async editarEndereco(
    idUsuario: number,
    uuidEndereco: string,
    dados: Partial<IEnderecoDto>,
  ): Promise<IEnderecoDto> {
    const todosEnderecos = await this.repositorioEndereco.buscarPorIdUsuario(idUsuario);
    const enderecoExistente = todosEnderecos.find((e) => e.uuid === uuidEndereco);
    if (!enderecoExistente) throw new Error('Endereço não encontrado.');

    const [dtoAtual] = await this.converterEnderecosParaDto([enderecoExistente]);
    const enderecoAtualizado = await this.aplicarAlteracoesEndereco(enderecoExistente, dados, dtoAtual);
    await this.repositorioEndereco.atualizar(enderecoAtualizado);

    const [dtoFinal] = await this.converterEnderecosParaDto([enderecoAtualizado]);
    return dtoFinal;
  }

  private async aplicarAlteracoesEndereco(
    existente: IEnderecoUsuario,
    novos: Partial<IEnderecoDto>,
    atual: IEnderecoDto,
  ): Promise<IEnderecoUsuario> {
    let alvo = { ...existente };
    if (novos.apelido !== undefined) alvo.apelido = novos.apelido;
    if (novos.complemento !== undefined) alvo.complemento = novos.complemento;

    alvo = await this.sincronizarLocalidadeEndereco(alvo, novos, atual);
    alvo = await this.sincronizarLogradouroEndereco(alvo, novos, atual);

    if (novos.pais !== undefined) {
      alvo.idPais = ClientesUtils.obterOuCriarPais(novos.pais);
    }
    if (novos.tipoResidencia !== undefined) {
      alvo.idTipoResidencia = await ClientesUtils.obterIdTipoResidencia(this.db, novos.tipoResidencia);
    }
    return alvo;
  }

  private async sincronizarLocalidadeEndereco(
    alvo: IEnderecoUsuario,
    novos: Partial<IEnderecoDto>,
    atual: IEnderecoDto,
  ): Promise<IEnderecoUsuario> {
    const next = { ...alvo };
    if (novos.cidade !== undefined || novos.estado !== undefined) {
      next.idCidade = await ClientesUtils.garantirLocalidade(
        this.db,
        novos.cidade || atual.cidade,
        novos.estado || atual.estado,
      );
    }
    if (novos.bairro !== undefined) {
      next.idBairro = await ClientesUtils.obterOuCriarBairro(this.db, novos.bairro, next.idCidade);
    }
    if (novos.cep !== undefined) {
      next.idCep = await ClientesUtils.obterOuCriarCep(this.db, novos.cep, next.idCidade, next.idBairro);
    }
    return next;
  }

  private async sincronizarLogradouroEndereco(
    alvo: IEnderecoUsuario,
    novos: Partial<IEnderecoDto>,
    atual: IEnderecoDto,
  ): Promise<IEnderecoUsuario> {
    const next = { ...alvo };
    if (novos.logradouro !== undefined || novos.numero !== undefined) {
      const logradouro = novos.logradouro || atual.logradouro;
      const numero = novos.numero || atual.numero;
      const tipo = novos.tipoLogradouro || atual.tipoLogradouro || 'Rua';
      next.idLogradouro = await ClientesUtils.obterOuCriarLogradouro(this.db, tipo, logradouro);
      next.numero = numero;
    }
    return next;
  }
}
