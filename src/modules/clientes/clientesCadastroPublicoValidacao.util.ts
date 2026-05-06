const CAMPOS_USUARIO = ['nome', 'cpf', 'email', 'senha', 'confirmacaoSenha'] as const;
const CAMPOS_ENDERECO = ['logradouro', 'numero', 'bairro', 'cep', 'cidade', 'estado'] as const;

function camposFaltantes(obj: Record<string, unknown>, campos: readonly string[]): string[] {
  return campos.filter((campo) => !obj[campo]);
}

/**
 * Retorna mensagem de erro de validação ou `null` se o payload estiver consistente.
 */
export function obterErroValidacaoCadastroPublico(dados: Record<string, unknown>): string | null {
  const faltandoUsuario = camposFaltantes(dados, CAMPOS_USUARIO);
  if (faltandoUsuario.length > 0) {
    return `Campos obrigatórios ausentes: ${faltandoUsuario.join(', ')}`;
  }
  if (!dados.enderecoCobranca) {
    return null;
  }
  const cob = dados.enderecoCobranca as Record<string, unknown>;
  const faltCob = camposFaltantes(cob, CAMPOS_ENDERECO);
  if (faltCob.length > 0) {
    return `Campos obrigatórios do endereço de cobrança ausentes: ${faltCob.join(', ')}`;
  }
  if (dados.enderecoEntregaIgualCobranca !== false) {
    return null;
  }
  if (!dados.enderecoEntrega) {
    return 'enderecoEntrega é obrigatório quando enderecoEntregaIgualCobranca é false';
  }
  const ent = dados.enderecoEntrega as Record<string, unknown>;
  const faltEnt = camposFaltantes(ent, CAMPOS_ENDERECO);
  if (faltEnt.length > 0) {
    return `Campos obrigatórios do endereço de entrega ausentes: ${faltEnt.join(', ')}`;
  }
  return null;
}
