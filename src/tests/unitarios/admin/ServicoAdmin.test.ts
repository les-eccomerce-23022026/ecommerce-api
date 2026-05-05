import { ServicoAdmin } from '@/modules/admin/admin.service';
import { PAPEL_ADMIN } from '@/shared/types/papeis';

describe('ServicoAdmin', () => {
  let servicoAdmin: ServicoAdmin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepositorioUsuarios: any;

  beforeEach(() => {
    mockRepositorioUsuarios = {
      buscarClientesComFiltros: jest.fn(),
      buscarPorUuid: jest.fn(),
      atualizarUsuario: jest.fn(),
      buscarPorEmailPapel: jest.fn(),
      buscarPorCpfPapel: jest.fn(),
      criarUsuario: jest.fn(),
    };
    servicoAdmin = new ServicoAdmin(mockRepositorioUsuarios);
  });

  describe('registrarNovoAdministrador', () => {
    const dadosCriacao = {
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      cpf: '12345678901',
      senha: 'Senha123!',
      confirmacaoSenha: 'Senha123!',
    };

    it('deve criar um novo administrador do zero', async () => {
      mockRepositorioUsuarios.buscarPorEmailPapel.mockResolvedValue(null);
      mockRepositorioUsuarios.buscarPorCpfPapel.mockResolvedValue(null);
      mockRepositorioUsuarios.criarUsuario.mockResolvedValue({
        uuid: 'uuid-novo',
        nome: dadosCriacao.nome,
        email: dadosCriacao.email,
        cpf: dadosCriacao.cpf,
        role: PAPEL_ADMIN,
      });

      const resultado = await servicoAdmin.registrarNovoAdministrador(dadosCriacao);

      expect(mockRepositorioUsuarios.criarUsuario).toHaveBeenCalled();
      expect(resultado.uuid).toBe('uuid-novo');
    });

    it('deve promover um cliente existente para administrador', async () => {
      const clienteExistente = { uuid: 'uuid-cliente', email: 'admin@teste.com', senhaHash: 'hash-antigo' };
      mockRepositorioUsuarios.buscarPorEmailPapel
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(clienteExistente);
      mockRepositorioUsuarios.buscarPorCpfPapel.mockResolvedValue(null);
      mockRepositorioUsuarios.buscarPorUuid.mockResolvedValue({
        ...clienteExistente,
        nome: 'Admin Teste',
        cpf: '12345678901',
        role: PAPEL_ADMIN,
      });

      const resultado = await servicoAdmin.registrarNovoAdministrador({
        ...dadosCriacao,
        usarMesmaSenha: true,
      });

      expect(mockRepositorioUsuarios.atualizarUsuario).toHaveBeenCalledWith(
        'uuid-cliente',
        expect.objectContaining({
          idPapel: PAPEL_ADMIN.id,
          senhaHash: 'hash-antigo',
        }),
      );
      expect(resultado.uuid).toBe('uuid-cliente');
    });
  });
});
