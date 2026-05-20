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
      associarPapelUsuario: jest.fn(),
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
      const clienteExistente = { 
        uuid: 'uuid-cliente', 
        email: 'admin@teste.com', 
        senhaHash: 'hash-antigo',
        id: 123,
        nome: 'Cliente Existente',
        cpf: '12345678901',
        papeis: [{ id: 1, descricao: 'cliente' }],
      };
      mockRepositorioUsuarios.buscarPorEmailPapel
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(clienteExistente);
      mockRepositorioUsuarios.buscarPorCpfPapel.mockResolvedValue(null);
      mockRepositorioUsuarios.buscarPorUuid.mockResolvedValue({
        ...clienteExistente,
        nome: 'Admin Teste',
        cpf: '12345678901',
        role: PAPEL_ADMIN,
        papeis: [{ id: 2, descricao: 'admin' }],
      });

      const resultado = await servicoAdmin.registrarNovoAdministrador({
        ...dadosCriacao,
        usarMesmaSenha: true,
      });

      expect(mockRepositorioUsuarios.associarPapelUsuario).toHaveBeenCalledWith(123, PAPEL_ADMIN.id);
      expect(resultado.uuid).toBe('uuid-cliente');
    });
  });
});
