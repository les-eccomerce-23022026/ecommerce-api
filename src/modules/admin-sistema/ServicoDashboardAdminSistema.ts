import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';
import { Logger } from '@/shared/utils/Logger.util';

export interface ICadastradosPorMes {
  mes: string;
  quantidade: number;
}

export interface IDashboardAdminSistemaDto {
  clientes: {
    total: number;
    ativos: number;
    inativos: number;
    crescimentoMes: number;
    cadastradosPorMes: ICadastradosPorMes[];
  };
  administradores: {
    total: number;
    ativos: number;
    inativos: number;
  };
}

export class ServicoDashboardAdminSistema {
  constructor(private readonly db: IConexaoBanco) {}

  async obterDashboard(): Promise<IDashboardAdminSistemaDto> {
    Logger.info('[ServicoDashboardAdminSistema] Obtendo métricas do dashboard');

    const agora = new Date();
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMesAtual = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
    const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);

    const [
      clientesTotal,
      clientesAtivos,
      novosMesAtual,
      novosMesAnterior,
      adminsTotal,
      adminsAtivos,
    ] = await Promise.all([
      this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1`,
        [PAPEL_CLIENTE.descricao],
      ),
      this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1
           AND u.usu_ativo = TRUE`,
        [PAPEL_CLIENTE.descricao],
      ),
      this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1
           AND u.usu_criado_em >= $2
           AND u.usu_criado_em <= $3`,
        [PAPEL_CLIENTE.descricao, inicioMesAtual, fimMesAtual],
      ),
      this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1
           AND u.usu_criado_em >= $2
           AND u.usu_criado_em <= $3`,
        [PAPEL_CLIENTE.descricao, inicioMesAnterior, fimMesAnterior],
      ),
      this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1`,
        [PAPEL_ADMIN.descricao],
      ),
      this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1
           AND u.usu_ativo = TRUE`,
        [PAPEL_ADMIN.descricao],
      ),
    ]);

    const crescimentoMes =
      novosMesAnterior > 0
        ? Math.round(((novosMesAtual - novosMesAnterior) / novosMesAnterior) * 100 * 10) / 10
        : novosMesAtual > 0
          ? 100
          : 0;

    const cadastradosPorMes = await this.obterCadastradosPorMes(agora);

    Logger.info('[ServicoDashboardAdminSistema] Métricas obtidas com sucesso', {
      clientesTotal,
      adminsTotal,
    });

    return {
      clientes: {
        total: clientesTotal,
        ativos: clientesAtivos,
        inativos: clientesTotal - clientesAtivos,
        crescimentoMes,
        cadastradosPorMes,
      },
      administradores: {
        total: adminsTotal,
        ativos: adminsAtivos,
        inativos: adminsTotal - adminsAtivos,
      },
    };
  }

  private async obterCadastradosPorMes(agora: Date): Promise<ICadastradosPorMes[]> {
    const meses: ICadastradosPorMes[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const label = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      const labelFormatado = label.charAt(0).toUpperCase() + label.slice(1);

      const quantidade = await this.contarScalarInt(
        `SELECT COUNT(DISTINCT u.usu_id)::int AS c
         FROM livraria_gestao.usuarios u
         INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
         INNER JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
         WHERE p.pap_descricao = $1
           AND u.usu_criado_em >= $2
           AND u.usu_criado_em <= $3`,
        [PAPEL_CLIENTE.descricao, inicio, fim],
      );

      meses.push({ mes: labelFormatado, quantidade });
    }

    return meses;
  }

  private async contarScalarInt(sql: string, params: DbParametro[]): Promise<number> {
    const resultado = await this.db.executar<{ c: number }>(sql, params);
    return resultado[0]?.c ?? 0;
  }
}
