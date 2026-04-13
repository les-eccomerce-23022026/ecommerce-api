import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import {
  ICriarClienteDto,
  IAtualizarClienteDto,
  IPerfilClienteDto,
} from '@/modules/clientes/Iclientes.dto';
import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { GestaoEnderecoCliente } from '@/modules/clientes/gestao-identidade-cliente-endereco.service';
import { mapearTipoTelefone, normalizarDigitos } from '@/modules/clientes/gestao-identidade-cliente-texto.util';
import { realizarCadastroPublicoCliente } from '@/modules/clientes/gestao-identidade-cliente-cadastro-publico.util';

type DepsOperacoes = {
  repositorioUsuarios: IRepositorioUsuarios;
  repositorioPerfil: IRepositorioPerfilCliente;
  repositorioTelefone: IRepositorioTelefoneUsuario;
  repositorioEndereco: IRepositorioEnderecoUsuario;
  endereco: GestaoEnderecoCliente;
  obterPerfil: (uuid: string) => Promise<IPerfilClienteDto>;
};

export class GestaoIdentidadeClienteOperacoes {
  constructor(private readonly deps: DepsOperacoes) {}

  public async realizarCadastroPublico(dados: ICriarClienteDto) {
    const { repositorioUsuarios, repositorioPerfil, repositorioTelefone, repositorioEndereco, endereco } = this.deps;
    return realizarCadastroPublicoCliente(
      { repositorioUsuarios, repositorioPerfil, repositorioTelefone, repositorioEndereco, endereco },
      dados,
    );
  }

  public async atualizarCliente(uuid: string, dados: IAtualizarClienteDto) {
    const usuarioNoBanco = await this.deps.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuarioNoBanco) {
      throw new Error('Usuário não encontrado.');
    }
    const flags = await this.resolverFlagsAlteracaoCritica(usuarioNoBanco, dados);
    await this.exigirSenhaSeCritico(flags, dados, usuarioNoBanco);
    await this.aplicarPayloadUsuario(uuid, usuarioNoBanco, dados, flags);
    await this.aplicarPerfil(usuarioNoBanco, dados);
    await this.aplicarTelefone(usuarioNoBanco, dados, flags);
    await this.aplicarEnderecosSubstituicao(usuarioNoBanco, dados);
    return this.deps.obterPerfil(uuid);
  }

  private async resolverFlagsAlteracaoCritica(
    usuarioNoBanco: IUsuario,
    dados: IAtualizarClienteDto,
  ): Promise<{ alterandoEmail: boolean; alterandoCpf: boolean; alterandoTelefone: boolean }> {
    const alterandoEmail =
      dados.email !== undefined && dados.email !== usuarioNoBanco.email && !dados.email.includes('*');
    const alterandoCpf =
      dados.cpf !== undefined && dados.cpf !== usuarioNoBanco.cpf && !dados.cpf.includes('*');
    const telefonesExistentes = await this.deps.repositorioTelefone.buscarPorIdUsuario(usuarioNoBanco.id);
    const telefonePrincipal = telefonesExistentes.find((t) => t.principal) || telefonesExistentes[0];
    const alterandoTelefone =
      dados.telefone !== undefined &&
      dados.telefone.numero !== telefonePrincipal?.numero &&
      !dados.telefone.numero.includes('*');
    return { alterandoEmail, alterandoCpf, alterandoTelefone };
  }

  private async garantirEmailDisponivelParaAlteracao(
    usuarioNoBanco: IUsuario,
    dados: IAtualizarClienteDto,
  ): Promise<void> {
    const existente = await this.deps.repositorioUsuarios.buscarPorEmail(dados.email!);
    if (existente && existente.uuid !== usuarioNoBanco.uuid) {
      throw new Error('Este e-mail já está em uso por outro usuário.');
    }
  }

  private async exigirSenhaSeCritico(
    flags: { alterandoEmail: boolean; alterandoCpf: boolean; alterandoTelefone: boolean },
    dados: IAtualizarClienteDto,
    usuarioNoBanco: IUsuario,
  ): Promise<void> {
    const { alterandoEmail, alterandoCpf, alterandoTelefone } = flags;
    if (!alterandoEmail && !alterandoCpf && !alterandoTelefone) {
      return;
    }
    if (!dados.senhaConfirmacao) {
      throw new Error('Senha de confirmação é obrigatória para alterar E-mail, CPF ou Telefone.');
    }
    const senhaValida = await bcrypt.compare(dados.senhaConfirmacao, usuarioNoBanco.senhaHash);
    if (!senhaValida) {
      throw new Error('Senha de confirmação inválida.');
    }
    if (alterandoEmail) {
      await this.garantirEmailDisponivelParaAlteracao(usuarioNoBanco, dados);
    }
  }

  private async aplicarPayloadUsuario(
    uuid: string,
    usuarioNoBanco: IUsuario,
    dados: IAtualizarClienteDto,
    flags: { alterandoEmail: boolean; alterandoCpf: boolean; alterandoTelefone: boolean },
  ): Promise<void> {
    const { alterandoEmail, alterandoCpf, alterandoTelefone } = flags;
    const payloadUsuario: Partial<IUsuario> = {};
    if (dados.nome !== undefined) payloadUsuario.nome = dados.nome;
    if (alterandoEmail) payloadUsuario.email = dados.email;
    if (alterandoCpf) payloadUsuario.cpf = dados.cpf;
    if (alterandoTelefone && dados.telefone) payloadUsuario.telefoneRapido = dados.telefone.numero;
    if (Object.keys(payloadUsuario).length === 0) {
      return;
    }
    const resultado = await this.deps.repositorioUsuarios.atualizarUsuario(uuid, payloadUsuario);
    if (!resultado) throw new Error('Erro ao atualizar dados básicos do usuário.');
  }

  private async aplicarPerfil(usuarioNoBanco: IUsuario, dados: IAtualizarClienteDto): Promise<void> {
    if (dados.genero === undefined && dados.dataNascimento === undefined) {
      return;
    }
    const perfilExistente = await this.deps.repositorioPerfil.buscarPorIdUsuario(usuarioNoBanco.id);
    const perfilAtualizado: IPerfilCliente = {
      idUsuario: usuarioNoBanco.id,
      genero: dados.genero !== undefined ? dados.genero : perfilExistente?.genero,
      dataNascimento:
        dados.dataNascimento !== undefined ? new Date(dados.dataNascimento) : perfilExistente?.dataNascimento,
    };
    if (perfilExistente) {
      await this.deps.repositorioPerfil.atualizar(perfilAtualizado);
    } else {
      await this.deps.repositorioPerfil.criar(perfilAtualizado);
    }
  }

  private async aplicarTelefone(
    usuarioNoBanco: IUsuario,
    dados: IAtualizarClienteDto,
    flags: { alterandoTelefone: boolean },
  ): Promise<void> {
    if (!flags.alterandoTelefone || !dados.telefone) {
      return;
    }
    const telefonesExistentes = await this.deps.repositorioTelefone.buscarPorIdUsuario(usuarioNoBanco.id);
    const telefonePrincipal = telefonesExistentes.find((t) => t.principal) || telefonesExistentes[0];
    const dddNormalizado = normalizarDigitos(dados.telefone.ddd);
    const numeroNormalizado = normalizarDigitos(dados.telefone.numero);
    if (dddNormalizado.length !== 2) {
      throw new Error('DDD deve conter exatamente 2 dígitos numéricos.');
    }
    if (numeroNormalizado.length < 8 || numeroNormalizado.length > 9) {
      throw new Error('Número de telefone deve conter 8 ou 9 dígitos numéricos.');
    }
    if (telefonePrincipal?.uuid) {
      await this.deps.repositorioTelefone.atualizar({
        ...telefonePrincipal,
        idTipoTelefone: mapearTipoTelefone(dados.telefone.tipo),
        ddd: dddNormalizado,
        numero: numeroNormalizado,
      });
      return;
    }
    await this.deps.repositorioTelefone.criar({
      idUsuario: usuarioNoBanco.id,
      idTipoTelefone: mapearTipoTelefone(dados.telefone.tipo),
      ddd: dddNormalizado,
      numero: numeroNormalizado,
      principal: true,
    });
  }

  private async aplicarEnderecosSubstituicao(
    usuarioNoBanco: IUsuario,
    dados: IAtualizarClienteDto,
  ): Promise<void> {
    if (dados.enderecos === undefined) {
      return;
    }
    const enderecosExistentes = await this.deps.repositorioEndereco.buscarPorIdUsuario(usuarioNoBanco.id);
    await Promise.all(
      enderecosExistentes
        .filter((end) => end.uuid)
        .map((end) => this.deps.repositorioEndereco.deletar(usuarioNoBanco.id, end.uuid!)),
    );
    if (Array.isArray(dados.enderecos)) {
      await Promise.all(
        dados.enderecos.map((endereco, i) =>
          this.deps.endereco.criarEndereco(usuarioNoBanco.id, endereco, 'entrega', i === 0),
        ),
      );
    }
  }
}
