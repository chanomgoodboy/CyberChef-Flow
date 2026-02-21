import Dish from '@cyberchef/Dish.mjs';
import * as Registry from './OperationRegistry';
import { resolveArgDefault } from '@/utils/argDefaults';

/**
 * OperationAdapter wraps a single CyberChef operation for execution
 * inside the CyberWeb graph.
 *
 * Usage:
 *   const adapter = await OperationAdapter.create('To Base64');
 *   const outputDish = await adapter.execute(inputDish, ['A-Za-z0-9+/=']);
 */
export class OperationAdapter {
  /** Human-readable operation name. */
  readonly name: string;

  /** The operation class constructor obtained from the registry. */
  private readonly OpClass: new () => any;

  /** Extracted files from the last backend operation execution. */
  _lastFiles?: { name: string; size: number; data: string }[];

  private constructor(operationName: string, OpClass: new () => any) {
    this.name = operationName;
    this.OpClass = OpClass;
  }

  /**
   * Async factory — lazily loads the operation module on first use.
   */
  static async create(operationName: string): Promise<OperationAdapter> {
    const OpClass = await Registry.loadOperation(operationName);
    if (!OpClass) {
      throw new Error(
        `OperationAdapter: unknown or failed-to-load operation "${operationName}".`,
      );
    }
    return new OperationAdapter(operationName, OpClass);
  }

  /**
   * Execute the operation.
   * @param onStream  Optional callback for streaming output (backend ops).
   */
  async execute(
    inputDish: InstanceType<typeof Dish>,
    argValues: any[],
    onStream?: (accumulated: string) => void,
  ): Promise<InstanceType<typeof Dish>> {
    const op = new this.OpClass();

    // Wire streaming callback for backend operations
    if (onStream && '_onStream' in op) {
      op._onStream = onStream;
    }

    // Always build a complete ingValues array. For each arg position,
    // use the user-provided value if available, else extract a proper
    // scalar default from the arg definition.
    // Section headers like "[ASCII]" are not valid option values — substitute.
    const isSectionHeader = (v: any) => typeof v === 'string' && /^\[.+\]$/.test(v);
    const ingValues = op.args.map((arg: any, i: number) => {
      const userVal = i < argValues.length ? argValues[i] : undefined;
      if (userVal !== undefined && userVal !== null && !isSectionHeader(userVal)) {
        return userVal;
      }
      return resolveArgDefault(arg);
    });
    op.ingValues = ingValues;

    const inputTypeEnum = Dish.typeEnum(op.inputType);
    const input = await Promise.resolve(inputDish.get(inputTypeEnum));
    const result = await Promise.resolve(op.run(input, op.ingValues));
    const outputTypeEnum = Dish.typeEnum(op.outputType);
    const outputDish = new Dish(result, outputTypeEnum);

    // Copy extracted files from backend operations
    if (op._extractedFiles) {
      this._lastFiles = op._extractedFiles;
    }

    return outputDish;
  }

  /**
   * Call the operation's `present()` method for human-readable rendering.
   */
  async getPresentation(
    outputDish: InstanceType<typeof Dish>,
    argValues: any[],
  ): Promise<any> {
    const op = new this.OpClass();

    if (argValues.length > 0) {
      op.ingValues = argValues;
    }

    const presentTypeEnum = Dish.typeEnum(op.presentType ?? op.outputType);
    const data = await Promise.resolve(outputDish.get(presentTypeEnum));
    const presented = await Promise.resolve(op.present(data, op.ingValues));

    return presented;
  }
}
