import { ServicoContextoConversa } from './ServicoContextoConversa';
import type { MensagemChatDTO } from '../../application/dtos/IRecomendacaoDTO';

describe('ServicoContextoConversa.limitarHistoricoPorTurnos', () => {
  const servico = new ServicoContextoConversa();

  const msg = (papel: 'user' | 'assistant', conteudo: string): MensagemChatDTO => ({
    papel,
    conteudo,
  });

  it('mantém apenas os últimos 3 turnos completos', () => {
    const historico: MensagemChatDTO[] = [
      msg('user', 'turno 1'),
      msg('assistant', 'resp 1'),
      msg('user', 'turno 2'),
      msg('assistant', 'resp 2'),
      msg('user', 'turno 3'),
      msg('assistant', 'resp 3'),
      msg('user', 'turno 4'),
      msg('assistant', 'resp 4'),
    ];

    const limitado = servico.limitarHistoricoPorTurnos(historico, 3);

    expect(limitado?.map((m) => m.conteudo)).toEqual([
      'turno 2',
      'resp 2',
      'turno 3',
      'resp 3',
      'turno 4',
      'resp 4',
    ]);
  });

  it('preserva turno incompleto (sem resposta do assistente)', () => {
    const historico: MensagemChatDTO[] = [
      msg('user', 'turno 1'),
      msg('assistant', 'resp 1'),
      msg('user', 'turno 2 pendente'),
    ];

    const limitado = servico.limitarHistoricoPorTurnos(historico, 3);

    expect(limitado?.length).toBe(3);
    expect(limitado?.at(-1)?.conteudo).toBe('turno 2 pendente');
  });
});
