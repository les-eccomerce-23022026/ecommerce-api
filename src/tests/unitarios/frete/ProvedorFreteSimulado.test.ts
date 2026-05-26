import { ProvedorFreteSimulado } from '@/modules/frete/provedoresFrete/ProvedorFreteSimulado';

describe('ProvedorFreteSimulado', () => {
  const provedor = new ProvedorFreteSimulado();

  it('retorna PAC, SEDEX e RETIRA_EM_LOJA', async () => {
    const opcoes = await provedor.calcularOpcoes({
      cepDestino: '01310100',
      pesoKg: 1,
      valorTotalItens: 50,
    });
    expect(opcoes).toHaveLength(3);
    expect(opcoes.map((o) => o.tipoServico)).toEqual(['PAC', 'SEDEX', 'RETIRA_EM_LOJA']);
    expect(opcoes[2].valor).toBe(0);
    expect(opcoes[0].valor).toBeGreaterThan(0);
    expect(opcoes[1].valor).toBeGreaterThan(opcoes[0].valor);
  });

  it('é determinístico para mesmo CEP e peso', async () => {
    const a = await provedor.calcularOpcoes({ cepDestino: '20040020', pesoKg: 2 });
    const b = await provedor.calcularOpcoes({ cepDestino: '20040020', pesoKg: 2 });
    expect(a[0].valor).toBe(b[0].valor);
  });
});
