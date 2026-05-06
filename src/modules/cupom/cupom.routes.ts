import { Router } from 'express';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';

/**
 * Registra rotas de cupom no roteador.
 * Rotas simples para testes E2E de cupom no Cypress.
 */
export function registrarRotasCupom(router: Router): void {
  // Endpoint para listar cupons disponíveis para o usuário
  router.get('/cupom/disponiveis', autenticacaoMiddleware, (req, res) => {
    // TODO: Implementar lógica para listar cupons disponíveis
    // Por enquanto, retorna cupons de teste fixos
    res.json({
      ok: true,
      dados: [
        {
          uuid: 'uuid-descuento10',
          codigo: 'DESCONTO10',
          tipo: 'promocional',
          valorDesconto: 10.00,
          valorMinimo: 0.00,
        },
        {
          uuid: 'uuid-descuento20',
          codigo: 'DESCONTO20',
          tipo: 'promocional',
          valorDesconto: 20.00,
          valorMinimo: 50.00,
        },
        {
          uuid: 'uuid-troca50',
          codigo: 'TROCA50',
          tipo: 'troca',
          valorDesconto: 50.00,
          valorMinimo: 0.00,
        },
        {
          uuid: 'uuid-troca30',
          codigo: 'TROCA30',
          tipo: 'troca',
          valorDesconto: 30.00,
          valorMinimo: 0.00,
        },
      ],
    });
  });

  // Endpoint para aplicar cupom
  router.post('/cupom/aplicar', autenticacaoMiddleware, (req, res) => {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        ok: false,
        erro: 'Código do cupom é obrigatório',
      });
    }
    
    // TODO: Implementar lógica real de aplicação de cupom
    // Por enquanto, valida cupons de teste fixos
    const cuponsValidos: Record<string, { uuid: string; tipo: string; valorDesconto: number }> = {
      'DESCONTO10': { uuid: 'uuid-descuento10', tipo: 'promocional', valorDesconto: 10.00 },
      'DESCONTO20': { uuid: 'uuid-descuento20', tipo: 'promocional', valorDesconto: 20.00 },
      'TROCA50': { uuid: 'uuid-troca50', tipo: 'troca', valorDesconto: 50.00 },
      'TROCA30': { uuid: 'uuid-troca30', tipo: 'troca', valorDesconto: 30.00 },
    };

    const cupom = cuponsValidos[codigo?.toUpperCase() || ''];

    if (!cupom) {
      return res.status(400).json({
        ok: false,
        erro: 'Cupom inválido ou expirado',
      });
    }

    return res.json({
      ok: true,
      dados: {
        ...cupom,
        codigo,
      },
    });
  });
}
