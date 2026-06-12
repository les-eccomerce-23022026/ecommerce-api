import { Router } from 'express';
import { ControladorRecomendacao } from './controladorRecomendacao';
import { RepositorioEmbeddingChromaDB } from './repositorioEmbeddingChromaDB';
import { AdapterLangChainGemini } from './adapterLangChainGemini';
import { ServicoGeracaoEmbedding } from './servicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from './servicoValidacaoProdutos';
import { ServicoCacheProdutos } from './servicoCacheProdutos';
import { ServicoRecomendacaoRAG } from './servicoRecomendacaoRAG';
import { ServicoRecomendacaoApplication } from './servicoRecomendacaoApplication';
import { ServicoInterpretacaoIntencao } from './servicoInterpretacaoIntencao';
import { ServicoIndexacaoProdutos } from './servicoIndexacaoProdutos';
import { ServicoHealthCheckIA } from './servicoHealthCheckIA';
import { IAdapterEmbedding } from './IAdapterEmbedding';
import { RepositorioRecomendacaoPostgres } from './repositorioRecomendacaoPostgres';
import { RepositorioPadroesValidacaoIA } from './repositorioPadroesValidacaoIA';
import { ServicoCachePadroesValidacaoIA } from './servicoCachePadroesValidacaoIA';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';
import { ClassificadorDominioIA } from './classificadorDominioIA';
import { middlewareErroIa } from './erroIa.middleware';
import { limiteRequisicaoIA } from './limiteRequisicaoIA.middleware';
import { logAuditoriaIA } from './logAuditoriaIA.middleware';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware, clienteOnlyMiddleware, autenticadoMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { PAPEL_CLIENTE, PAPEL_ADMIN, PAPEL_ADMIN_SISTEMA } from '@/shared/types/papeis';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para validar acesso ao chat de recomendação IA.
 * 
 * Permite acesso a clientes e administradores, mas garante que o contexto
 * seja isolado baseado no papel do usuário:
 * - Cliente: acesso apenas aos próprios dados (vendas, pedidos, histórico)
 * - Admin: acesso a dados agregados da loja (não dados pessoais de clientes)
 * - Admin Sistema: acesso a dados agregados globais
 * 
 * Este middleware não bloqueia acesso, apenas valida que o usuário
 * tem um papel válido. A lógica de isolamento de contexto é implementada
 * no serviço de aplicação (SRP - Single Responsibility Principle).
 */
function validarAcessoChatIA(req: Request, res: Response, next: NextFunction): void {
  const { usuario } = req;

  if (!usuario || !usuario.papeis || usuario.papeis.length === 0) {
    res.status(401).json({
      mensagem: 'Usuário não autenticado ou sem papéis definidos.',
      sucesso: false,
    });
    return;
  }

  const temPapelValido = usuario.papeis.some(
    (papel) => 
      papel === PAPEL_CLIENTE.descricao || 
      papel === PAPEL_ADMIN.descricao || 
      papel === PAPEL_ADMIN_SISTEMA.descricao
  );

  if (!temPapelValido) {
    res.status(403).json({
      mensagem: 'Acesso negado. Papel não autorizado para chat de recomendação.',
      sucesso: false,
    });
    return;
  }

  next();
}

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
const repositorioRecomendacao = new RepositorioRecomendacaoPostgres(pool);

// Dependências para indexação de produtos
const repoLivros = new RepositorioLivrosPostgres(conexaoPostgres);
const bulkInsertLivros = new RepositorioLivrosBulkInsert(conexaoPostgres);
const servicoLivros = new ServicoLivros(repoLivros, bulkInsertLivros);

// Cache de padrões de validação com TTL 10 min — permite aprendizado automático sem redeploy
const repositorioPadroesValidacao = new RepositorioPadroesValidacaoIA(pool);
const cachePadroesValidacao = new ServicoCachePadroesValidacaoIA(repositorioPadroesValidacao);

// Cache de produtos com TTL 5 min — evita consulta ao catálogo a cada requisição de IA
const cacheProdutos = new ServicoCacheProdutos(servicoLivros);
const servicoValidacaoProdutos = new ServicoValidacaoProdutos(cacheProdutos);

const servicoRecomendacaoRAG = new ServicoRecomendacaoRAG(
  repositorioEmbedding,
  servicoGeracaoEmbedding,
  servicoValidacaoProdutos
);

const servicoIndexacaoProdutos = new ServicoIndexacaoProdutos(
  servicoLivros,
  repositorioEmbedding,
  adapterLangChain,
  servicoGeracaoEmbedding
);

const servicoInterpretacaoIntencao = new ServicoInterpretacaoIntencao(adapterLangChain);

const servicoRecomendacao = new ServicoRecomendacaoApplication(
  repositorioEmbedding,
  repositorioRecomendacao, // IRepositorioContextoCliente
  repositorioRecomendacao, // IRepositorioMetricasRecomendacao
  repositorioRecomendacao, // IRepositorioTendencias (pedidos + rankings)
  servicoGeracaoEmbedding,
  servicoValidacaoProdutos,
  servicoRecomendacaoRAG,
  adapterLangChain,
  servicoIndexacaoProdutos,
  servicoLivros,
  servicoInterpretacaoIntencao,
);

const servicoHealthCheck = new ServicoHealthCheckIA(
  repositorioEmbedding,
  adapterLangChain
);

const classificadorDominio = new ClassificadorDominioIA(adapterLangChain);

const controladorRecomendacao = new ControladorRecomendacao(
  servicoRecomendacao,
  servicoHealthCheck,
  adapterLangChain,
  adapterLangChain,
  cachePadroesValidacao,
  classificadorDominio
);

const router = Router();

// ── Middlewares globais ────────────────────────────────────────────────────────
// Auditoria vem primeiro para capturar até requisições bloqueadas pelo rate limit
router.use(logAuditoriaIA);
// TEMPORARIAMENTE DESABILITADO DEVIDO A ERRO IPv6 NO express-rate-limit
// router.use(limiteRequisicaoIA);

// ── Rotas de usuários autenticados (qualquer papel: cliente, admin, admin_sistema) ─────
// Middleware validarAcessoChatIA garante que apenas papéis válidos acessem o chat
// A lógica de isolamento de contexto é implementada no serviço de aplicação
router.post(
  '/recomendar',
  autenticacaoMiddleware,
  validarAcessoChatIA,
  controladorRecomendacao.recomendar,
);
router.post(
  '/chat',
  autenticacaoMiddleware,
  validarAcessoChatIA,
  controladorRecomendacao.chat,
);

// ── Rotas de métricas ──────────────────────────────────────────────────────────
// ATENÇÃO: rota estática '/metricas/agregadas' deve preceder '/metricas/:periodo'
// para que o Express não interprete 'agregadas' como valor de :periodo
router.get('/metricas/agregadas', controladorRecomendacao.buscarMetricasAgregadas);
router.get('/metricas/:periodo', controladorRecomendacao.buscarMetricas);
router.get('/metricas', controladorRecomendacao.buscarMetricas);

// ── Rotas administrativas ──────────────────────────────────────────────────────
// Rota protegida: exige autenticação válida (autenticacaoMiddleware) para disparar
// a reindexação do catálogo. Acessível por todos os papéis autenticados.
router.post('/reindexar', autenticacaoMiddleware, autenticadoMiddleware, controladorRecomendacao.reindexar);

// ── Utilitários ────────────────────────────────────────────────────────────────
router.get('/saude', controladorRecomendacao.saude);

// ── Tratamento de erros específicos do módulo ─────────────────────────────────
router.use(middlewareErroIa);

export function registrarRotasIA(apiRouter: Router): void {
  apiRouter.use('/ia', router);
}