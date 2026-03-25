import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from './isolamento-integracao.util';

/**
 * Utilitário para centralizar a configuração repetitiva de testes de integração.
 * Fornece a instância da aplicação e gerencia o ciclo de vida do escopo de isolamento (transação).
 *
 * @param porTeste Se verdadeiro, cria um novo escopo antes de cada teste. Se falso, um único por suíte.
 * @returns Um objeto contendo a aplicação e o escopo atual (reatualizado a cada teste se porTeste for true).
 */
export function configurarTesteIntegracao(porTeste = true) {
  const contexto = {
    app: (null as unknown as Application),
    escopo: (null as unknown as EscopoIsolamentoIntegracao),
  };

  beforeAll(async () => {
    contexto.app = criarAplicacao();
    if (!porTeste) {
      contexto.escopo = await iniciarEscopoIsolamentoIntegracao();
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
