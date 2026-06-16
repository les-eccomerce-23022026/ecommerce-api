import dotenv from 'dotenv';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import { Logger } from '@/shared/utils/Logger.util';
import { SimuladorAtualizacaoRastreamento } from '@/modules/logistica-mocks/SimuladorAtualizacaoRastreamento';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { RepositorioEventoRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioEventoRastreamentoPostgres';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { JobAutoConfirmacaoEntrega } from '@/modules/entrega/jobs/JobAutoConfirmacaoEntrega';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { RepositorioEntregaPostgres } from '@/modules/entrega/RepositorioEntregaPostgres';
import { ServicoEntrega } from '@/modules/entrega/ServicoEntrega';
import { ServicoNotificacaoBanco } from '@/modules/entrega/adapters/ServicoNotificacaoBanco';
import { RepositorioNotificacoes } from '@/modules/entrega/RepositorioNotificacoes';
import { JobExpiracaoReservas } from '@/modules/estoque/jobs/JobExpiracaoReservas';
import { RepositorioReservasPostgres } from '@/modules/estoque/repositorioReservas';
import { RepositorioEstoque } from '@/modules/estoque/repositorioEstoque';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import { JobLimpezaTokensRevocados } from '@/modules/auth/jobs/JobLimpezaTokensRevocados';
import { JobAutoIndexacaoChromaDB } from '@/modules/ia/jobs/JobAutoIndexacaoChromaDB';
import { AdapterLangChainGemini } from '@/modules/ia/adapterLangChainGemini';

dotenv.config();

// Validar variáveis de ambiente críticas (regra U3 - proibido fallback silencioso)
const variaveisObrigatorias: Record<string, string | undefined> = {
  PORTA_HTTP: process.env.PORTA_HTTP,
  JWT_SEGREDO: process.env.JWT_SEGREDO,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DB: process.env.POSTGRES_DB,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  SEGREDO_HMAC_INTENCAO: process.env.SEGREDO_HMAC_INTENCAO,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

const variaveisFaltando = Object.entries(variaveisObrigatorias)
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome);

if (variaveisFaltando.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias não definidas: ${variaveisFaltando.join(', ')}. Verifique o arquivo .env.`
  );
}

const porta = process.env.PORTA_HTTP!;

const app = criarAplicacao();

// Instanciar simulador de atualização de rastreamento (apenas em desenvolvimento)
// TEMPORARIAMENTE DESABILITADO PARA INVESTIGAR ERRO DE CONEXAO
let simulador: SimuladorAtualizacaoRastreamento | null = null;
/*
if (process.env.NODE_ENV === 'development') {
  try {
    const db = ConexaoPostgres.obterInstancia();
    const repoRastreamento = new RepositorioRastreamentoPostgres(db);
    const repoEventoRastreamento = new RepositorioEventoRastreamentoPostgres(db);
    simulador = new SimuladorAtualizacaoRastreamento(
      repoRastreamento,
      repoEventoRastreamento,
      60, // 60 minutos em desenvolvimento para não impactar o desempenho
    );
    simulador.iniciar();
    Logger.info('[Server] Simulador de atualização de rastreamento iniciado (intervalo: 60 minutos)');
  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : String(erro);
    Logger.warn(`[Server] Simulador de atualização de rastreamento fora do ar. Causa: ${mensagemErro}`);
    Logger.debug('[Server] Detalhes do erro ao iniciar simulador:', erro as any);
  }
}
*/

app.listen(Number(porta), () => {
  Logger.info(`Servidor iniciado na porta ${porta}`);

  // Warm-up do LLM de chat (Task 2): dispara a seleção Groq/Gemini ainda no boot,
  // de forma não-bloqueante, para que a primeira requisição real não pague a
  // latência da verificação de disponibilidade. Falha não derruba o boot.
  try {
    const adapterChat = new AdapterLangChainGemini();
    void adapterChat
      .prewarmChat()
      .then(() => Logger.info('[Server] Warm-up do LLM de chat concluído com sucesso'))
      .catch((erro: unknown) => {
        const msg = erro instanceof Error ? erro.message : String(erro);
        Logger.warn(`[Server] Warm-up do LLM de chat falhou (seguindo sem warm-up). Causa: ${msg}`);
      });
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    Logger.warn(`[Server] Não foi possível iniciar warm-up do LLM de chat. Causa: ${msg}`);
  }
});

// Job de auto-confirmação de entregas com prazo vencido
try {
  const db = ConexaoPostgres.obterInstancia();
  const repoVendasJob = new RepositorioVendasPostgres(db);
  const repoRastreamentoJob = new RepositorioRastreamentoPostgres(db);
  const repoEntregaJob = new RepositorioEntregaPostgres(db, repoRastreamentoJob);
  const repoNotificacoesJob = new RepositorioNotificacoes(db);
  const servicoNotificacaoJob = new ServicoNotificacaoBanco(repoNotificacoesJob);
  const servicoEntregaJob = new ServicoEntrega(repoEntregaJob, repoVendasJob, servicoNotificacaoJob);

  const jobAutoConfirmacao = new JobAutoConfirmacaoEntrega(
    repoVendasJob,
    repoEntregaJob,
    servicoEntregaJob,
    60,
  );
  jobAutoConfirmacao.iniciar();

  process.on('SIGTERM', () => jobAutoConfirmacao.parar());
  process.on('SIGINT', () => jobAutoConfirmacao.parar());
} catch (erro) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  Logger.warn(`[Server] Job de auto-confirmação fora do ar. Causa: ${msg}`);
}

// Job de expiração de reservas de estoque
try {
  const db = ConexaoPostgres.obterInstancia();
  const repoReservasJob = new RepositorioReservasPostgres(db);
  const repoEstoqueJob = new RepositorioEstoque(db);
  const repoNotificacoesJob = new RepositorioNotificacoes(db);
  const servicoNotificacaoJob = new ServicoNotificacaoBanco(repoNotificacoesJob);
  const repoLivrosJob = new RepositorioLivrosPostgres(db);
  const repoUsuariosJob = new RepositorioUsuarios(db);

  const jobExpiracaoReservas = new JobExpiracaoReservas(
    repoReservasJob,
    repoEstoqueJob,
    servicoNotificacaoJob,
    repoLivrosJob,
    repoUsuariosJob,
    10, // 10 minutos
  );
  jobExpiracaoReservas.iniciar();

  process.on('SIGTERM', () => jobExpiracaoReservas.parar());
  process.on('SIGINT', () => jobExpiracaoReservas.parar());
} catch (erro) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  Logger.warn(`[Server] Job de expiração de reservas fora do ar. Causa: ${msg}`);
}

// Job de limpeza de tokens revocados (diário)
try {
  const jobLimpezaTokens = new JobLimpezaTokensRevocados(24); // 24 horas
  jobLimpezaTokens.iniciar();

  process.on('SIGTERM', () => jobLimpezaTokens.parar());
  process.on('SIGINT', () => jobLimpezaTokens.parar());
} catch (erro) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  Logger.warn(`[Server] Job de limpeza de tokens fora do ar. Causa: ${msg}`);
}

// Job de auto-indexacao do ChromaDB (assincrono no startup)
try {
  const jobAutoIndexacao = new JobAutoIndexacaoChromaDB();
  jobAutoIndexacao.executarAssincrono();
  Logger.info('[Server] Job de auto-indexacao do ChromaDB iniciado (assincrono)');
} catch (erro) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  Logger.warn(`[Server] Job de auto-indexacao do ChromaDB fora do ar. Causa: ${msg}`);
}

// 
// Parar simulador ao encerrar o servidor (temporariamente desabilitado)
/*
process.on('SIGTERM', () => {
  if (simulador) {
    simulador.parar();
    Logger.info('[Server] Simulador de atualização de rastreamento parado');
  }
});

process.on('SIGINT', () => {
  if (simulador) {
    simulador.parar();
    Logger.info('[Server] Simulador de atualização de rastreamento parado');
  }
});
*/

