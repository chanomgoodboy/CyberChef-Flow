import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'FFmpeg Extract (Backend)';

class BackendFfmpeg extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'ffmpeg';
    this.name = NAME;
    this.description = 'Extract frames, audio, or spectrogram from media files.';
    this.infoURL = 'https://ffmpeg.org/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Frames', 'Audio', 'Spectrogram'] },
      { name: 'FPS (frames mode)', type: 'number', value: 1 },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      mode: (args[0] as string).toLowerCase(),
      fps: args[1] as number,
    };
  }
}

registerBackendOp(BackendFfmpeg, {
  name: NAME,
  description: 'Extract frames, audio, or spectrogram from media files.',
  infoURL: 'https://ffmpeg.org/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Frames', 'Audio', 'Spectrogram'] },
    { name: 'FPS (frames mode)', type: 'number', value: 1 },
  ],
});
