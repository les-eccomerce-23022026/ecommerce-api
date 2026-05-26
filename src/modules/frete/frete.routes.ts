import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { FabricaProvedorFrete } from '@/modules/frete/provedoresFrete/FabricaProvedorFrete';
import { RepositorioCotacaoFretePostgres } from '@/modules/frete/cotacaoFrete/RepositorioCotacaoFretePostgres';
import { ServicoFrete } from '@/modules/frete/ServicoFrete';
import { ControladorFrete } from '@/modules/frete/ControladorFrete';

export function registrarRotasFrete(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repoCotacao = new RepositorioCotacaoFretePostgres(db);
  const provedor = FabricaProvedorFrete.criar();
  const servico = new ServicoFrete(provedor, repoCotacao);
  const controller = new ControladorFrete(servico);

  router.post('/frete/cotar', autenticacaoMiddleware, controller.cotar.bind(controller));
}
