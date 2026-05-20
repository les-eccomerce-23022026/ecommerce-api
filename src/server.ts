import dotenv from 'dotenv';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import { Logger } from '@/shared/utils/Logger.util';
import { SimuladorAtualizacaoRastreamento } from '@/modules/logistica-mocks/SimuladorAtualizacaoRastreamento';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { RepositorioEventoRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioEventoRastreamentoPostgres';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';

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
});

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

