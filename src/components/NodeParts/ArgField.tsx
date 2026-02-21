import React, { useCallback, useState } from 'react';
import { NumberInput } from '@/components/NumberInput';
import { WordlistBrowser } from '@/components/Modals/WordlistBrowser';
import { useBackendStore } from '@/store/backendStore';
import type { ArgDefinition } from '@/adapter/types';

interface ArgFieldProps {
  arg: ArgDefinition;
  value: any;
  onChange: (value: any) => void;
  /** Callback for populateOption: sets the target arg's value */
  onPopulate?: (targetArgIndex: number, value: string) => void;
}

const isWordlistArg = (arg: ArgDefinition) =>
  /wordlist/i.test(arg.name ?? '');

export const ArgField = React.memo(function ArgField({
  arg,
  value,
  onChange,
  onPopulate,
}: ArgFieldProps) {
  const [browserOpen, setBrowserOpen] = useState(false);
  const backendConnected = useBackendStore((s) => s.status === 'connected');

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      onChange(isNaN(num) ? 0 : num);
    },
    [onChange],
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    },
    [onChange],
  );

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  switch (arg.type) {
    case 'string':
    case 'shortString':
    case 'binaryString':
    case 'binaryShortString': {
      const showBrowse = isWordlistArg(arg) && backendConnected;
      const input = (
        <input
          type="text"
          className="arg-input arg-text"
          value={value ?? ''}
          onChange={handleTextChange}
          placeholder={arg.hint || ''}
          disabled={arg.disabled}
        />
      );
      if (!showBrowse) return input;
      return (
        <>
          <div className="arg-browse-wrap">
            {input}
            <button
              className="arg-browse-btn"
              onClick={() => setBrowserOpen(true)}
              title="Browse wordlists"
            >
              <i className="fa-solid fa-folder-open" />
            </button>
          </div>
          <WordlistBrowser
            isOpen={browserOpen}
            onClose={() => setBrowserOpen(false)}
            onSelect={(path) => onChange(path)}
          />
        </>
      );
    }

    case 'number':
      return (
        <NumberInput
          className="arg-input arg-number nodrag nowheel"
          value={value ?? 0}
          onChange={handleNumberChange}
          min={arg.min}
          max={arg.max}
          step={arg.step}
          disabled={arg.disabled}
        />
      );

    case 'boolean':
      return (
        <label className="arg-checkbox-label">
          <input
            type="checkbox"
            className="arg-checkbox"
            checked={!!value}
            onChange={handleCheckboxChange}
            disabled={arg.disabled}
          />
        </label>
      );

    case 'populateOption': {
      // A dropdown whose selection populates another arg (the target).
      // arg.value is an array of {name, value} objects.
      const popOptions = Array.isArray(arg.value) ? arg.value : [];
      const targetIdx = arg.target ?? -1;
      const popDefault = popOptions[0]?.name ?? '';
      const popVal = typeof value === 'string' ? value : popDefault;
      return (
        <select
          className="arg-input arg-select"
          value={popVal}
          onChange={(e) => {
            onChange(e.target.value);
            // Populate the target arg with the selected option's value
            if (onPopulate && targetIdx >= 0) {
              const selected = popOptions.find(
                (o: any) => (o.name ?? '') === e.target.value,
              );
              if (selected) {
                onPopulate(targetIdx, selected.value ?? '');
              }
            }
          }}
          disabled={arg.disabled}
        >
          {popOptions.map((opt: any, i: number) => (
            <option key={i} value={opt.name ?? ''}>
              {opt.name ?? ''}
            </option>
          ))}
        </select>
      );
    }

    case 'option':
    case 'editableOption':
    case 'editableOptionShort':
    case 'argSelector': {
      const rawOptions = Array.isArray(arg.value) ? arg.value : [];
      // CyberChef options can be strings or objects with {name, value}.
      // Bracket-wrapped strings like "[ASCII]" are section headers (disabled).
      const isHeader = (v: any) => typeof v === 'string' && /^\[.+\]$/.test(v);
      const options = rawOptions.map((opt: any) =>
        typeof opt === 'object' && opt !== null
          ? { label: opt.name ?? String(opt.value ?? ''), val: opt.value ?? opt.name ?? '', disabled: false }
          : { label: String(opt), val: String(opt), disabled: isHeader(opt) },
      );
      const firstSelectable = options.find((o) => !o.disabled) ?? options[0];
      const defaultVal = firstSelectable?.val ?? '';
      // Ensure scalar value for <select>
      const selectVal = (typeof value === 'object' && value !== null) ? defaultVal : (value ?? defaultVal);
      return (
        <select
          className="arg-input arg-select"
          value={selectVal}
          onChange={handleSelectChange}
          disabled={arg.disabled}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.val} disabled={opt.disabled}>
              {opt.disabled ? opt.label.slice(1, -1) : opt.label}
            </option>
          ))}
        </select>
      );
    }

    case 'toggleString': {
      const toggleOpts = arg.toggleValues ?? [];
      return (
        <div className="arg-toggle-string">
          <input
            type="text"
            className="arg-input arg-text arg-toggle-text"
            value={typeof value === 'object' ? value?.string ?? '' : value ?? ''}
            onChange={(e) => {
              if (typeof value === 'object') {
                onChange({ ...value, string: e.target.value });
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={arg.hint || ''}
            disabled={arg.disabled}
          />
          {toggleOpts.length > 0 && (
            <select
              className="arg-input arg-toggle-select"
              value={typeof value === 'object' ? value?.option ?? toggleOpts[0] : toggleOpts[0]}
              onChange={(e) => {
                if (typeof value === 'object') {
                  onChange({ ...value, option: e.target.value });
                } else {
                  onChange({ string: value ?? '', option: e.target.value });
                }
              }}
              disabled={arg.disabled}
            >
              {toggleOpts.map((opt: string, i: number) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      );
    }

    case 'text':
      return (
        <textarea
          className="arg-input arg-textarea"
          value={value ?? ''}
          onChange={handleTextChange}
          rows={arg.rows || 3}
          placeholder={arg.hint || ''}
          disabled={arg.disabled}
        />
      );

    default:
      // Fallback for unknown arg types
      return (
        <input
          type="text"
          className="arg-input arg-text"
          value={typeof value === 'string' ? value : JSON.stringify(value ?? '')}
          onChange={handleTextChange}
          placeholder={arg.hint || ''}
          disabled={arg.disabled}
        />
      );
  }
});
