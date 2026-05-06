import type { IEnderecoDto } from '@/modules/clientes/Iclientes.dto';
import type { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';
import type { GestaoEnderecoLeituras } from '@/modules/clientes/gestaoIdentidadeClienteEndereco.leituras';
import type {
  IRowBairro,
  IRowCep,
  IRowCidadeEstado,
  IRowLogradouroTipo,
  IRowPais,
  IRowTipoResidencia,
} from '@/shared/types/db-rows.types';

type BlocoEnderecoLido = {
  cidade: IRowCidadeEstado | null;
  bairro: IRowBairro | null;
  cep: IRowCep | null;
  pais: IRowPais | null;
  tipoResidencia: IRowTipoResidencia | null;
  logradouro: IRowLogradouroTipo | null;
};

function apelidoResolvido(endereco: IEnderecoUsuario): string {
  if (endereco.apelido) {
    return endereco.apelido;
  }
  if (endereco.principal) {
    return 'Principal';
  }
  return `Endereço ${endereco.id}`;
}

function dtoCamposLogradouroETipo(bloco: BlocoEnderecoLido): Pick<
  IEnderecoDto,
  'tipoResidencia' | 'tipoLogradouro' | 'logradouro'
> {
  const { tipoResidencia, logradouro } = bloco;
  return {
    tipoResidencia: tipoResidencia?.dscTipoResidencia ?? 'Casa',
    tipoLogradouro: logradouro?.tipoLogradouro ?? 'Rua',
    logradouro: logradouro?.dscLogradouro ?? '',
  };
}

function dtoCamposGeograficos(bloco: BlocoEnderecoLido): Pick<IEnderecoDto, 'bairro' | 'cep' | 'cidade' | 'estado' | 'pais'> {
  const { cidade, bairro, cep, pais } = bloco;
  return {
    bairro: bairro?.dscBairro ?? '',
    cep: cep?.numCep ?? '',
    cidade: cidade?.dscCidade ?? '',
    estado: cidade?.dscEstado ?? '',
    pais: pais?.dscPais ?? 'Brasil',
  };
}

function montarDtoComLinhas(endereco: IEnderecoUsuario, bloco: BlocoEnderecoLido): IEnderecoDto {
  return {
    uuid: endereco.uuid,
    apelido: apelidoResolvido(endereco),
    numero: endereco.numero,
    complemento: endereco.complemento,
    ...dtoCamposLogradouroETipo(bloco),
    ...dtoCamposGeograficos(bloco),
  };
}

export async function mapearEnderecoUsuarioParaDto(
  leituras: GestaoEnderecoLeituras,
  endereco: IEnderecoUsuario,
): Promise<IEnderecoDto> {
  const [cidade, bairro, cep, pais, tipoResidencia, logradouro] = await Promise.all([
    leituras.obterCidadePorId(endereco.idCidade),
    leituras.obterBairroPorId(endereco.idBairro),
    leituras.obterCepPorId(endereco.idCep),
    leituras.obterPaisPorId(endereco.idPais),
    leituras.obterTipoResidenciaPorId(endereco.idTipoResidencia),
    leituras.obterLogradouroPorId(endereco.idLogradouro),
  ]);
  return montarDtoComLinhas(endereco, { cidade, bairro, cep, pais, tipoResidencia, logradouro });
}
