import { Request, Response, NextFunction } from 'express';
import { acessoProdutosMiddleware } from '../acessoProdutos.middleware';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { Logger } from '@/shared/utils/Logger.util';
import { PAPEL_ADMIN, PAPEL_CLIENTE, PAPEL_ADMIN_SISTEMA } from '@/shared/types/papeis';

// Mock das dependências
jest.mock('@/shared/utils/Logger.util');

describe('acessoProdutosMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let runMock: jest.Mock;

  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();

    // Setup do mock de resposta
    jsonMock = jest.fn().mockReturnValue({});
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
      json: jsonMock,
    };

    next = jest.fn();

    req = {
      headers: {},
      cookies: {},
    };

    // Mock do Logger
    (Logger.info as jest.Mock).mockImplementation(() => {});
    (Logger.warn as jest.Mock).mockImplementation(() => {});
    (Logger.error as jest.Mock).mockImplementation(() => {});

    // Mock do AsyncLocalStorage.run
    runMock = jest.fn((contexto, callback) => {
      callback();
    });
    (ContextoRequisicao.asyncLocalStorage.run as jest.Mock) = runMock;
  });

  describe('Usuário não autenticado', () => {
    it('deve permitir acesso sem contexto de loja', async () => {
      // Arrange
      req.usuario = undefined;

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: undefined,
          loj_uuid: undefined,
          usu_id: undefined,
          usu_uuid: undefined,
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('deve registrar log de acesso público', async () => {
      // Arrange
      req.usuario = undefined;

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('[acesso-produtos]')
      );
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Usuário não autenticado')
      );
    });
  });

  describe('Cliente autenticado', () => {
    beforeEach(() => {
      req.usuario = {
        id: 1,
        uuid: 'cliente-uuid',
        email: 'cliente@email.com',
        role: 'cliente',
        papeis: [PAPEL_CLIENTE.descricao],
        lojas: [
          { loj_id: 1, loj_uuid: 'loja-1-uuid' },
          { loj_id: 2, loj_uuid: 'loja-2-uuid' },
        ],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };
    });

    it('deve permitir acesso total sem filtro de loja quando não há header', async () => {
      // Arrange
      req.headers = {};
      req.cookies = {};

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: undefined,
          loj_uuid: undefined,
          usu_id: 1,
          usu_uuid: 'cliente-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve filtrar por loja quando header x-loja-uuid é fornecido e válido', async () => {
      // Arrange
      req.headers = { 'x-loja-uuid': 'loja-2-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: 2,
          loj_uuid: 'loja-2-uuid',
          usu_id: 1,
          usu_uuid: 'cliente-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve filtrar por loja quando cookie x-loja-uuid é fornecido e válido', async () => {
      // Arrange
      req.cookies = { 'x-loja-uuid': 'loja-2-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: 2,
          loj_uuid: 'loja-2-uuid',
          usu_id: 1,
          usu_uuid: 'cliente-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve ignorar header de loja não autorizada e usar acesso total', async () => {
      // Arrange
      req.headers = { 'x-loja-uuid': 'loja-nao-autorizada-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: undefined,
          loj_uuid: undefined,
          usu_id: 1,
          usu_uuid: 'cliente-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve priorizar header sobre cookie', async () => {
      // Arrange
      req.headers = { 'x-loja-uuid': 'loja-1-uuid' };
      req.cookies = { 'x-loja-uuid': 'loja-2-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: 1,
          loj_uuid: 'loja-1-uuid',
        }),
        expect.any(Function)
      );
    });
  });

  describe('Admin Sistema autenticado', () => {
    beforeEach(() => {
      req.usuario = {
        id: 2,
        uuid: 'admin-sistema-uuid',
        email: 'admin.sistema@email.com',
        role: 'admin_sistema',
        papeis: [PAPEL_ADMIN_SISTEMA.descricao],
        lojas: [
          { loj_id: 1, loj_uuid: 'loja-1-uuid' },
          { loj_id: 2, loj_uuid: 'loja-2-uuid' },
        ],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };
    });

    it('deve permitir acesso total sem filtro de loja quando não há header', async () => {
      // Arrange
      req.headers = {};
      req.cookies = {};

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: undefined,
          loj_uuid: undefined,
          usu_id: 2,
          usu_uuid: 'admin-sistema-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve filtrar por loja quando header x-loja-uuid é fornecido', async () => {
      // Arrange
      req.headers = { 'x-loja-uuid': 'loja-2-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: 2,
          loj_uuid: 'loja-2-uuid',
          usu_id: 2,
          usu_uuid: 'admin-sistema-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Admin Tenant autenticado', () => {
    beforeEach(() => {
      req.usuario = {
        id: 3,
        uuid: 'admin-tenant-uuid',
        email: 'admin.tenant@email.com',
        role: 'admin',
        papeis: [PAPEL_ADMIN.descricao],
        lojas: [
          { loj_id: 1, loj_uuid: 'loja-1-uuid' },
        ],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };
    });

    it('deve filtrar apenas pela loja principal do admin', async () => {
      // Arrange
      req.headers = {};
      req.cookies = {};

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: 1,
          loj_uuid: 'loja-1-uuid',
          usu_id: 3,
          usu_uuid: 'admin-tenant-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve ignorar header x-loja-uuid e usar loja principal', async () => {
      // Arrange
      req.headers = { 'x-loja-uuid': 'loja-2-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: 1,
          loj_uuid: 'loja-1-uuid',
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve retornar 403 quando admin não tem loja principal configurada', async () => {
      // Arrange
      req.usuario = {
        id: 3,
        uuid: 'admin-tenant-uuid',
        email: 'admin.tenant@email.com',
        role: 'admin',
        papeis: [PAPEL_ADMIN.descricao],
        lojas: [],
        loja_uuid_principal: undefined,
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Administrador sem loja configurada. Entre em contato com o suporte.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Usuário com múltiplos papéis', () => {
    it('deve tratar como cliente quando tem papel cliente', async () => {
      // Arrange
      req.usuario = {
        id: 4,
        uuid: 'usuario-multi-uuid',
        email: 'usuario@email.com',
        role: 'cliente',
        papeis: [PAPEL_CLIENTE.descricao, PAPEL_ADMIN.descricao],
        lojas: [
          { loj_id: 1, loj_uuid: 'loja-1-uuid' },
        ],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cliente acessando')
      );
      expect(next).toHaveBeenCalled();
    });

    it('deve tratar como admin sistema quando tem papel admin_sistema', async () => {
      // Arrange
      req.usuario = {
        id: 5,
        uuid: 'admin-sistema-multi-uuid',
        email: 'admin.sistema@email.com',
        role: 'admin_sistema',
        papeis: [PAPEL_ADMIN_SISTEMA.descricao, PAPEL_ADMIN.descricao],
        lojas: [
          { loj_id: 1, loj_uuid: 'loja-1-uuid' },
        ],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Admin sistema acessando')
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Usuário sem papel reconhecido', () => {
    it('deve permitir acesso sem filtro de loja', async () => {
      // Arrange
      req.usuario = {
        id: 6,
        uuid: 'usuario-sem-papel-uuid',
        email: 'usuario@email.com',
        role: 'outro_papel',
        papeis: ['outro_papel'],
        lojas: [],
        loja_uuid_principal: '',
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Usuário sem papel reconhecido')
      );
      expect(runMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loj_id: undefined,
          loj_uuid: undefined,
        }),
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('deve registrar log quando cliente acessa catálogo completo', async () => {
      // Arrange
      req.usuario = {
        id: 1,
        uuid: 'cliente-uuid',
        email: 'cliente@email.com',
        role: 'cliente',
        papeis: [PAPEL_CLIENTE.descricao],
        lojas: [{ loj_id: 1, loj_uuid: 'loja-1-uuid' }],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cliente acessando catálogo completo')
      );
    });

    it('deve registrar log quando cliente acessa loja específica', async () => {
      // Arrange
      req.usuario = {
        id: 1,
        uuid: 'cliente-uuid',
        email: 'cliente@email.com',
        role: 'cliente',
        papeis: [PAPEL_CLIENTE.descricao],
        lojas: [{ loj_id: 1, loj_uuid: 'loja-1-uuid' }],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };
      req.headers = { 'x-loja-uuid': 'loja-1-uuid' };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cliente acessando loja específica')
      );
    });

    it('deve registrar log quando admin sistema acessa catálogo completo', async () => {
      // Arrange
      req.usuario = {
        id: 2,
        uuid: 'admin-sistema-uuid',
        email: 'admin.sistema@email.com',
        role: 'admin_sistema',
        papeis: [PAPEL_ADMIN_SISTEMA.descricao],
        lojas: [{ loj_id: 1, loj_uuid: 'loja-1-uuid' }],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Admin sistema acessando catálogo completo')
      );
    });

    it('deve registrar log quando admin tenant acessa sua loja', async () => {
      // Arrange
      req.usuario = {
        id: 3,
        uuid: 'admin-tenant-uuid',
        email: 'admin.tenant@email.com',
        role: 'admin',
        papeis: [PAPEL_ADMIN.descricao],
        lojas: [{ loj_id: 1, loj_uuid: 'loja-1-uuid' }],
        loja_uuid_principal: 'loja-1-uuid',
        loj_id_atual: 1,
      };

      // Act
      await acessoProdutosMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Admin tenant acessando apenas sua loja')
      );
    });
  });
});
