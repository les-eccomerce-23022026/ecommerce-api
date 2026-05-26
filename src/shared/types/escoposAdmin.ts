/**
 * Escopos de acesso para administradores.
 * Define o nível de autorização de um admin em relação às lojas.
 */

export interface IEscopoAdmin {
  descricao: string;
}

/**
 * Escopo SISTEMA: Administrador do sistema com acesso global a todas as lojas.
 * Pode gerenciar qualquer loja sem restrições.
 */
export const ESCOPO_SISTEMA: IEscopoAdmin = {
  descricao: 'SISTEMA',
};

/**
 * Escopo LOJA: Administrador de loja com acesso restrito à loja atribuída.
 * Só pode gerenciar a loja específica para a qual foi associado.
 */
export const ESCOPO_LOJA: IEscopoAdmin = {
  descricao: 'LOJA',
};

/**
 * Mapa de escopos para validação e despacho.
 * Facilita verificações de tipo seguro sem strings literais.
 */
export const ESCOPOS_ADMIN = {
  SISTEMA: ESCOPO_SISTEMA.descricao,
  LOJA: ESCOPO_LOJA.descricao,
} as const;

/**
 * Tipo para valores válidos de escopo.
 */
export type TipoEscopoAdmin = typeof ESCOPOS_ADMIN[keyof typeof ESCOPOS_ADMIN];
