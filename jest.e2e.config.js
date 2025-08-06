module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.e2e.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/e2e-setup.ts'],
  testTimeout: 30000, 
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**'
  ]
}; 