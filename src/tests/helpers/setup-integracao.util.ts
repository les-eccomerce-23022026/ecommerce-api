import { Application } from 'express';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from './isolamento-integracao.util';

export type ContextoTesteIntegracao = {
  app: Application;
  escopo: EscopoIsolamentoIntegracao | null;
  readonly db: IConexaoBanco | undefined;
};

/**
 * Utilitário para centralizar a configuração repetitiva de testes de integração.
 * Fornece a instância da aplicação e gerencia o ciclo de vida do escopo de isolamento (transação).
 *
 * @param porTeste Se verdadeiro, cria um novo escopo antes de cada teste. Se falso, um único por suíte.
 * @param aposIniciarEscopoSuite Callback executado após BEGIN quando `porTeste` é falso.
 *   Use para obter tokens/usuários dentro da mesma transação da suíte (evita JWT apontando para
 *   usuário invisível após rollback implícito entre hooks).
 * @returns Um objeto contendo a aplicação e o escopo atual (reatualizado a cada teste se porTeste for true).
 */
export function configurarTesteIntegracao(
  porTeste = true,
  aposIniciarEscopoSuite?: (ctx: ContextoTesteIntegracao) => Promise<void>,
) {
  const contexto = {
    app: (null as unknown as Application),
    escopo: (null as unknown as EscopoIsolamentoIntegracao),
    get db(): IConexaoBanco | undefined { return this.escopo?.db; }
  };

  beforeAll(async () => {
    contexto.app = criarAplicacao();
    if (!porTeste) {
      contexto.escopo = await iniciarEscopoIsolamentoIntegracao();
      if (aposIniciarEscopoSuite) {
        await aposIniciarEscopoSuite(contexto as ContextoTesteIntegracao);
      }
    }
  });

  if (porTeste) {
    beforeEach(async () => {
      contexto.escopo = await iniciarEscopoIsolamentoIntegracao();
    });

    afterEach(async () => {
      if (contexto.escopo) {
        await contexto.escopo.finalizar();
      }
    });
  } else {
    afterAll(async () => {
      if (contexto.escopo) {
        await contexto.escopo.finalizar();
      }
    });
  }

  return contexto;
}
