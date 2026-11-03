const { TestEnvironment } = require('jest-environment-node');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');

module.exports = class SkiaEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    this.global.CanvasKit = await CanvasKitInit({});
  }
};
