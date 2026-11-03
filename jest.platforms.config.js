const config = require('./jest.config');

module.exports = {
  testTimeout: config.testTimeout,
  projects: ['android', 'ios'].map((platform) => ({
    ...config,
    rootDir: '.',
    displayName: platform,
    preset: `jest-expo/${platform}`,
  })),
};
