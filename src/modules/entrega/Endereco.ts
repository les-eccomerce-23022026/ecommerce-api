/**
 * Value Object para Endereço de Entrega conforme RN0023.
 */
export class EnderecoEntrega {
  private readonly _cep: string;

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
    this._cep = this.formatarCep(cep);
    this.validarCep(this._cep);
  }

  private validarCamposObrigatorios(): void {
    if (!this.logradouro) throw new Error('Campo rua inválido');
    if (!this.bairro) throw new Error('Campo bairro inválido');
    if (!this.cidade) throw new Error('Campo cidade inválido');
    if (!this.estado) throw new Error('Campo estado inválido');
    if (!this.numero) throw new Error('Campo numero inválido');
    if (!this.tipoResidencia) throw new Error('Campo tipo residencia inválido');
    if (!this.tipoLogradouro) throw new Error('Campo tipo logradouro inválido');
    if (!this.pais) throw new Error('Campo pais inválido');
  }

  private formatarCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  private validarCep(cep: string): void {
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
      cep: this._cep,
      cidade: this.cidade,
      estado: this.estado,
      pais: this.pais,
      complemento: this.complemento,
    };
  }
}
