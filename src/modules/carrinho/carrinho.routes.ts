import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { clienteOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { RepositorioCarrinhoPostgres } from '@/modules/carrinho/repositorioCarrinhoPostgres';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { ServicoCarrinho } from '@/modules/carrinho/servicoCarrinho';
import { ControladorCarrinho } from '@/modules/carrinho/controladorCarrinho';

export function registrarRotasCarrinho(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repoCarrinho = new RepositorioCarrinhoPostgres(db);
  const repoLivros = new RepositorioLivrosPostgres(db);
  const servico = new ServicoCarrinho(repoCarrinho, repoLivros);
  const controller = new ControladorCarrinho(servico);

  router.get(
    '/carrinho',
    autenticacaoMiddleware,
    clienteOnlyMiddleware,
    controller.obter.bind(controller),
  );
  router.post(
    '/carrinho/itens',
    autenticacaoMiddleware,
    clienteOnlyMiddleware,
    controller.sincronizarItem.bind(controller),
  );
  router.delete(
    '/carrinho',
    autenticacaoMiddleware,
    clienteOnlyMiddleware,
    controller.limpar.bind(controller),
  );
}
