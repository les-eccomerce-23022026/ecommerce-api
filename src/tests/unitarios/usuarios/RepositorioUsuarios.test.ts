import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

describe('RepositorioUsuarios', () => {
  let repositorio: RepositorioUsuarios;
  let mockDb: jest.Mocked<Partial<IConexaoBanco>>;

  beforeEach(() => {
    mockDb = {
      executar: jest.fn().mockResolvedValue([{ uuid: 'uuid-123', usu_uuid: 'uuid-123' }]),
    };
    repositorio = new RepositorioUsuarios(mockDb as IConexaoBanco);
  });

  describe('atualizarUsuario', () => {
    it('deve atualizar o papel usando idPapel se fornecido', async () => {
      await repositorio.atualizarUsuario('uuid-123', { idPapel: 1 });

      const queryChamada = (mockDb.executar as jest.Mock).mock.calls[0][0];
      const valoresChamados = (mockDb.executar as jest.Mock).mock.calls[0][1];

      expect(queryChamada).toContain('pap_id = $1');
      expect(valoresChamados).toContain(1);
    });

    it('deve atualizar o papel usando role.id se idPapel não for fornecido', async () => {
      await repositorio.atualizarUsuario('uuid-123', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: { id: 2, descricao: 'admin' } as any,
      });

      const queryChamada = (mockDb.executar as jest.Mock).mock.calls[0][0];
      const valoresChamados = (mockDb.executar as jest.Mock).mock.calls[0][1];

      expect(queryChamada).toContain('pap_id = $1');
      expect(valoresChamados).toContain(2);
    });
  });
});
