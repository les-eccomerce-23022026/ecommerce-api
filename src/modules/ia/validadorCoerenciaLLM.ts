import { Logger } from '@/shared/utils/Logger.util';
import { AdapterLangChainGemini } from './adapterLangChainGemini';
import { ProdutoRecomendado } from './validadorSemanticaDinamico';

/**
 * Resultado da validação via LLM
 */
export interface ResultadoValidacaoLLM {
  valido: boolean;
  motivo: string;
  confianca?: number;
}

/**
 * Validador de Coerência via LLM
 * 
 * Responsável por validar coerência semântica usando LLM para detectar incoerências sutis.
 * Implementa a Camada 3 do sistema de detecção de alucinações.
 * 
 * Estratégia:
 * - Usa LLM para validar coerência semântica
 * - Analisa: tema + objetivo + contexto
 * - Rejeita se LLM indicar incoerência
 * - Ativado condicionalmente (similaridade 0.35-0.50)
 * 
 * Custo: 150-300ms, 100-200 tokens (prompt LLM)
 * Ganho: Detecta ~80% das alucinações sutis
 */
export class ValidadorCoerenciaLLM {
  constructor(private adapterLangChain: AdapterLangChainGemini) {}

  /**
   * Valida coerência semântica usando LLM
   * Detecta incoerências sutis que embeddings não capturam
   * 
   * @param query - Query do usuário
   * @param produtosRecomendados - Lista de produtos recomendados
   * @returns Resultado da validação LLM
   */
  async validarCoerenciaContextual(
    query: string,
    produtosRecomendados: ProdutoRecomendado[]
  ): Promise<ResultadoValidacaoLLM> {
    if (produtosRecomendados.length === 0) {
      return { valido: true, motivo: 'sem_produtos' };
    }

    try {
      // Constrói prompt de validação
      const prompt = this.construirPromptValidacao(query, produtosRecomendados);

      // Chama LLM para validação
      const resposta = await this.adapterLangChain.validarCoerencia(prompt);

      // Analisa resposta
      const analise = this.analisarRespostaLLM(resposta);

      if (!analise.valido) {
        Logger.warn(
          `[ValidadorLLM] Incoerência detectada por LLM: "${analise.motivo}" ` +
          `(confiança: ${analise.confianca?.toFixed(2)})`
        );
      }

      return analise;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ValidadorLLM] Erro na validação LLM: ${mensagem}`);
      
      // Em caso de erro, permite passar (fail-safe)
      return { valido: true, motivo: 'erro_validacao', confianca: 0 };
    }
  }

  /**
   * Constrói prompt de validação para o LLM
   * 
   * @param query - Query do usuário
   * @param produtos - Lista de produtos recomendados
   * @returns Prompt de validação
   */
  private construirPromptValidacao(
    query: string,
    produtos: ProdutoRecomendado[]
  ): string {
    const produtosTexto = produtos
      .slice(0, 3) // Analisa apenas top 3 para economizar tokens
      .map(p => `- "${p.metadados.titulo}" (${p.metadados.categoria})`)
      .join('\n');

    return `Analise se a seguinte query de recomendação de livros faz sentido semanticamente:

Query: "${query}"

Produtos recomendados:
${produtosTexto}

Responda APENAS com um JSON válido (sem markdown, sem formatação):
{
  "coerente": true/false,
  "motivo": "explicação breve se incoerente",
  "confianca": 0.0-1.0
}

Considerações:
- A query combina gêneros/temas de forma absurda?
- O objetivo da query é compatível com os gêneros?
- Há contradições lógicas óbvias?
- A query pede algo fisicamente impossível?`;
  }

  /**
   * Analisa resposta do LLM
   * 
   * @param resposta - Resposta do LLM
   * @returns Resultado da validação
   */
  private analisarRespostaLLM(resposta: string): ResultadoValidacaoLLM {
    try {
      // Remove markdown se presente
      const respostaLimpa = resposta
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const json = JSON.parse(respostaLimpa);
      
      return {
        valido: json.coerente !== false,
        motivo: json.motivo || 'coerente',
        confianca: json.confianca || 0.5
      };
    } catch (erro) {
      Logger.error('[ValidadorLLM] Erro ao parsear resposta LLM', erro instanceof Error ? erro.message : String(erro));
      return { valido: true, motivo: 'erro_parse', confianca: 0 };
    }
  }
}
