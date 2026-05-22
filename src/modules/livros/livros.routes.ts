import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { ControladorLivros } from '@/modules/livros/controladorLivros';

export function registrarRotasLivros(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioLivrosPostgres(db);
  const bulkInsert = new RepositorioLivrosBulkInsert(db);
  const servico = new ServicoLivros(repo, bulkInsert);
  const controller = new ControladorLivros(servico);

  router.get('/categorias/catalogo', controller.categoriasCatalogo.bind(controller));
  
  router.get(
    '/admin/livros',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.listarAdmin.bind(controller),
  );

  router.post(
    '/admin/livros',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.criarLivro.bind(controller),
  );

  router.patch(
    '/admin/livros/:uuid([0-9a-fA-F-]{36})',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.atualizarLivro.bind(controller),
  );

  router.patch(
    '/admin/livros/:uuid([0-9a-fA-F-]{36})/inativar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.inativarLivro.bind(controller),
  );

  router.patch(
    '/admin/livros/:uuid([0-9a-fA-F-]{36})/ativar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.ativarLivro.bind(controller),
  );

  router.get(
    '/admin/livros/:uuid([0-9a-fA-F-]{36})',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.detalhesAdmin.bind(controller),
  );

  router.post(
    '/admin/livros/lote',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.criarLivrosEmLote.bind(controller),
  );

  router.post(
    '/admin/autores/lote',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.criarAutoresEmLote.bind(controller),
  );

  router.post(
    '/admin/editoras/lote',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.criarEditorasEmLote.bind(controller),
  );

  router.get('/livros', controller.listarCatalogo.bind(controller));
  router.get('/livros/:uuid([0-9a-fA-F-]{36})', controller.detalhes.bind(controller));
}
