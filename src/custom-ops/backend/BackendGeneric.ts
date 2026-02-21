import { BackendOperation, registerBackendOp } from './_base';
import * as BackendClient from '../../worker/BackendClient';

const NAME = 'Generic Backend Tool';

class BackendGeneric extends BackendOperation {
  constructor() {
    super();
    this.toolName = ''; // set dynamically from args
    this.name = NAME;
    this.description = 'Run any tool available on the backend server. Specify the tool name and raw arguments.';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Tool Name', type: 'string', value: '' },
      { name: 'Raw Arguments', type: 'string', value: '' },
    ];
  }

  async run(input: any, args: any[]): Promise<string> {
    const toolName = (args[0] as string).trim();
    if (!toolName) {
      throw new Error('Tool name is required.');
    }
    if (BackendClient.getStatus() !== 'connected') {
      throw new Error('Backend not connected. Enable in Settings \u2192 Backend.');
    }
    if (!BackendClient.isToolAvailable(toolName)) {
      throw new Error(`Tool "${toolName}" not available on backend server.`);
    }

    const result = await BackendClient.execute(toolName, input, {
      raw: args[1] as string,
    });

    return this.formatResult(result);
  }
}

registerBackendOp(BackendGeneric, {
  name: NAME,
  description: 'Run any tool available on the backend server. Specify the tool name and raw arguments.',
  infoURL: null,
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Tool Name', type: 'string', value: '' },
    { name: 'Raw Arguments', type: 'string', value: '' },
  ],
});
