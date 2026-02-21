import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'ImageMagick Identify (Backend)';

class BackendIdentify extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'identify';
    this.name = NAME;
    this.description = 'Detailed image analysis using ImageMagick identify.';
    this.infoURL = 'https://imagemagick.org/script/identify.php';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [];
  }

  protected buildToolArgs() {
    return {};
  }
}

registerBackendOp(BackendIdentify, {
  name: NAME,
  description: 'Detailed image analysis using ImageMagick identify.',
  infoURL: 'https://imagemagick.org/script/identify.php',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [],
});
