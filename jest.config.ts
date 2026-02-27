import type { Config } from 'jest';

const configuracao: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/teste.setup.ts'],
  globalTeardown: '<rootDir>/src/tests/setup/global-teardown.ts',
  clearMocks: true,
};

export default configuracao;
