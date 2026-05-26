import { Request, Response } from 'express';
import { ControladorLojas } from '@/modules/lojas/controladorLojas';
import { IListaLojaDto } from '@/modules/lojas/Iloja.dto';

/**
 * Testes unitários para o ControladorLojas.
 * Valida a lógica do controlador sem dependências de banco de dados.
 */
describe('Unitário — ControladorLojas.obterMinhasLojas', () => {
  let mockRequisicao: Partial<Request>;
  let mockResposta: Partial<Response>;

  beforeEach(() => {
    // Mock da resposta
    mockResposta = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('cenários de sucesso', () => {
    it('retorna 200 com lista de lojas quando usuário está autenticado', async () => {
      const lojasMock: IListaLojaDto[] = [
        {
          uuid: 'uuid-1',
          nome: 'Loja A',
          slug: 'loja-a',
          cnpj: '12.345.678/0001-90',
          ativo: true,
        },
        {
          uuid: 'uuid-2',
          nome: 'Loja B',
          slug: 'loja-b',
          cnpj: '12.345.678/0001-91',
          ativo: true,
        },
      ];

      mockRequisicao = {
        usuario: {
          id: 123,
          uuid: 'user-uuid',
          email: 'admin@test.com',
          role: 'admin',
          papeis: ['admin'],
        },
      };

      await ControladorLojas.obterMinhasLojas(
        mockRequisicao as Request,
        mockResposta as Response
      );

      // Validar que o status foi chamado com 200
      expect(mockResposta.status).toHaveBeenCalledWith(200);
      
      // Validar que a resposta contém sucesso e dados
      const jsonCall = (mockResposta.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.sucesso).toBe(true);
      expect(Array.isArray(jsonCall.dados)).toBe(true);
    });
  });

  describe('cenários de falha', () => {
    it('retorna 401 quando usuário não está autenticado', async () => {
      mockRequisicao = {};

      await ControladorLojas.obterMinhasLojas(
        mockRequisicao as Request,
        mockResposta as Response
      );

      expect(mockResposta.status).toHaveBeenCalledWith(401);
      const jsonCall = (mockResposta.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.sucesso).toBe(false);
      expect(jsonCall.mensagem).toMatch(/autenticad/i);
    });
  });
});
