import { Request, Response, NextFunction } from 'express';
import { middlewareErro } from '@/shared/middlewares/erro.middleware';

describe('middlewareErro', () => {
  it('responde 500 com corpo padronizado em erro', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middlewareErro(new Error('falha simulada'), {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        sucesso: false,
        mensagem: 'falha simulada',
      }),
    );
  });
});
