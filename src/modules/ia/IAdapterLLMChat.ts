import type { IntencaoRecomendacao, ContextoInterpretacaoIntencao } from './IntencaoRecomendacao.entity';
import type { MensagemChatDTO } from './IRecomendacao.dto';

export interface IAdapterLLMChat {
  interpretarIntencao(
    mensagem: string,
    historico: MensagemChatDTO[] | undefined,
    contexto: ContextoInterpretacaoIntencao
  ): Promise<IntencaoRecomendacao>;

  gerarRespostaChat(
    pergunta: string,
    contexto: string,
    historicoConversa?: { papel: 'user' | 'model'; conteudo: string }[],
    opcoes?: {
      modoEsclarecimento?: boolean;
      perguntasFollowUp?: string[];
      perfil?: { idadeAnos?: number; estado?: string; nome?: string };
      modoPosvenda?: boolean;
      /** Limite de tokens de saída por intenção (Task 3). Default 1024. */
      maxTokens?: number;
    }
  ): Promise<string>;

  validarCoerencia(prompt: string): Promise<string>;
}
