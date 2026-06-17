export interface ResultadoClassificacao {
  valido: boolean;
  motivo: string;
  confianca: number;
}

export interface IClassificadorDominio {
  classificar(entrada: string): Promise<ResultadoClassificacao>;
}
