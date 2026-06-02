import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';
import { ControladorCupom } from '@/modules/cupom/ControladorCupom';

/**
 * Registra rotas de cupom no roteador.
 */
export function registrarRotasCupom(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repositorioPagamentos = new RepositorioPagamentosPostgres(db);
  const controlador = new ControladorCupom(repositorioPagamentos);

  // Endpoint público para listar cupons disponíveis
  router.get('/cupom/disponiveis', autenticacaoMiddleware, controlador.listarDisponiveis);

  // Endpoints para admin (criar cupons promocionais e de troca)
  router.post('/admin/cupom/promocional', autenticacaoMiddleware, adminOnlyMiddleware, controlador.criarCupomPromocional);
  router.post('/admin/cupom/troca', autenticacaoMiddleware, adminOnlyMiddleware, controlador.criarCupomTroca);

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
          INSERT INTO livraria_comercial.cupom (cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo, cup_valido_ate, cup_ativo, loj_id)
          VALUES 
            ('DESCONTO10', 'promocional', 10.00, 0, CURRENT_DATE + INTERVAL '1 year', true, NULL),
            ('DESCONTO20', 'promocional', 20.00, 50, CURRENT_DATE + INTERVAL '1 year', true, NULL),
            ('TROCA50', 'troca', 50.00, 0, CURRENT_DATE + INTERVAL '1 year', true, NULL)
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
      const usuarioUuid = req.usuario?.uuid;
      const lojIdAtual = req.usuario?.loj_id_atual;
      if (!usuarioUuid) {
        return res.status(401).json({
          ok: false,
          erro: 'Usuário não autenticado',
        });
      }

      // Primeiro buscar na tabela cupons_troca (cupons específicos do usuário - prioridade)
      // Filtra por loja atual se o usuário estiver em uma loja específica
      let filtroLojaTroca = '';
      const paramsTroca: any[] = [codigo, usuarioUuid];
      
      if (lojIdAtual) {
        filtroLojaTroca = ' AND (ct.loj_id IS NULL OR ct.loj_id = $3)';
        paramsTroca.push(lojIdAtual);
      } else {
        filtroLojaTroca = ' AND ct.loj_id IS NULL';
      }

      const rowsTroca = await db.executar<{
        cpt_uuid: string;
        cpt_codigo: string;
        cpt_valor: number;
        cpt_status: string;
      }>(
        `SELECT ct.cpt_uuid, ct.cpt_codigo, ct.cpt_valor, ct.cpt_status
         FROM livraria_comercial.cupons_troca ct
         JOIN livraria_gestao.clientes c ON c.cli_id = ct.cpt_cliente_id
         JOIN livraria_gestao.usuarios u ON u.usu_id = c.usu_id
         WHERE ct.cpt_codigo = $1 AND ct.cpt_status = 'DISPONIVEL' AND u.usu_uuid = $2
         ${filtroLojaTroca}
         LIMIT 1`,
        paramsTroca
      );

      if (rowsTroca.length > 0) {
        const cupom = rowsTroca[0];
        return res.json({
          ok: true,
          dados: {
            uuid: cupom.cpt_uuid,
            codigo: cupom.cpt_codigo,
            tipo: 'troca',
            valorDesconto: Number(cupom.cpt_valor),
          },
        });
      }

      // Se não encontrou cupom de troca, buscar na tabela cupom (cupons promocionais)
      // Filtra por loja atual se o usuário estiver em uma loja específica
      let filtroLojaPromocional = '';
      const paramsPromocional: any[] = [codigo];
      
      if (lojIdAtual) {
        filtroLojaPromocional = ' AND (c.loj_id IS NULL OR c.loj_id = $2)';
        paramsPromocional.push(lojIdAtual);
      } else {
        filtroLojaPromocional = ' AND c.loj_id IS NULL';
      }

      const rowsPromocional = await db.executar<{
        cup_uuid: string;
        cup_codigo: string;
        cup_tipo: string;
        cup_valor_desconto: number;
        cup_ativo: boolean;
      }>(
        `SELECT cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_ativo
         FROM livraria_comercial.cupom c
         WHERE c.cup_codigo = $1 AND c.cup_ativo = true AND c.cup_tipo = 'promocional'
         ${filtroLojaPromocional}
         LIMIT 1`,
        paramsPromocional
      );

      if (rowsPromocional.length === 0) {
        return res.status(400).json({
          ok: false,
          erro: 'Cupom inválido, expirado ou não pertence ao usuário',
        });
      }

      const cupom = rowsPromocional[0];

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
