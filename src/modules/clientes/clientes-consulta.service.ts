import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import {
  IPerfilClienteDto,
  ICartaoDto,
} from '@/modules/clientes/Iclientes.dto';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ClientesUtils } from './clientes-utils.service';
import { ClientesEnderecoService } from './clientes-endereco.service';

export class ClientesConsultaService {
  constructor(
    private readonly repositorioUsuarios: IRepositorioUsuarios,
    private readonly repositorioPerfil: IRepositorioPerfilCliente,
    private readonly repositorioTelefone: IRepositorioTelefoneUsuario,
    private readonly repositorioEndereco: IRepositorioEnderecoUsuario,
    private readonly repositorioCartoes: IRepositorioCartaoUsuario,
    private readonly db: IConexaoBanco,
    private readonly servicoEndereco: ClientesEnderecoService,
  ) {}

  public async obterPerfil(uuid: string): Promise<IPerfilClienteDto> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const perfil = await this.repositorioPerfil.buscarPorIdUsuario(usuario.id);

    // Buscar telefone principal
    const telefones = await this.repositorioTelefone.buscarPorIdUsuario(usuario.id);
    let telefonePrincipal = telefones.find((telefone) => telefone.principal) ?? telefones[0];

    // Fallback para telefoneRapido se a tabela normalizada estiver vazia
    if (!telefonePrincipal && usuario.telefoneRapido) {
      telefonePrincipal = {
        id: 0,
        uuid: '',
        idUsuario: usuario.id,
        idTipoTelefone: 1, // Celular
        ddd: '',
        numero: usuario.telefoneRapido,
        principal: true,
      };
    }

    // Buscar endereços
    const enderecosUsuario = await this.repositorioEndereco.buscarPorIdUsuario(usuario.id);
    const enderecosDto = await this.servicoEndereco.converterEnderecosParaDto(enderecosUsuario);

    // Buscar cartões
    const cartoesUsuario = await this.repositorioCartoes.buscarPorUsuario(usuario.id);
    const cartoesDto: ICartaoDto[] = cartoesUsuario.map((c) => ({
      uuid: c.uuid,
      ultimosDigitosCartao: c.ultimosDigitosCartao,
      nomeImpresso: c.nomeImpresso,
      bandeira: c.bandeira || 'Outra',
      validade: c.validade.toISOString().substring(0, 7),
      principal: c.principal,
    }));

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      emailMascarado: ClientesUtils.mascararEmail(usuario.email),
      cpf: usuario.cpf,
      cpfMascarado: ClientesUtils.mascararCpf(usuario.cpf),
      genero: perfil?.genero,
      dataNascimento: perfil?.dataNascimento ? perfil.dataNascimento.toISOString().split('T')[0] : undefined, // Formato YYYY-MM-DD
      telefone: telefonePrincipal ? ClientesUtils.converterTelefoneParaDto(telefonePrincipal) : undefined,
      enderecos: enderecosDto,
      cartoes: cartoesDto,
    };
  }
}
