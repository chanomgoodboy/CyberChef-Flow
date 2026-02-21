import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'FFprobe (Backend)';

class BackendFfprobe extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'ffprobe';
    this.name = NAME;
    this.description = 'Analyze audio/video/image metadata using ffprobe.';
    this.infoURL = 'https://ffmpeg.org/ffprobe.html';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Output Format', type: 'option', value: ['Text', 'JSON'] },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return { format: (args[0] as string).toLowerCase() };
  }
}

registerBackendOp(BackendFfprobe, {
  name: NAME,
  description: 'Analyze audio/video/image metadata using ffprobe.',
  infoURL: 'https://ffmpeg.org/ffprobe.html',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Output Format', type: 'option', value: ['Text', 'JSON'] },
  ],
});
