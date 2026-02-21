import React, { useCallback } from 'react';

interface NumberInputProps {
  value: number | '';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

function NumberInputInner({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  disabled,
}: NumberInputProps) {
  const nudge = useCallback(
    (delta: number) => {
      const cur = typeof value === 'number' ? value : 0;
      let next = cur + delta;
      if (min != null) next = Math.max(min, next);
      if (max != null) next = Math.min(max, next);
      // Synthesise a change event-like object
      const fake = { target: { value: String(next) } } as React.ChangeEvent<HTMLInputElement>;
      onChange(fake);
    },
    [value, onChange, min, max],
  );

  return (
    <span className="num-input-wrap">
      <input
        type="number"
        className={className}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {!disabled && (
        <span className="num-input-btns">
          <button
            type="button"
            className="num-input-btn"
            onClick={() => nudge(step)}
            tabIndex={-1}
          >
            <i className="fa-solid fa-caret-up" />
          </button>
          <button
            type="button"
            className="num-input-btn"
            onClick={() => nudge(-step)}
            tabIndex={-1}
          >
            <i className="fa-solid fa-caret-down" />
          </button>
        </span>
      )}
    </span>
  );
}

export const NumberInput = React.memo(NumberInputInner);
