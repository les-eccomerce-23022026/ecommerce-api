import { RepositorioUsuarios } from './usuario.repository';
import { PAPEL_ADMIN } from '@/shared/types/papeis';

describe('RepositorioUsuarios', () => {
  let repositorio: RepositorioUsuarios;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      executar: jest.fn().mockResolvedValue([{ uuid: 'uuid-123', usu_uuid: 'uuid-123' }]),
    };
    repositorio = new RepositorioUsuarios(mockDb);
  });

  describe('atualizarUsuario', () => {
    it('deve atualizar o papel usando idPapel se fornecido', async () => {
      await repositorio.atualizarUsuario('uuid-123', { idPapel: 1 });
      
      const queryChamada = mockDb.executar.mock.calls[0][0];
      const valoresChamados = mockDb.executar.mock.calls[0][1];
      
      expect(queryChamada).toContain('pap_id = $1');
      expect(valoresChamados).toContain(1);
    });

    it('deve atualizar o papel usando role.id se idPapel não for fornecido', async () => {
      await repositorio.atualizarUsuario('uuid-123', { role: { id: 2, descricao: 'admin' } as any });
      
      const queryChamada = mockDb.executar.mock.calls[0][0];
      const valoresChamados = mockDb.executar.mock.calls[0][1];
      
      expect(queryChamada).toContain('pap_id = $1');
      expect(valoresChamados).toContain(2);
    });
  });
});
