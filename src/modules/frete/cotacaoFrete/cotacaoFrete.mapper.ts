import { ICotacaoFretePersistida, EstadoCotacaoFrete } from '@/modules/frete/IFrete.dto';

export class CotacaoFreteMapper {
  public static mapearParaEntidade(row: Record<string, unknown>): ICotacaoFretePersistida {
    return {
      cfrId: Number(row.cfr_id),
      cfrUuid: String(row.cfr_uuid),
      provedor: String(row.cfr_provedor),
      estado: row.cfr_estado as EstadoCotacaoFrete,
      tipoServico: row.cfr_tipo_servico as ICotacaoFretePersistida['tipoServico'],
      valor: Number(row.cfr_valor),
      prazoTexto: String(row.cfr_prazo_texto),
      expiraEm: new Date(String(row.cfr_expira_em)),
      venId: row.ven_id !== null ? Number(row.ven_id) : null,
    };
  }
}
