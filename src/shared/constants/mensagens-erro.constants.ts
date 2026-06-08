/**
 * Constantes centralizadas para mensagens de erro do sistema.
 * Promove consistência e facilita manutenção de mensagens de erro.
 * 
 * Regra U13: Proibido strings literais em comparações de domínio.
 * Use estas constantes em vez de strings fixas para melhor type-safety.
 */
export const MENSAGENS_ERRO = {
  // Autenticação e Autorização
  USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado',
  USUARIO_NAO_ENCONTRADO_OU_INATIVO: 'Usuário não encontrado ou inativo',
  IDENTIFICADOR_USUARIO_NAO_ENCONTRADO: 'Identificador de usuário não encontrado',
  SENHA_INVALIDA: 'Senha incorreta',
  
  // Cliente
  CLIENTE_NAO_ENCONTRADO: 'Cliente não encontrado',
  
  // Venda
  VENDA_NAO_ENCONTRADA: 'Venda não encontrada',
  
  // Cupom
  CUPOM_INVALIDO: 'Cupom inválido, expirado ou não pertence ao usuário',
  TIPO_CUPOM_INVALIDO: 'Tipo de cupom inválido. Use "troca" ou "promocional".',
  ITEM_CUPOM_INVALIDO: (indice: number) => `Item de cupom inválido (índice ${indice})`,
  
  // Livro
  LIVRO_NAO_ENCONTRADO: 'Livro não encontrado',
  
  // Endereço
  ENDERECO_NAO_ENCONTRADO: 'Endereço não encontrado',
  
  // Dados inválidos
  DADOS_INVALIDOS: 'Dados de entrada inválidos',
  OPERACAO_NAO_PERMITIDA: 'Operação não permitida',
  
  // Pagamento
  PAGAMENTO_NAO_ENCONTRADO: 'Pagamento não encontrado',
  
  // Cartão
  CARTAO_NAO_ENCONTRADO: 'Cartão não encontrado',
  CARTAO_NAO_PERTENCE_AO_USUARIO: 'Cartão não encontrado ou não pertence ao usuário',
  BANDEIRA_NAO_ENCONTRADA: 'Bandeira não encontrada',
  
  // Pedido
  PEDIDO_NAO_ENCONTRADO: 'Pedido não encontrado',
  
  // Administrador
  ADMINISTRADOR_NAO_ENCONTRADO: 'Administrador não encontrado',
} as const;

/**
 * Type helper para mensagens de erro dinâmicas
 */
export type MensagemErroDinamica = {
  [K in keyof typeof MENSAGENS_ERRO]: typeof MENSAGENS_ERRO[K] extends (...args: any[]) => string ? never : K;
}[keyof typeof MENSAGENS_ERRO];
