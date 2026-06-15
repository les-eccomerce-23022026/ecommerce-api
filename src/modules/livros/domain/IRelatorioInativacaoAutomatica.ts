export interface IRelatorioInativacaoAutomatica {
  totalVerificados: number;
  totalInativados: number;
  valorMinimoUtilizado: number;
  livrosInativados: Array<{ uuid: string; titulo: string; preco: number }>;
  executadoEm: Date;
}
