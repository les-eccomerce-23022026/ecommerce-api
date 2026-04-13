import { GestaoIdentidadeCliente } from '@/modules/clientes/clientes.service';

describe('GestaoIdentidadeCliente', () => {
  let servico: GestaoIdentidadeCliente;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepositorioUsuarios: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepositorioPerfil: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepositorioTelefone: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepositorioEndereco: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepositorioCartoes: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(() => {
    mockRepositorioUsuarios = {
      buscarPorUuid: jest.fn().mockResolvedValue({
        id: 1,
        uuid: 'uuid-123',
        email: 'teste@teste.com',
        cpf: '12345678901',
      }),
      atualizarUsuario: jest.fn(),
    };
    mockRepositorioPerfil = {
      buscarPorIdUsuario: jest.fn(),
      atualizar: jest.fn(),
      criar: jest.fn(),
    };
    mockRepositorioTelefone = {
      buscarPorIdUsuario: jest.fn().mockResolvedValue([]),
      atualizar: jest.fn(),
      criar: jest.fn(),
    };
    mockRepositorioEndereco = {
      buscarPorIdUsuario: jest.fn().mockResolvedValue([]),
    };
    mockRepositorioCartoes = {
      buscarPorUsuario: jest.fn().mockResolvedValue([]),
    };
    mockDb = {
      executar: jest.fn(),
    };

    servico = new GestaoIdentidadeCliente(
      mockRepositorioUsuarios,
      mockRepositorioPerfil,
      mockRepositorioTelefone,
      mockRepositorioEndereco,
      mockRepositorioCartoes,
      mockDb,
    );
  });

  describe('atualizarCliente', () => {
    it('deve atualizar perfil se ele já existir', async () => {
      mockRepositorioPerfil.buscarPorIdUsuario.mockResolvedValue({ idUsuario: 1 });

      await servico.atualizarCliente('uuid-123', { genero: 'Masculino' });

      expect(mockRepositorioPerfil.atualizar).toHaveBeenCalled();
      expect(mockRepositorioPerfil.criar).not.toHaveBeenCalled();
    });

    it('deve criar perfil se ele não existir', async () => {
      mockRepositorioPerfil.buscarPorIdUsuario.mockResolvedValue(null);

      await servico.atualizarCliente('uuid-123', { genero: 'Feminino' });

      expect(mockRepositorioPerfil.criar).toHaveBeenCalled();
      expect(mockRepositorioPerfil.atualizar).not.toHaveBeenCalled();
    });
  });
});
