/**
 * Value Object para Endereço de Entrega conforme RN0023.
 */
export class EnderecoEntrega {
  private readonly cepInterno: string;

  constructor(
    public readonly tipoResidencia: string,
    public readonly tipoLogradouro: string,
    public readonly logradouro: string,
    public readonly numero: string,
    public readonly bairro: string,
    public readonly cep: string,
    public readonly cidade: string,
    public readonly estado: string,
    public readonly pais: string,
    public readonly complemento?: string,
  ) {
    this.validarCamposObrigatorios();
    this.cepInterno = EnderecoEntrega.formatarCep(cep);
    EnderecoEntrega.validarCep(this.cepInterno);
  }

  private validarCamposObrigatorios(): void {
    const regras: Array<[boolean, string]> = [
      [!this.logradouro, 'Campo rua inválido'],
      [!this.bairro, 'Campo bairro inválido'],
      [!this.cidade, 'Campo cidade inválido'],
      [!this.estado, 'Campo estado inválido'],
      [!this.numero, 'Campo numero inválido'],
      [!this.tipoResidencia, 'Campo tipo residencia inválido'],
      [!this.tipoLogradouro, 'Campo tipo logradouro inválido'],
      [!this.pais, 'Campo pais inválido'],
    ];
    const invalido = regras.find(([cond]) => cond);
    if (invalido) throw new Error(invalido[1]);
  }

  private static formatarCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  private static validarCep(cep: string): void {
    if (cep.length !== 8) {
      throw new Error('CEP inválido');
    }
  }

  public toJSON() {
    return {
      tipoResidencia: this.tipoResidencia,
      tipoLogradouro: this.tipoLogradouro,
      logradouro: this.logradouro,
      numero: this.numero,
      bairro: this.bairro,
      cep: this.cepInterno,
      cidade: this.cidade,
      estado: this.estado,
      pais: this.pais,
      complemento: this.complemento,
    };
  }
}
