/**
 * Converte recursivamente todas as chaves de um objeto de snake_case para camelCase.
 * 
 * @param obj Objeto a ser convertido.
 * @returns Novo objeto com chaves em camelCase.
 */
export function snakeParaCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => snakeParaCamel(v));
  }
  if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: snakeParaCamel(obj[key]),
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
export function camelParaSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelParaSnake(v));
  }
  if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: camelParaSnake(obj[key]),
      }),
      {}
    );
  }
  return obj;
}
