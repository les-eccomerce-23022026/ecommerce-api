import type { Request, Response } from 'express';
import type { IRepositorioPagamentos } from '@/modules/pagamentos/repositories/IRepositorioPagamentos';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';

/** Cupons promocionais simulados (checkout BDD — ver EXPORT-BDD-7-ENTREGA-API). */
const CUPONS_PROMOCIONAIS_FIXOS = [
  {
    uuid: 'uuid-descuento10',
    codigo: 'DESCONTO10',
    tipo: 'promocional' as const,
    valorDesconto: 10,
    valorMinimo: 0,
  },
  {
    uuid: 'uuid-descuento20',
    codigo: 'DESCONTO20',
    tipo: 'promocional' as const,
    valorDesconto: 20,
    valorMinimo: 50,
  },
];

export class ControladorCupom {
  constructor(private readonly repositorioPagamentos: IRepositorioPagamentos) {}

  public listarDisponiveis = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioUuid = req.usuario?.uuid;
      if (!usuarioUuid) {
        res.status(401).json({ ok: false, erro: 'Não autenticado' });
        return;
      }

      const usuId = await this.repositorioPagamentos.obterUsuarioIdInternoPorUuid(usuarioUuid);
      const cuponsTroca =
        usuId !== null
          ? (await this.repositorioPagamentos.listarCuponsTrocaPorUsuario(usuId))
              .filter((c) => c.ativo && c.valorAtual > 0)
              .map((c) => ({
                uuid: c.uuid,
                codigo: c.codigo,
                tipo: 'troca' as const,
                valorDesconto: c.valorAtual,
                valorMinimo: 0,
              }))
          : [];

      res.status(200).json({
        ok: true,
        dados: [...CUPONS_PROMOCIONAIS_FIXOS, ...cuponsTroca],
      });
    } catch (erro) {
      res.status(500).json({ ok: false, erro: (erro as Error).message });
    }
  };

  /**
   * Criar cupom promocional (para admin de loja ou admin_sistema)
   * Admin de loja: cupom vinculado à sua loja (loj_id preenchido)
   * Admin_sistema: cupom global (loj_id = NULL)
   */
  public criarCupomPromocional = async (req: Request, res: Response): Promise<void> => {
    try {
      const { codigo, valorDesconto, valorMinimo, usoMaximo, validoAte } = req.body;
      const lojId = req.usuario?.loj_id_atual || null; // admin_sistema tem loj_id_atual = null

      if (!codigo || !valorDesconto) {
        res.status(400).json({ ok: false, erro: 'Código e valor desconto são obrigatórios' });
        return;
      }

      const db = ConexaoPostgres.obterInstancia();

      await db.executar(`
        INSERT INTO livraria_comercial.cupom (
          cup_uuid, cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo,
          cup_uso_maximo, cup_uso_atual, cup_valido_de, cup_valido_ate,
          cup_ativo, cup_criado_em, cup_atualizado_em, loj_id
        )
        VALUES (
          gen_random_uuid(),
          $1,
          'promocional',
          $2,
          COALESCE($3, 0),
          $4,
          0,
          CURRENT_DATE,
          COALESCE($5, CURRENT_DATE + INTERVAL '6 months'),
          true,
          NOW(),
          NOW(),
          $6
        )
        ON CONFLICT (cup_codigo) DO UPDATE SET
          cup_valor_desconto = EXCLUDED.cup_valor_desconto,
          cup_valor_minimo = EXCLUDED.cup_valor_minimo,
          cup_uso_maximo = EXCLUDED.cup_uso_maximo,
          cup_valido_ate = EXCLUDED.cup_valido_ate,
          cup_ativo = true,
          loj_id = EXCLUDED.loj_id
      `, [codigo, valorDesconto, valorMinimo, usoMaximo, validoAte, lojId]);

      res.status(201).json({
        ok: true,
        mensagem: lojId ? `Cupom promocional criado para a loja` : `Cupom promocional global criado`,
        dados: { codigo, lojId }
      });
    } catch (erro) {
      res.status(500).json({ ok: false, erro: (erro as Error).message });
    }
  };

  /**
   * Criar cupom de troca para cliente (para admin de loja ou admin_sistema)
   * Admin de loja: cupom vinculado à sua loja (loj_id preenchido)
   * Admin_sistema: cupom global (loj_id = NULL)
   */
  public criarCupomTroca = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clienteId, valor, vendaOrigemId } = req.body;
      const lojId = req.usuario?.loj_id_atual || null; // admin_sistema tem loj_id_atual = null

      if (!clienteId || !valor) {
        res.status(400).json({ ok: false, erro: 'Cliente ID e valor são obrigatórios' });
        return;
      }

      const db = ConexaoPostgres.obterInstancia();
      
      // Gerar código único usando função PostgreSQL
      const resultado = await db.executar<{ codigo: string }>(`
        SELECT 'TROCA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)) AS codigo
      `);
      const codigo = resultado[0]?.codigo || `TROCA-${Date.now()}`;

      await db.executar(`
        INSERT INTO livraria_comercial.cupons_troca (
          cpt_uuid, cpt_codigo, cpt_valor, cpt_cliente_id, cpt_venda_origem_id,
          cpt_status, cpt_valido_ate, cpt_criado_em, loj_id
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          'DISPONIVEL',
          CURRENT_DATE + INTERVAL '6 months',
          NOW(),
          $5
        )
        ON CONFLICT (cpt_codigo) DO UPDATE SET
          cpt_valor = EXCLUDED.cpt_valor,
          cpt_status = 'DISPONIVEL',
          loj_id = EXCLUDED.loj_id
      `, [codigo, valor, clienteId, vendaOrigemId || null, lojId]);

      res.status(201).json({
        ok: true,
        mensagem: lojId ? `Cupom de troca criado para a loja` : `Cupom de troca global criado`,
        dados: { codigo, clienteId, valor, lojId }
      });
    } catch (erro) {
      res.status(500).json({ ok: false, erro: (erro as Error).message });
    }
  };
}
