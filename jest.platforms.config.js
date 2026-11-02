const config = require('./jest.config');

module.exports = {
  projects: ['android', 'ios'].map((platform) => ({
    ...config,
    rootDir: '.',
    displayName: platform,
    preset: `jest-expo/${platform}`,
  })),
};
