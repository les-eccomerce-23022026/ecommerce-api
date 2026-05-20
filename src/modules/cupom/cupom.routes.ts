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

  // Seed de cupons para testes (executa uma vez no ambiente de teste)
  let seedExecutado = false;
  async function seedCuponsTeste() {
    if (seedExecutado || process.env.NODE_ENV !== 'test') return;
    
    try {
      // Verificar se cupons já existem
      const existentes = await db.executar<{ cup_codigo: string }>(
        `SELECT cup_codigo FROM livraria_comercial.cupom WHERE cup_codigo IN ('DESCONTO10', 'DESCONTO20', 'TROCA50')`
      );
      
      if (existentes.length < 3) {
        // Inserir cupons hardcoded para testes
        await db.executar(`
          INSERT INTO livraria_comercial.cupom (cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo, cup_valido_ate, cup_ativo)
          VALUES 
            ('DESCONTO10', 'promocional', 10.00, 0, CURRENT_DATE + INTERVAL '1 year', true),
            ('DESCONTO20', 'promocional', 20.00, 50, CURRENT_DATE + INTERVAL '1 year', true),
            ('TROCA50', 'troca', 50.00, 0, CURRENT_DATE + INTERVAL '1 year', true)
          ON CONFLICT (cup_codigo) DO NOTHING
        `);
      }
      seedExecutado = true;
    } catch (erro) {
      console.error('Erro ao fazer seed de cupons:', erro);
    }
  }

  // Executar seed antes de registrar o endpoint
  seedCuponsTeste();

  // Endpoint para aplicar cupom
  router.post('/cupom/aplicar', autenticacaoMiddleware, async (req, res) => {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        ok: false,
        erro: 'Código do cupom é obrigatório',
      });
    }

    try {
      // Buscar cupom na tabela unificada
      const rows = await db.executar<{
        cup_uuid: string;
        cup_codigo: string;
        cup_tipo: string;
        cup_valor_desconto: number;
        cup_ativo: boolean;
      }>(
        `SELECT cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_ativo
         FROM livraria_comercial.cupom
         WHERE cup_codigo = $1 AND cup_ativo = true
         LIMIT 1`,
        [codigo]
      );

      if (rows.length === 0) {
        return res.status(400).json({
          ok: false,
          erro: 'Cupom inválido ou expirado',
        });
      }

      const cupom = rows[0];

      return res.json({
        ok: true,
        dados: {
          uuid: cupom.cup_uuid,
          codigo: cupom.cup_codigo,
          tipo: cupom.cup_tipo,
          valorDesconto: Number(cupom.cup_valor_desconto),
        },
      });
    } catch (erro) {
      return res.status(500).json({
        ok: false,
        erro: 'Erro ao aplicar cupom',
      });
    }
  });
}
