/// <reference types="vite/client" />

declare module '@cyberchef/operations/*.mjs' {
  import Operation from '@cyberchef/Operation.mjs';
  export default class extends Operation {
    constructor(): void;
    run(input: any, args: any[]): any;
    present?(data: any, args: any[]): any;
  }
}

declare module '@cyberchef/Operation.mjs' {
  export default class Operation {
    name: string;
    module: string;
    description: string;
    infoURL: string | null;
    inputType: string;
    outputType: string;
    presentType: string;
    args: ArgConfig[];
    flowControl: boolean;
    manualBake: boolean;
    disabled: boolean;
    ingValues: any[];
    set ingValues(vals: any[]);
    get config(): { op: string; args: any[] };
    run(input: any, args: any[]): any;
    present(data: any, args: any[]): any;
  }

  interface ArgConfig {
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
}

declare module '@cyberchef/Dish.mjs' {
  export default class Dish {
    value: any;
    type: number;
    constructor(dishOrInput?: any, type?: number | null);
    static typeEnum(typeStr: string): number;
    static enumLookup(typeEnum: number): string;
    get(type: number | string): any;
    set(value: any, type: number | string): void;
    presentAs(type: number | string): any;
    clone(): Dish;
    get size(): number;
    getTitle(maxLength: number): Promise<string>;
    valid(): boolean;

    static BYTE_ARRAY: number;
    static STRING: number;
    static NUMBER: number;
    static HTML: number;
    static ARRAY_BUFFER: number;
    static BIG_NUMBER: number;
    static JSON: number;
    static FILE: number;
    static LIST_FILE: number;
  }
}

declare module '@cyberchef/config/Categories.json' {
  const categories: Array<{ name: string; ops: string[] }>;
  export default categories;
}

declare module '@cyberchef/Utils.mjs' {
  export function isNodeEnvironment(): boolean;
  export default class Utils {
    static truncate(str: string, maxLen: number): string;
    static parseEscapedChars(str: string): string;
  }
}
