import React, { useCallback } from 'react';
import type { ArgDefinition } from '@/adapter/types';
import { ArgField } from './ArgField';

/**
 * Extract the default scalar value for an arg definition.
 * For option/select types, `arg.value` is the list of options —
 * the default is the first option's value (or name).
 */
/** CyberChef uses `[Section]` / `[/Section]` as disabled group headers. */
function isSectionHeader(v: unknown): boolean {
  return typeof v === 'string' && /^\[.+\]$/.test(v);
}

function getDefaultValue(arg: ArgDefinition): any {
  const optionTypes = new Set([
    'option', 'editableOption', 'editableOptionShort', 'argSelector',
  ]);
  if (optionTypes.has(arg.type) && Array.isArray(arg.value)) {
    const first = arg.value.find((v) =>
      typeof v === 'object' ? true : !isSectionHeader(v),
    ) ?? arg.value[0];
    if (typeof first === 'object' && first !== null) {
      return first.value ?? first.name ?? '';
    }
    return first ?? '';
  }
  if (arg.type === 'populateOption' && Array.isArray(arg.value)) {
    const first = arg.value[0];
    return first?.name ?? '';
  }
  // For toggleString, default value is the object {string, option}
  if (arg.type === 'toggleString') {
    return { string: arg.value ?? '', option: arg.toggleValues?.[0] ?? '' };
  }
  return arg.value;
}

interface ArgControlsProps {
  args: ArgDefinition[];
  values: Record<string, any>;
  onChange: (argName: string, value: any) => void;
}

export const ArgControls = React.memo(function ArgControls({
  args,
  values,
  onChange,
}: ArgControlsProps) {
  if (!args || args.length === 0) {
    return null;
  }

  const handlePopulate = useCallback(
    (targetArgIndex: number, value: string) => {
      if (targetArgIndex >= 0 && targetArgIndex < args.length) {
        onChange(args[targetArgIndex].name, value);
      }
    },
    [onChange, args],
  );

  // Group consecutive boolean args in pairs for compact layout
  const rows: React.ReactNode[] = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.type === 'boolean' && i + 1 < args.length && args[i + 1].type === 'boolean') {
      // Pair two booleans
      const arg2 = args[i + 1];
      rows.push(
        <BooleanPairRow
          key={arg.name + '|' + arg2.name}
          arg1={arg}
          value1={values[arg.name] ?? getDefaultValue(arg)}
          arg2={arg2}
          value2={values[arg2.name] ?? getDefaultValue(arg2)}
          onChange={onChange}
        />,
      );
      i += 2;
    } else {
      rows.push(
        <ArgRow
          key={arg.name || i}
          arg={arg}
          value={values[arg.name] ?? getDefaultValue(arg)}
          onChange={onChange}
          onPopulate={arg.type === 'populateOption' ? handlePopulate : undefined}
        />,
      );
      i += 1;
    }
  }

  return <div className="arg-controls">{rows}</div>;
});

/* ------------------------------------------------------------------ */
/*  Internal row components                                            */
/* ------------------------------------------------------------------ */

interface ArgRowProps {
  arg: ArgDefinition;
  value: any;
  onChange: (argName: string, value: any) => void;
  onPopulate?: (targetArgIndex: number, value: string) => void;
}

const ArgRow = React.memo(function ArgRow({ arg, value, onChange, onPopulate }: ArgRowProps) {
  const handleChange = useCallback(
    (newValue: any) => {
      onChange(arg.name, newValue);
    },
    [onChange, arg.name],
  );

  // Booleans don't need the floating-label wrapper
  if (arg.type === 'boolean') {
    return (
      <label className="arg-bool-item arg-bool-single" title={arg.hint || arg.name}>
        <input
          type="checkbox"
          className="arg-checkbox"
          checked={!!value}
          onChange={(e) => onChange(arg.name, e.target.checked)}
          disabled={arg.disabled}
        />
        <span className="arg-bool-label">{arg.name}</span>
      </label>
    );
  }

  return (
    <div className="arg-field" title={arg.hint || arg.name}>
      <span className="arg-field-label">{arg.name}</span>
      <ArgField arg={arg} value={value} onChange={handleChange} onPopulate={onPopulate} />
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Boolean pair row (2 checkboxes in one line, ticks aligned)         */
/* ------------------------------------------------------------------ */

interface BooleanPairRowProps {
  arg1: ArgDefinition;
  value1: any;
  arg2: ArgDefinition;
  value2: any;
  onChange: (argName: string, value: any) => void;
}

const BooleanPairRow = React.memo(function BooleanPairRow({
  arg1, value1, arg2, value2, onChange,
}: BooleanPairRowProps) {
  return (
    <div className="arg-row-pair">
      <label className="arg-bool-item" title={arg1.hint || arg1.name}>
        <input
          type="checkbox"
          className="arg-checkbox"
          checked={!!value1}
          onChange={(e) => onChange(arg1.name, e.target.checked)}
          disabled={arg1.disabled}
        />
        <span className="arg-bool-label">{arg1.name}</span>
      </label>
      <label className="arg-bool-item" title={arg2.hint || arg2.name}>
        <input
          type="checkbox"
          className="arg-checkbox"
          checked={!!value2}
          onChange={(e) => onChange(arg2.name, e.target.checked)}
          disabled={arg2.disabled}
        />
        <span className="arg-bool-label">{arg2.name}</span>
      </label>
    </div>
  );
});
