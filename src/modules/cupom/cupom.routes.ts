import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';
import { ControladorCupom } from '@/modules/cupom/ControladorCupom';

/**
 * Registra rotas de cupom no roteador.
 */
export function registrarRotasCupom(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repositorioPagamentos = new RepositorioPagamentosPostgres(db);
  const controlador = new ControladorCupom(repositorioPagamentos);

  router.get('/cupom/disponiveis', autenticacaoMiddleware, controlador.listarDisponiveis);

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
      DESCONTO10: { uuid: 'uuid-descuento10', tipo: 'promocional', valorDesconto: 10.0 },
      DESCONTO20: { uuid: 'uuid-descuento20', tipo: 'promocional', valorDesconto: 20.0 },
      TROCA50: { uuid: 'uuid-troca50', tipo: 'troca', valorDesconto: 50.0 },
      TROCA30: { uuid: 'uuid-troca30', tipo: 'troca', valorDesconto: 30.0 },
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
