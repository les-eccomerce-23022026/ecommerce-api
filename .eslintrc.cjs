/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'security'],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    complexity: ['error', { max: 15 }],
    'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/prefer-default-export': 'off',
    'security/detect-object-injection': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'no-undef': 'off',
        // Airbnb usa as regras core, que não reconhecem parameter properties do TS.
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',
        'no-empty-function': ['error', { allow: ['constructors'] }],
      },
    },
    {
      // Arquivos de teste podem importar dependências de dev (ex: supertest, jest)
      files: ['src/tests/**/*.{ts,tsx}'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['src/modules/clientes/gestao-identidade-cliente-endereco.service.ts'],
      rules: {
        'no-param-reassign': [
          'error',
          {
            props: true,
            ignorePropertyModificationsFor: ['ref'],
          },
        ],
      },
    },
  ],
};
