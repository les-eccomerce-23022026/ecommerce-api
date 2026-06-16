import { MensagemChatDTO } from './IRecomendacao.dto';
import { IntencaoRecomendacao } from './IntencaoRecomendacao.entity';

export interface ProdutoMencionadoHistorico {
  uuid: string;
  titulo: string;
}

export interface ContextoTurnoConversa {
  numeroTurno: number;
  ehContinuacao: boolean;
  uuidsJaMostrados: string[];
  titulosJaMostrados: string[];
  /** Texto agregado das mensagens anteriores para enriquecer busca semântica */
  resumoConversa: string;
}

/** Máximo de turnos enviados ao LLM/RAG — alinha custo e reduz ruído contextual. */
export const LIMITE_TURNOS_HISTORICO_LLM = 3;

const PADROES_REFINAMENTO =
  /\b(mais barato|mais barata|mais curto|mais curta|outro|outra|outros|outras|diferente|alternativa|menos páginas|menos paginas|até r\$|ate r\$|compare|comparar|não gostei|nao gostei|algo parecido|sem ser|exceto)\b/i;

/**
 * Extrai contexto de turnos anteriores para manter continuidade no chat.
 */
export class ServicoContextoConversa {
  /**
   * Mantém só os últimos N turnos (pares user/assistant) para contexto do LLM.
   * Determinístico — sem custo de tokens extra.
   */
  limitarHistoricoPorTurnos(
    historico: MensagemChatDTO[] | undefined,
    maxTurnos: number = LIMITE_TURNOS_HISTORICO_LLM
  ): MensagemChatDTO[] | undefined {
    if (!historico?.length || maxTurnos < 1) {
      return historico;
    }

    const turnos: MensagemChatDTO[][] = [];
    let turnoAtual: MensagemChatDTO[] = [];

    for (const msg of historico) {
      if (this.ehUsuario(msg) && turnoAtual.length > 0) {
        turnos.push(turnoAtual);
        turnoAtual = [];
      }
      turnoAtual.push(msg);
    }

    if (turnoAtual.length > 0) {
      turnos.push(turnoAtual);
    }

    return turnos.slice(-maxTurnos).flat();
  }

  analisar(
    historico: MensagemChatDTO[] | undefined,
    mensagemAtual: string
  ): ContextoTurnoConversa {
    const mensagens = historico ?? [];
    const turnosNoHistorico = mensagens.filter((m) => this.ehUsuario(m)).length;
    // O histórico não inclui a mensagem atual — o turno em processamento é +1
    const numeroTurno = turnosNoHistorico + 1;
    const ehContinuacao = numeroTurno > 1 || PADROES_REFINAMENTO.test(mensagemAtual);

    const uuidsJaMostrados: string[] = [];
    const titulosJaMostrados: string[] = [];

    for (const msg of mensagens) {
      if (this.ehAssistente(msg) && msg.produtosMencionados?.length) {
        for (const produto of msg.produtosMencionados) {
          if (!uuidsJaMostrados.includes(produto.uuid)) {
            uuidsJaMostrados.push(produto.uuid);
            titulosJaMostrados.push(produto.titulo);
          }
        }
      }
    }

    const resumoConversa = mensagens
      .slice(-6)
      .filter((m) => (m.conteudo ?? '').trim().length > 0)
      .map((m) => {
        const autor = this.ehUsuario(m) ? 'Cliente' : 'Assistente';
        const texto = (m.conteudo ?? '').length > 220 ? `${(m.conteudo ?? '').slice(0, 220)}…` : (m.conteudo ?? '');
        return `${autor}: ${texto}`;
      })
      .join('\n');

    return {
      numeroTurno,
      ehContinuacao,
      uuidsJaMostrados,
      titulosJaMostrados,
      resumoConversa,
    };
  }

  enriquecerQueryBusca(
    queryBase: string,
    contextoTurno: ContextoTurnoConversa,
    mensagemAtual: string
  ): string {
    const partes = [queryBase || mensagemAtual];

    if (contextoTurno.ehContinuacao && contextoTurno.resumoConversa) {
      partes.push(`Contexto da conversa:\n${contextoTurno.resumoConversa}`);
    }

    if (contextoTurno.titulosJaMostrados.length > 0) {
      partes.push(
        `Já foram sugeridos (evitar repetir salvo pedido explícito): ${contextoTurno.titulosJaMostrados.join(', ')}`
      );
    }

    partes.push(`Pedido atual: ${mensagemAtual}`);
    return partes.join('. ');
  }

  gerarPerguntasFollowUp(
    intencao: IntencaoRecomendacao,
    contextoTurno: ContextoTurnoConversa,
    quantidadeProdutos: number
  ): string[] {
    if (intencao.precisaEsclarecer && intencao.perguntasEsclarecimento?.length) {
      return intencao.perguntasEsclarecimento.slice(0, 3);
    }

    const perguntas: string[] = [];

    if (quantidadeProdutos > 0) {
      if (intencao.generos.includes('fantasia')) {
        perguntas.push('Tem opções mais baratas em fantasia?');
        perguntas.push('Quero uma saga curta para começar');
      } else if (intencao.generos.length > 0) {
        const genero = intencao.generos[0].replace(/_/g, ' ');
        perguntas.push(`Mostre outros títulos de ${genero}`);
        perguntas.push('Prefiro algo com menos de 300 páginas');
      } else {
        perguntas.push('Pode sugerir alternativas diferentes?');
        perguntas.push('Quero algo mais barato');
      }

      if (quantidadeProdutos >= 2) {
        perguntas.push('Compare dois desses livros para mim');
      }
    } else if (contextoTurno.ehContinuacao) {
      perguntas.push('Pode reformular com outro gênero?');
      perguntas.push('Quero um presente — qual faixa etária?');
    } else {
      perguntas.push('Livros mais vendidos em Fantasia');
      perguntas.push('Indicação para presente');
    }

    if (contextoTurno.numeroTurno >= 2) {
      perguntas.push('Status do meu último pedido');
    }

    return [...new Set(perguntas)].slice(0, 3);
  }

  private ehUsuario(msg: MensagemChatDTO): boolean {
    return msg.papel === 'user' || msg.remetente === 'usuario';
  }

  private ehAssistente(msg: MensagemChatDTO): boolean {
    return msg.papel === 'assistant' || msg.remetente === 'assistente';
  }
}
