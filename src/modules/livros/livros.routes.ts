import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { ControladorLivros } from '@/modules/livros/controladorLivros';

export function registrarRotasLivros(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioLivrosPostgres(db);
  const servico = new ServicoLivros(repo);
  const controller = new ControladorLivros(servico);

  router.get('/categorias/catalogo', controller.categoriasCatalogo.bind(controller));
  router.get('/livros', controller.listarCatalogo.bind(controller));
  router.get('/livros/:uuid', controller.detalhes.bind(controller));

  router.get(
    '/admin/livros',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.listarAdmin.bind(controller),
  );
}
