import * as crypto from 'crypto';

/**
 * Value Object para representar um cartão de crédito.
 * Implementa validações de negócio e segurança.
 */
export class CartaoCredito {
  private readonly numeroTokenizado: string;

  private readonly ultimosDigitos: string;

  private readonly nomeTitular: string;

  private readonly validade: string; // MM/YY

  private readonly bandeira: string;

  constructor(
    numero: string,
    nomeTitular: string,
    validade: string,
    bandeira: string
  ) {
    CartaoCredito.validarNumero(numero);
    CartaoCredito.validarNomeTitular(nomeTitular);
    CartaoCredito.validarValidade(validade);
    CartaoCredito.validarBandeira(bandeira);

    // Tokenização simples (em produção, usar serviço como PCI DSS compliant)
    this.numeroTokenizado = CartaoCredito.tokenizarNumero(numero);
    this.ultimosDigitos = numero.replace(/\s+/g, '').slice(-4);
    this.nomeTitular = nomeTitular.trim().toUpperCase();
    this.validade = validade;
    this.bandeira = bandeira;
  }

  private static validarNumero(numero: string): void {
    const numeroLimpo = numero.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(numeroLimpo)) {
      throw new Error('Número do cartão inválido');
    }
    // Algoritmo de Luhn para validação básica
    if (!CartaoCredito.validarLuhn(numeroLimpo)) {
      throw new Error('Número do cartão inválido (Luhn)');
    }
  }

  private static validarLuhn(numero: string): boolean {
    let soma = 0;
    let alternar = false;
    for (let i = numero.length - 1; i >= 0; i -= 1) {
      let digito = parseInt(numero.charAt(i), 10);
      if (alternar) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      soma += digito;
      alternar = !alternar;
    }
    return soma % 10 === 0;
  }

  private static validarNomeTitular(nome: string): void {
    if (!nome || nome.trim().length < 2) {
      throw new Error('Nome do titular inválido');
    }
  }

  private static validarValidade(validade: string): void {
    if (!/^\d{2}\/\d{2}$/.test(validade)) {
      throw new Error('Validade deve estar no formato MM/YY');
    }
    const [mes, ano] = validade.split('/').map(Number);
    if (mes < 1 || mes > 12) {
      throw new Error('Mês de validade inválido');
    }
    const anoAtual = new Date().getFullYear() % 100;
    if (ano < anoAtual || (ano === anoAtual && mes < new Date().getMonth() + 1)) {
      throw new Error('Cartão expirado');
    }
  }

  private static validarBandeira(bandeira: string): void {
    const bandeirasValidas = ['Visa', 'Mastercard', 'American Express', 'Elo'];
    if (!bandeirasValidas.includes(bandeira)) {
      throw new Error('Bandeira não suportada');
    }
  }

  private static tokenizarNumero(numero: string): string {
    // Simulação de tokenização: hash simples (não seguro para produção)
    return crypto.createHash('sha256').update(numero).digest('hex');
  }

  public getNumeroTokenizado(): string {
    return this.numeroTokenizado;
  }

  public getUltimosDigitos(): string {
    return this.ultimosDigitos;
  }

  public getNomeTitular(): string {
    return this.nomeTitular;
  }

  public getValidade(): string {
    return this.validade;
  }

  public getBandeira(): string {
    return this.bandeira;
  }

  public equals(outro: CartaoCredito): boolean {
    return (
      this.numeroTokenizado === outro.numeroTokenizado &&
      this.nomeTitular === outro.nomeTitular &&
      this.validade === outro.validade &&
      this.bandeira === outro.bandeira
    );
  }

  /**
   * Reconstitui um objeto CartaoCredito a partir de dados do banco de dados.
   * Usado pelo repositório para evitar validações e mutação de propriedades readonly.
   */
  public static reconstituir(
    numeroTokenizado: string,
    nomeTitular: string,
    validade: string,
    bandeira: string,
    ultimosDigitos: string = '0000'
  ): CartaoCredito {
    const cartao = Object.create(CartaoCredito.prototype);
    cartao.numeroTokenizado = numeroTokenizado;
    cartao.ultimosDigitos = ultimosDigitos;
    cartao.nomeTitular = nomeTitular;
    cartao.validade = validade;
    cartao.bandeira = bandeira;
    return cartao;
  }
}
