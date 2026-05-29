import { Router } from 'express';
import { ControladorRecomendacao } from './infrastructure/controllers/ControladorRecomendacao';
import { RepositorioEmbeddingChromaDB } from './infrastructure/repositories/RepositorioEmbeddingChromaDB';
import { AdapterLangChainGemini } from './infrastructure/config/AdapterLangChainGemini';
import { ServicoGeracaoEmbedding } from './domain/services/ServicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from './domain/services/ServicoValidacaoProdutos';
import { ServicoRecomendacaoRAG } from './domain/services/ServicoRecomendacaoRAG';
import { ServicoRecomendacaoApplication } from './application/services/ServicoRecomendacaoApplication';
import { ServicoInterpretacaoIntencao } from './application/services/ServicoInterpretacaoIntencao';
import { ServicoIndexacaoProdutos } from './application/services/ServicoIndexacaoProdutos';
import { IAdapterEmbedding } from './domain/interfaces/IAdapterEmbedding';
import { RepositorioRecomendacaoPostgres } from './infrastructure/repositories/RepositorioRecomendacaoPostgres';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';
import { middlewareErroIa } from './infrastructure/middleware/erroIa.middleware';
import { limiteRequisicaoIA } from './infrastructure/middleware/limiteRequisicaoIA.middleware';
import { logAuditoriaIA } from './infrastructure/middleware/logAuditoriaIA.middleware';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware, clienteOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

/**
 * Rotas do módulo de Recomendação de Produtos
 *
 * Middlewares aplicados globalmente (ordem de execução):
 *   1. logAuditoriaIA   — registra entrada/saída de cada requisição
 *   2. limiteRequisicaoIA — protege contra uso abusivo (30 req/min por IP)
 */

// Inicializa dependências
const conexaoPostgres = ConexaoPostgres.obterInstancia();
const pool = conexaoPostgres['poolProducao']; // Acessa o pool interno
const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
const adapterLangChain = new AdapterLangChainGemini();
const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
const servicoValidacaoProdutos = new ServicoValidacaoProdutos();
const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
  repositorioEmbedding,
  servicoGeracaoEmbedding,
  servicoValidacaoProdutos
);
const repositorioRecomendacao = new RepositorioRecomendacaoPostgres(pool);

// Dependências para indexação de produtos
const repoLivros = new RepositorioLivrosPostgres(conexaoPostgres);
const bulkInsertLivros = new RepositorioLivrosBulkInsert(conexaoPostgres);
const servicoLivros = new ServicoLivros(repoLivros, bulkInsertLivros);
const servicoIndexacaoProdutos = new ServicoIndexacaoProdutos(
  servicoLivros,
  repositorioEmbedding,
  adapterLangChain,
  servicoGeracaoEmbedding
);

const servicoInterpretacaoIntencao = new ServicoInterpretacaoIntencao(adapterLangChain);

const servicoRecomendacao = new ServicoRecomendacaoApplication(
  repositorioEmbedding,
  repositorioRecomendacao,
  repositorioRecomendacao,
  servicoGeracaoEmbedding,
  servicoValidacaoProdutos,
  servicoRecomendacaoRAG,
  adapterLangChain,
  servicoIndexacaoProdutos,
  servicoLivros,
  servicoInterpretacaoIntencao,
);
const controladorRecomendacao = new ControladorRecomendacao(servicoRecomendacao);

const router = Router();

// ── Middlewares globais ────────────────────────────────────────────────────────
// Auditoria vem primeiro para capturar até requisições bloqueadas pelo rate limit
router.use(logAuditoriaIA);
router.use(limiteRequisicaoIA);

// ── Rotas de clientes autenticados (plano IA 5.1 / 5.2) ───────────────────────
router.post(
  '/recomendar',
  autenticacaoMiddleware,
  clienteOnlyMiddleware,
  controladorRecomendacao.recomendar,
);
router.post(
  '/chat',
  autenticacaoMiddleware,
  clienteOnlyMiddleware,
  controladorRecomendacao.chat,
);

// ── Rotas de métricas ──────────────────────────────────────────────────────────
// ATENÇÃO: rota estática '/metricas/agregadas' deve preceder '/metricas/:periodo'
// para que o Express não interprete 'agregadas' como valor de :periodo
router.get('/metricas/agregadas', controladorRecomendacao.buscarMetricasAgregadas);
router.get('/metricas/:periodo', controladorRecomendacao.buscarMetricas);
router.get('/metricas', controladorRecomendacao.buscarMetricas);

// ── Rotas administrativas ──────────────────────────────────────────────────────
// Rota protegida: exige autenticação válida (autenticacaoMiddleware) e papel de
// administrador (adminOnlyMiddleware) para disparar a reindexação do catálogo.
router.post('/reindexar', autenticacaoMiddleware, adminOnlyMiddleware, controladorRecomendacao.reindexar);

// ── Utilitários ────────────────────────────────────────────────────────────────
router.get('/saude', controladorRecomendacao.saude);

// ── Tratamento de erros específicos do módulo ─────────────────────────────────
router.use(middlewareErroIa);

export function registrarRotasIA(apiRouter: Router): void {
  apiRouter.use('/ia', router);
}