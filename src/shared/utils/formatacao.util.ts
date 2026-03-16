/**
 * Converte recursivamente todas as chaves de um objeto de snake_case para camelCase.
 * 
 * @param obj Objeto a ser convertido.
 * @returns Novo objeto com chaves em camelCase.
 */
export function snakeParaCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((v) => snakeParaCamel(v));
  }
  if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    const objeto = obj as Record<string, unknown>;
    return Object.keys(objeto).reduce(
      (acc, key) => ({
        ...acc,
        [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: snakeParaCamel(objeto[key]),
      }),
      {}
    );
  }
  return obj;
}

/**
 * Converte recursivamente todas as chaves de um objeto de camelCase para snake_case.
 * 
 * @param obj Objeto a ser convertido.
 * @returns Novo objeto com chaves em snake_case.
 */
export function camelParaSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelParaSnake(v));
  }
  if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    const objeto = obj as Record<string, unknown>;
    return Object.keys(objeto).reduce(
      (acc, key) => ({
        ...acc,
        [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: camelParaSnake(objeto[key]),
      }),
      {}
    );
  }
  return obj;
}
