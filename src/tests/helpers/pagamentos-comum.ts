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

export async function prepararTabelasPagamentoIntegracao(
  contexto: ContextoPagamentosIntegracao,
  tokenAdmin: string
): Promise<void> {
  const res = await request(contexto.app)
    .post('/api/admin/testes/preparar-tabelas-pagamento')
    .set('Authorization', `Bearer ${tokenAdmin}`);
  
  if (res.status !== 200) {
    throw new Error(`Erro ao preparar tabelas de pagamento: ${res.status} - ${JSON.stringify(res.body)}`);
  }
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
  if (res.status !== 201) {
    throw new Error(`Erro ao criar venda: ${res.status} - ${JSON.stringify(res.body)}`);
  }
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
  if (res.status !== 201) {
    throw new Error(`Erro ao registrar intenção: ${res.status} - ${JSON.stringify(res.body)}`);
  }
  return res.body as { idIntencao: string; segredoConfirmacao: string };
}
