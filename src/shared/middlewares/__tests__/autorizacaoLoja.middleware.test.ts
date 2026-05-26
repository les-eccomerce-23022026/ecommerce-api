import { Request, Response, NextFunction } from 'express';
import { autorizacaoLojaMiddleware } from '../autorizacaoLoja.middleware';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { di } from '@/shared/infrastructure/di.container';
import { Logger } from '@/shared/utils/Logger.util';
import { ESCOPOS_ADMIN } from '@/shared/types/escoposAdmin';

// Mock das dependências
jest.mock('@/shared/infrastructure/di.container');
jest.mock('@/shared/utils/Logger.util');

describe('autorizacaoLojaMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

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
    };

    // Mock do Logger
    (Logger.warn as jest.Mock).mockImplementation(() => {});
    (Logger.info as jest.Mock).mockImplementation(() => {});
    (Logger.error as jest.Mock).mockImplementation(() => {});
  });

  describe('Validação de autenticação', () => {
    it('deve retornar 401 quando usuário não está autenticado (usu_id ausente)', async () => {
      // Arrange
      jest.spyOn(ContextoRequisicao, 'obterContexto').mockReturnValue({
        loj_id: 1,
        usu_id: undefined,
      });

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Usuário não autenticado.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando loja não está selecionada (loj_id ausente)', async () => {
      // Arrange
      jest.spyOn(ContextoRequisicao, 'obterContexto').mockReturnValue({
        loj_id: undefined,
        usu_id: 1,
      });

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Loja não selecionada.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validação de associação admin-loja', () => {
    beforeEach(() => {
      jest.spyOn(ContextoRequisicao, 'obterContexto').mockReturnValue({
        loj_id: 1,
        usu_id: 100,
      });
    });

    it('deve retornar 403 quando admin não está associado à loja', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([]); // Sem associação

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Você não tem permissão para acessar esta loja.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 403 quando associação está inativa', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([
        {
          adl_escopo: ESCOPOS_ADMIN.LOJA,
          adl_ativo: false,
        },
      ]);

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Seu acesso a esta loja foi desativado.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validação de escopo', () => {
    beforeEach(() => {
      jest.spyOn(ContextoRequisicao, 'obterContexto').mockReturnValue({
        loj_id: 1,
        usu_id: 100,
      });
    });

    it('deve permitir acesso quando escopo é SISTEMA', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([
        {
          adl_escopo: ESCOPOS_ADMIN.SISTEMA,
          adl_ativo: true,
        },
      ]);

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('deve permitir acesso quando escopo é LOJA e admin está associado', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([
        {
          adl_escopo: ESCOPOS_ADMIN.LOJA,
          adl_ativo: true,
        },
      ]);

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('deve retornar 403 quando escopo é inválido', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([
        {
          adl_escopo: 'INVALIDO',
          adl_ativo: true,
        },
      ]);

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Você não tem permissão para acessar esta loja.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Tratamento de erros', () => {
    beforeEach(() => {
      jest.spyOn(ContextoRequisicao, 'obterContexto').mockReturnValue({
        loj_id: 1,
        usu_id: 100,
      });
    });

    it('deve retornar 500 quando ocorre erro na consulta ao banco', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockRejectedValue(
        new Error('Erro de conexão com banco')
      );

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: 'Erro ao validar autorização.',
          sucesso: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      jest.spyOn(ContextoRequisicao, 'obterContexto').mockReturnValue({
        loj_id: 1,
        usu_id: 100,
      });
    });

    it('deve fazer log de acesso autorizado', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([
        {
          adl_escopo: ESCOPOS_ADMIN.LOJA,
          adl_ativo: true,
        },
      ]);

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('[autorizacao-loja]')
      );
    });

    it('deve fazer log de acesso negado', async () => {
      // Arrange
      (di.db.executar as jest.Mock).mockResolvedValue([]);

      // Act
      await autorizacaoLojaMiddleware(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[autorizacao-loja]')
      );
    });
  });
});
