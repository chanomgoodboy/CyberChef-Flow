export interface ArgDefinition {
  name: string;
  type: string;
  value: any;
  toggleValues?: string[];
  hint?: string;
  rows?: number;
  disabled?: boolean;
  target?: number;
  defaultIndex?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface OperationMeta {
  name: string;
  module: string;
  description: string;
  infoURL: string | null;
  inputType: string;
  outputType: string;
  args: ArgDefinition[];
  flowControl: boolean;
}

export interface CategoryInfo {
  name: string;
  ops: string[];
}

export interface DishData {
  value: any;
  type: number;
}

export interface ExecutionRequest {
  nodeId: string;
  opName: string;
  args: any[];
  dishData: DishData;
}

export interface ExecutionResult {
  nodeId: string;
  dishData: DishData;
  duration: number;
  error?: string;
  presentedValue?: string;
}
