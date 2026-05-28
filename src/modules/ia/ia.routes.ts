import { Router } from 'express';
import { ControladorRecomendacao } from './infrastructure/controllers/ControladorRecomendacao';
import { RepositorioEmbeddingChromaDB } from './infrastructure/repositories/RepositorioEmbeddingChromaDB';
import { AdapterLangChainGemini } from './infrastructure/config/AdapterLangChainGemini';
import { ServicoGeracaoEmbedding } from './domain/services/ServicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from './domain/services/ServicoValidacaoProdutos';
import { ServicoRecomendacaoRAG } from './domain/services/ServicoRecomendacaoRAG';
import { ServicoRecomendacaoApplication } from './application/services/ServicoRecomendacaoApplication';
import { ServicoIndexacaoProdutos } from './application/services/ServicoIndexacaoProdutos';
import { RepositorioRecomendacaoPostgres } from './infrastructure/repositories/RepositorioRecomendacaoPostgres';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';
import { middlewareErroIa } from './infrastructure/middleware/erroIa.middleware';

/**
 * Rotas do módulo de IA de Recomendação
 */

// Inicializa dependências
const db = ConexaoPostgres.obterInstancia();
const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
const adapterLangChain = new AdapterLangChainGemini();
const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
  repositorioEmbedding,
  servicoGeracaoEmbedding,
  servicoValidacaoProdutos
);
const repositorioRecomendacao = new RepositorioRecomendacaoPostgres(db);

// Dependências para indexação de produtos
const repoLivros = new RepositorioLivrosPostgres(db);
const bulkInsertLivros = new RepositorioLivrosBulkInsert(db);
const servicoLivros = new ServicoLivros(repoLivros, bulkInsertLivros);
const servicoIndexacaoProdutos = new ServicoIndexacaoProdutos(
  servicoLivros,
  repositorioEmbedding,
  adapterLangChain,
  servicoGeracaoEmbedding
);

const servicoRecomendacao = new ServicoRecomendacaoApplication(
  repositorioEmbedding,
  repositorioRecomendacao,
  servicoGeracaoEmbedding,
  servicoValidacaoProdutos,
  servicoRecomendacaoRAG,
  adapterLangChain,
  servicoIndexacaoProdutos
);
const controladorRecomendacao = new ControladorRecomendacao(servicoRecomendacao);

const router = Router();

// Rotas públicas
router.post('/recomendar', controladorRecomendacao.recomendar);
router.post('/chat', controladorRecomendacao.chat);

// Rotas administrativas (TODO: adicionar middleware de autorização)
router.post('/reindexar', controladorRecomendacao.reindexar);

// Rota de saúde
router.get('/saude', controladorRecomendacao.saude);

// Aplica middleware de erro específico para IA
router.use(middlewareErroIa);

export function registrarRotasIA(apiRouter: Router): void {
  apiRouter.use('/ia', router);
}