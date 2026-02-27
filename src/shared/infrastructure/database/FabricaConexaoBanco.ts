import { IConexaoBanco } from './IConexaoBanco';
import { ConexaoPostgres } from './ConexaoPostgres';

/**
 * Tabela de despacho: mapeia o nome do tipo de banco para a função que cria sua conexão.
 * Para adicionar suporte a um novo banco, inclua uma entrada neste objeto.
 */
const fabricasPorTipoBanco: Record<string, () => IConexaoBanco> = {
  postgres: () => ConexaoPostgres.obterInstancia(),
};

/**
 * Fábrica de conexão de banco de dados.
 * Lê DB_TYPE do ambiente e delega à fábrica correspondente via tabela de despacho.
 * Lança erro explícito se a variável não estiver definida ou o tipo não for suportado.
 */
export class FabricaConexaoBanco {
  private static instancia: IConexaoBanco | null = null;

  public static obterConexao(): IConexaoBanco {
    if (FabricaConexaoBanco.instancia !== null) {
      return FabricaConexaoBanco.instancia;
    }

    const tipoBanco = process.env.DB_TYPE;

    // Variável obrigatória — sem fallback para forçar configuração explícita
    if (!tipoBanco) {
      throw new Error('Variável de ambiente DB_TYPE não definida. Configure o tipo do banco de dados.');
    }

    const fabricar = fabricasPorTipoBanco[tipoBanco.toLowerCase()];

    if (!fabricar) {
      const tiposSuportados = Object.keys(fabricasPorTipoBanco).join(', ');
      throw new Error(`Banco de dados do tipo '${tipoBanco}' não é suportado. Tipos disponíveis: ${tiposSuportados}.`);
    }

    FabricaConexaoBanco.instancia = fabricar();
    return FabricaConexaoBanco.instancia;
  }
}
