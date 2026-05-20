import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

export type ContextoPagamentosIntegracao = ReturnType<typeof configurarTesteIntegracao>;

export const cartaoValido = {
  numero: '4111111111111111',
  nomeTitular: 'Cliente Integracao Pag',
  validade: '12/30',
  bandeira: 'Visa',
};

export async function prepararTabelasPagamentoIntegracao(db: ContextoPagamentosIntegracao['db']): Promise<void> {
  if (!db) return;
  await db.executar(
    `INSERT INTO tipo_pagamento (tpg_descricao) VALUES ('pix') ON CONFLICT (tpg_descricao) DO NOTHING`,
  );
  await db.executar(
    `INSERT INTO status_venda (stv_descricao) VALUES ('AGUARDANDO PAGAMENTO') ON CONFLICT (stv_descricao) DO NOTHING`,
  );
  await db.executar(`
    ALTER TABLE livraria_financeiro.pagamento_pix_simulado
      ADD COLUMN IF NOT EXISTS pps_segredo_confirmacao VARCHAR(128)
  `);
}

export async function criarVendaPagamentos(
  contexto: ContextoPagamentosIntegracao,
  token: string,
  total = 60,
): Promise<string> {
  const valorFrete = 10;
  const valorTotalItens = total - valorFrete;
  if (valorTotalItens <= 0) {
    throw new Error('criarVenda: total deve ser maior que o frete fixo de teste (10)');
  }
  const res = await request(contexto.app)
    .post('/api/vendas')
    .set('Authorization', `Bearer ${token}`)
    .send({
      itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: valorTotalItens }],
      valorTotalItens,
      valorFrete,
      valorTotal: total,
    });
  expect(res.status).toBe(201);
  return res.body.id as string;
}

export async function registrarIntencaoPagamentos(
  contexto: ContextoPagamentosIntegracao,
  token: string,
  valorTotal: number,
): Promise<{ idIntencao: string; segredoConfirmacao: string }> {
  const res = await request(contexto.app)
    .post('/api/pagamentos/intencao-pagamento')
    .set('Authorization', `Bearer ${token}`)
    .send({ valorTotal });
  expect(res.status).toBe(201);
  return res.body as { idIntencao: string; segredoConfirmacao: string };
}
