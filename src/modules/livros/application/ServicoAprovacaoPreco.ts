import { IAprovacaoPrecoLivro } from '@/modules/livros/domain/IAprovacaoPrecoLivro';
import { RepositorioAprovacaoPrecoPostgres } from '@/modules/livros/infrastructure/RepositorioAprovacaoPrecoPostgres';
import { VerificadorMargemPreco } from '@/modules/livros/application/VerificadorMargemPreco';

interface ISolicitarAprovacaoParams {
  livroUuid: string;
  lojaUuid: string;
  solicitanteUuid: string;
  precoAtual: number;
  precoSolicitado: number;
  valorCusto: number;
  margemGrupo: number;
  justificativa: string;
}

export class ServicoAprovacaoPreco {
  constructor(
    private readonly repositorioAprovacao: RepositorioAprovacaoPrecoPostgres,
    private readonly verificador: VerificadorMargemPreco,
  ) {}

  async solicitarAprovacao(dados: ISolicitarAprovacaoParams): Promise<IAprovacaoPrecoLivro> {
    const resultado = this.verificador.verificar(dados.precoSolicitado, dados.valorCusto, dados.margemGrupo);

    if (!resultado.aprovacaoNecessaria) {
      throw new Error('Preço não requer aprovação gerencial.');
    }

    return this.repositorioAprovacao.criar({
      livroUuid: dados.livroUuid,
      lojaUuid: dados.lojaUuid,
      solicitanteUuid: dados.solicitanteUuid,
      precoAtual: dados.precoAtual,
      precoSolicitado: dados.precoSolicitado,
      margemGrupo: dados.margemGrupo,
      margemCalculada: resultado.margemCalculada,
      justificativa: dados.justificativa,
    });
  }

  async aprovarSolicitacao(uuid: string, aprovadorUuid: string, observacao?: string): Promise<void> {
    await this.repositorioAprovacao.aprovar(uuid, aprovadorUuid, observacao);
  }

  async rejeitarSolicitacao(uuid: string, aprovadorUuid: string, motivo: string): Promise<void> {
    await this.repositorioAprovacao.rejeitar(uuid, aprovadorUuid, motivo);
  }

  async listarPendentes(lojaUuid?: string): Promise<IAprovacaoPrecoLivro[]> {
    return this.repositorioAprovacao.listarPendentes(lojaUuid);
  }
}
