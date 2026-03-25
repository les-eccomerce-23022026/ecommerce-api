/**
 * Converte recursivamente todas as chaves de um objeto de snake_case para camelCase.
 *
 * @param obj Objeto a ser convertido.
 * @returns Novo objeto com chaves em camelCase.
 */
export function snakeParaCamel<T = Record<string, unknown>>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => snakeParaCamel(v)) as unknown as T;
  }
  if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: snakeParaCamel((obj as Record<string, unknown>)[key]),
      }),
      {}
    ) as T;
  }
  return obj as T;
}

/**
 * Converte recursivamente todas as chaves de um objeto de camelCase para snake_case.
 *
 * @param obj Objeto a ser convertido.
 * @returns Novo objeto com chaves em snake_case.
 */
export function camelParaSnake<T = Record<string, unknown>>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelParaSnake(v)) as unknown as T;
  }
  if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: camelParaSnake((obj as Record<string, unknown>)[key]),
      }),
      {}
    ) as T;
  }
  return obj as T;
}
