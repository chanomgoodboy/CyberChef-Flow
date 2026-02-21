import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'OCR / Tesseract (Backend)';

class BackendTesseract extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'tesseract';
    this.name = NAME;
    this.description = 'Extract text from images using Tesseract OCR.';
    this.infoURL = 'https://github.com/tesseract-ocr/tesseract';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Language', type: 'string', value: 'eng' },
      { name: 'PSM (Page Segmentation)', type: 'option', value: ['Auto', '0', '1', '3', '4', '6', '7', '8', '10', '11', '12', '13'] },
    ];
  }

  protected buildToolArgs(args: any[]) {
    const psm = args[1] as string;
    return {
      language: args[0] as string,
      psm: psm === 'Auto' ? undefined : psm,
    };
  }
}

registerBackendOp(BackendTesseract, {
  name: NAME,
  description: 'Extract text from images using Tesseract OCR.',
  infoURL: 'https://github.com/tesseract-ocr/tesseract',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Language', type: 'string', value: 'eng' },
    { name: 'PSM (Page Segmentation)', type: 'option', value: ['Auto', '0', '1', '3', '4', '6', '7', '8', '10', '11', '12', '13'] },
  ],
});
