import { snakeParaCamel, camelParaSnake } from '@/shared/utils/formatacao.util';

describe('Utilitários de Formatação de Chaves', () => {
  describe('snakeParaCamel', () => {
    it('deve converter chaves de snake_case para camelCase em um objeto simples', () => {
      const entrada = { chave_teste: 'valor_teste', nome_usuario: 'João', idade: 30 };
      const esperado = { chaveTeste: 'valor_teste', nomeUsuario: 'João', idade: 30 };
      expect(snakeParaCamel(entrada)).toEqual(esperado);
    });

    it('deve converter chaves aninhadas', () => {
      const entrada = {
        dados_usuario: {
          id_usuario: 1,
          detalhes_conta: {
            data_criacao: '2023-01-01',
          },
        },
      };
      const esperado = {
        dadosUsuario: {
          idUsuario: 1,
          detalhesConta: {
            dataCriacao: '2023-01-01',
          },
        },
      };
      expect(snakeParaCamel(entrada)).toEqual(esperado);
    });

    it('deve converter chaves de objetos dentro de arrays', () => {
      const entrada = [
        { id_usuario: 1, nome_usuario: 'A' },
        { id_usuario: 2, nome_usuario: 'B' },
      ];
      const esperado = [
        { idUsuario: 1, nomeUsuario: 'A' },
        { idUsuario: 2, nomeUsuario: 'B' },
      ];
      expect(snakeParaCamel(entrada)).toEqual(esperado);
    });

    it('NÃO deve converter o conteúdo de strings fora de chaves de objeto', () => {
      const entradaStr = 'snake_case_string';
      expect(snakeParaCamel(entradaStr)).toBe('snake_case_string');
    });

    it('NÃO deve converter o conteúdo de arrays de strings', () => {
      const entradaArr = ['snake_case', 'outra_string_snake'];
      expect(snakeParaCamel(entradaArr)).toEqual(['snake_case', 'outra_string_snake']);
    });

    it('deve lidar corretamente com null e undefined', () => {
      expect(snakeParaCamel(null)).toBeNull();
      expect(snakeParaCamel(undefined)).toBeUndefined();
    });

    it('NÃO deve modificar objetos do tipo Date', () => {
      const data = new Date();
      expect(snakeParaCamel(data)).toEqual(data);
    });
  });

  describe('camelParaSnake', () => {
    it('deve converter chaves de camelCase para snake_case em um objeto simples', () => {
      const entrada = { chaveTeste: 'valorTeste', nomeUsuario: 'João', idade: 30 };
      const esperado = { chave_teste: 'valorTeste', nome_usuario: 'João', idade: 30 };
      expect(camelParaSnake(entrada)).toEqual(esperado);
    });

    it('deve lidar corretamente com arrays e valores aninhados', () => {
      const entrada = {
        dadosUsuario: [
          { dataCriacao: '2023' }
        ]
      };
      const esperado = {
        dados_usuario: [
          { data_criacao: '2023' }
        ]
      };
      expect(camelParaSnake(entrada)).toEqual(esperado);
    });
  });
});
