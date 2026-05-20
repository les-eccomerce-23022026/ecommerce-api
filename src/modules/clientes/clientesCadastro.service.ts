import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import {
  ICriarClienteDto,
} from '@/modules/clientes/Iclientes.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { validarCpf } from '@/shared/utils/validacao-cpf.util';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';
import { ClientesUtils } from './clientesUtils.service';
import { ClientesEnderecoService } from './clientesEndereco.service';
import { limparDocumento } from '@/shared/validators/validadorDocumento';

export class ClientesCadastroService {
  constructor(
    private readonly repositorioUsuarios: IRepositorioUsuarios,
    private readonly repositorioPerfil: IRepositorioPerfilCliente,
    private readonly repositorioTelefone: IRepositorioTelefoneUsuario,
    private readonly servicoEndereco: ClientesEnderecoService,
  ) {}

  public async realizarCadastroPublico(dados: ICriarClienteDto) {
    // Normalizar CPF antes de validações para consistência com o banco
    const cpfNormalizado = dados.cpf ? limparDocumento(dados.cpf) : dados.cpf;
    const dadosNormalizados = { ...dados, cpf: cpfNormalizado };

    await this.validarDadosCadastro(dadosNormalizados);

    const senhaHash = await bcrypt.hash(dadosNormalizados.senha, 12);
    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dadosNormalizados.nome,
      email: dadosNormalizados.email,
      cpf: dadosNormalizados.cpf,
      senhaHash,
      role: PAPEL_CLIENTE,
      papeis: [PAPEL_CLIENTE],
      isAdminMestre: false,
    });

    await this.processarAdicaoPerfilETelefone(usuario.id, dadosNormalizados);
    await this.processarAdicaoEnderecosIniciais(usuario.id, dadosNormalizados);

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role.descricao,
    };
  }

  private async validarDadosCadastro(dados: ICriarClienteDto) {
    if (dados.senha !== dados.confirmacaoSenha) throw new Error('Senha e confirmação não conferem.');
    if (!verificarForcaSenha(dados.senha)) throw new Error('Senha fraca.');
    if (!validarCpf(dados.cpf)) throw new Error('CPF inválido.');

    const [porEmail, porCpf] = await Promise.all([
      this.repositorioUsuarios.buscarPorEmail(dados.email),
      this.repositorioUsuarios.buscarPorCpf(dados.cpf),
    ]);

    if (porEmail) throw new Error('E-mail já cadastrado.');
    if (porCpf) throw new Error('CPF já cadastrado.');
  }

  private async processarAdicaoPerfilETelefone(idUsuario: number, dados: ICriarClienteDto) {
    if (dados.genero || dados.dataNascimento) {
      await this.repositorioPerfil.criar({
        idUsuario,
        genero: dados.genero,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
      });
    }

    if (dados.telefone) {
      await this.repositorioTelefone.criar({
        idUsuario,
        idTipoTelefone: ClientesUtils.mapearTipoTelefone(dados.telefone.tipo),
        ddd: dados.telefone.ddd,
        numero: dados.telefone.numero,
        principal: true,
      });
    }
  }

  private async processarAdicaoEnderecosIniciais(idUsuario: number, dados: ICriarClienteDto) {
    if (!dados.enderecoCobranca) return;

    await this.servicoEndereco.criarEndereco(idUsuario, dados.enderecoCobranca, 'cobranca', true);

    if (dados.enderecoEntregaIgualCobranca) {
      await this.servicoEndereco.criarEndereco(idUsuario, dados.enderecoCobranca, 'entrega', false);
    } else if (dados.enderecoEntrega) {
      await this.servicoEndereco.criarEndereco(idUsuario, dados.enderecoEntrega, 'entrega', false);
    }
  }
}
