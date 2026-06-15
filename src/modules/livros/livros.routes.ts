import { Router } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { acessoProdutosMiddleware } from '@/shared/middlewares/acessoProdutos.middleware';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { ControladorLivros } from '@/modules/livros/controladorLivros';
import { RepositorioParametrosInativacaoPostgres } from '@/modules/livros/infrastructure/RepositorioParametrosInativacaoPostgres';
import { ServicoInativacaoAutomaticaLivros } from '@/modules/livros/application/ServicoInativacaoAutomaticaLivros';
import { RepositorioAprovacaoPrecoPostgres } from '@/modules/livros/infrastructure/RepositorioAprovacaoPrecoPostgres';
import { VerificadorMargemPreco } from '@/modules/livros/application/VerificadorMargemPreco';
import { ServicoAprovacaoPreco } from '@/modules/livros/application/ServicoAprovacaoPreco';

export function registrarRotasLivros(router: Router): void {
  const db = ConexaoPostgres.obterInstancia();
  const repo = new RepositorioLivrosPostgres(db);
  const bulkInsert = new RepositorioLivrosBulkInsert(db);

  const repositorioParametros = new RepositorioParametrosInativacaoPostgres(db);
  const servicoInativacao = new ServicoInativacaoAutomaticaLivros(repositorioParametros, repo);

  const repositorioAprovacao = new RepositorioAprovacaoPrecoPostgres(db);
  const verificadorMargem = new VerificadorMargemPreco();
  const servicoAprovacao = new ServicoAprovacaoPreco(repositorioAprovacao, verificadorMargem);

  const servico = new ServicoLivros(repo, bulkInsert, undefined, servicoInativacao, servicoAprovacao);
  const controller = new ControladorLivros(servico);

  router.get('/categorias/catalogo', controller.categoriasCatalogo.bind(controller));
  
  router.get(
    '/admin/livros',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    acessoProdutosMiddleware,
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
    acessoProdutosMiddleware,
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

  router.get('/livros', contextoLojaMiddleware, controller.listarCatalogo.bind(controller));
  router.get('/livros/:uuid([0-9a-fA-F-]{36})', contextoLojaMiddleware, controller.detalhes.bind(controller));

  router.post(
    '/admin/livros/inativacao-automatica',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.inativacaoAutomatica.bind(controller),
  );

  router.get(
    '/admin/livros/aprovacoes-preco',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.listarAprovacoesPendentes.bind(controller),
  );

  router.post(
    '/admin/livros/aprovacoes-preco/:uuid([0-9a-fA-F-]{36})/aprovar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.aprovarPreco.bind(controller),
  );

  router.post(
    '/admin/livros/aprovacoes-preco/:uuid([0-9a-fA-F-]{36})/rejeitar',
    autenticacaoMiddleware,
    adminOnlyMiddleware,
    controller.rejeitarPreco.bind(controller),
  );
}
