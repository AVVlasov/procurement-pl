module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/stubs'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx', '**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/e2e/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs)/)',
  ],
  collectCoverage: true,
  coverageDirectory: 'reports',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'stubs/**/*.js',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        isolatedModules: true,
      },
    }],
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: false,
    },
  },
}
