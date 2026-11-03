module.exports = {
  preset: 'jest-expo',
  testEnvironment: '<rootDir>/tests/skia-environment.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  clearMocks: true,
  testTimeout: 20000,
};
