import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IUsuario } from '@/modules/usuarios/IUsuario.entity';
import {
  IAtualizarClienteDto,
  IEnderecoDto,
} from '@/modules/clientes/Iclientes.dto';
import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
import { ClientesUtils } from './clientesUtils.service';
import { ClientesEnderecoService } from './clientesEndereco.service';

function parsearDataNascimentoSomenteData(valor: string): Date {
  const partes = valor.trim().split('-').map(Number);
  if (partes.length !== 3 || partes.some((n) => !Number.isFinite(n))) {
    throw new Error('Data de nascimento inválida.');
  }
  const [ano, mes, dia] = partes;
  return new Date(ano, mes - 1, dia);
}

export class ClientesAtualizacaoService {
  constructor(
    private readonly repositorioUsuarios: IRepositorioUsuarios,
    private readonly repositorioPerfil: IRepositorioPerfilCliente,
    private readonly repositorioTelefone: IRepositorioTelefoneUsuario,
    private readonly repositorioEndereco: IRepositorioEnderecoUsuario,
    private readonly servicoEndereco: ClientesEnderecoService,
  ) {}

  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    const usuarioNoBanco = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuarioNoBanco) {
      throw new Error('Usuário não encontrado.');
    }

    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(usuarioNoBanco.id);
    const telefonePrincipal = telefonesExistentes.find((t) => t.principal) || telefonesExistentes[0];

    const alteracoes = ClientesAtualizacaoService.identificarAlteracoesCriticas(usuarioNoBanco, telefonePrincipal, dados);

    if (alteracoes.critica) {
      await this.validarSenhaConfirmacao(usuarioNoBanco, dados.senhaConfirmacao, uuid, alteracoes.email, dados.email);
    }

    await this.processarAtualizacaoDadosBasicos(uuid, dados, alteracoes);
    await this.processarAtualizacaoPerfil(usuarioNoBanco.id, dados);
    await this.processarAtualizacaoTelefone(usuarioNoBanco.id, telefonePrincipal, dados, alteracoes.telefone);
    await this.processarAtualizacaoEnderecos(usuarioNoBanco.id, dados.enderecos);
  }

  private static identificarAlteracoesCriticas(
    usuario: IUsuario,
    telefonePrincipal: ITelefoneUsuario | undefined,
    dados: IAtualizarClienteDto,
  ) {
    const email = ClientesAtualizacaoService.foiAlterado(dados.email, usuario.email);
    const cpf = ClientesAtualizacaoService.foiAlterado(dados.cpf, usuario.cpf);
    const telefone = ClientesAtualizacaoService.foiAlterado(dados.telefone?.numero, telefonePrincipal?.numero);

    return { email, cpf, telefone, critica: email || cpf || telefone };
  }

  private static foiAlterado(novo: string | undefined, atual: string | undefined): boolean {
    if (novo === undefined || novo === atual) return false;
    return !novo.includes('*');
  }

  private async validarSenhaConfirmacao(
    usuario: IUsuario,
    senhaConfirmacao: string | undefined,
    uuid: string,
    alterandoEmail: boolean,
    novoEmail: string | undefined,
  ) {
    if (!senhaConfirmacao) {
      throw new Error('Senha de confirmação é obrigatória para alterar E-mail, CPF ou Telefone.');
    }
    const senhaValida = await bcrypt.compare(senhaConfirmacao, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Senha de confirmação inválida.');
    }

    if (alterandoEmail && novoEmail) {
      const existente = await this.repositorioUsuarios.buscarPorEmail(novoEmail);
      if (existente && existente.uuid !== uuid) {
        throw new Error('Este e-mail já está em uso por outro usuário.');
      }
    }
  }

  private async processarAtualizacaoDadosBasicos(
    uuid: string,
    dados: IAtualizarClienteDto,
    alteracoes: { email: boolean; cpf: boolean; telefone: boolean },
  ) {
    const payload: Partial<IUsuario> = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (alteracoes.email) payload.email = dados.email;
    if (alteracoes.cpf) payload.cpf = dados.cpf;
    if (alteracoes.telefone && dados.telefone) payload.telefoneRapido = dados.telefone.numero;

    if (Object.keys(payload).length > 0) {
      const ok = await this.repositorioUsuarios.atualizarUsuario(uuid, payload);
      if (!ok) throw new Error('Erro ao atualizar dados básicos do usuário.');
    }
  }

  private async processarAtualizacaoPerfil(idUsuario: number, dados: IAtualizarClienteDto) {
    if (dados.genero === undefined && dados.dataNascimento === undefined) return;

    const perfilExistente = await this.repositorioPerfil.buscarPorIdUsuario(idUsuario);
    const perfil: IPerfilCliente = {
      idUsuario,
      genero: dados.genero !== undefined ? dados.genero : perfilExistente?.genero,
      dataNascimento:
        dados.dataNascimento !== undefined
          ? parsearDataNascimentoSomenteData(dados.dataNascimento)
          : perfilExistente?.dataNascimento,
    };

    if (perfilExistente) {
      await this.repositorioPerfil.atualizar(perfil);
    } else {
      await this.repositorioPerfil.criar(perfil);
    }
  }

  private async processarAtualizacaoTelefone(
    idUsuario: number,
    principal: ITelefoneUsuario | undefined,
    dados: IAtualizarClienteDto,
    alterando: boolean,
  ) {
    if (!alterando || !dados.telefone) return;

    const numero = ClientesUtils.normalizarDigitos(dados.telefone.numero);

    if (numero.length < 10 || numero.length > 11) throw new Error('Telefone deve ter 10 ou 11 dígitos (DDD + número).');

    const payload = {
      idTipoTelefone: ClientesUtils.mapearTipoTelefone(dados.telefone.tipo),
      numero,
    };

    if (principal?.uuid) {
      await this.repositorioTelefone.atualizar({ ...principal, ...payload });
    } else {
      await this.repositorioTelefone.criar({ idUsuario, ...payload, principal: true });
    }
  }

  private async processarAtualizacaoEnderecos(idUsuario: number, enderecos?: IEnderecoDto[]) {
    if (enderecos === undefined) return;

    const existentes = await this.repositorioEndereco.buscarPorIdUsuario(idUsuario);
    await Promise.all(
      existentes.filter((e) => e.uuid).map((e) => this.repositorioEndereco.deletar(idUsuario, e.uuid!)),
    );

    if (Array.isArray(enderecos)) {
      await Promise.all(enderecos.map((e, i) => this.servicoEndereco.criarEndereco(idUsuario, e, 'entrega', i === 0)));
    }
  }
}
