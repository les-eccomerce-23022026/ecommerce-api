import type { Config } from 'jest';

const configuracao: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!uuid)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/teste.setup.ts'],
  globalTeardown: '<rootDir>/src/tests/setup/global-teardown.ts',
  clearMocks: true,
  maxWorkers: 1, // Executa testes sequencialmente
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html'],
};

export default configuracao;
