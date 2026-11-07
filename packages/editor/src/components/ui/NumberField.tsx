import React, { useState, useEffect } from 'react';

export interface NumberFieldProps {
  label: string;
  value: string; // raw css value e.g. "12px" or "auto"
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unitOptions?: string[]; // e.g. ['px','%','rem']
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  unitOptions = ['px', 'rem', '%'],
}) => {
  const [draft, setDraft] = useState(value);
  const [unit, setUnit] = useState<string>(() => {
    const m = value.match(/([a-z%]+)$/i);
    return m?.[1] ?? 'px';
  });
  const numeric = value.replace(/[^0-9.-]/g, '');

  useEffect(() => {
    setDraft(numeric);
    const m = value.match(/([a-z%]+)$/i);
    if (m?.[1]) setUnit(m[1]);
  }, [value, numeric]);

  const commit = (newNum: string, newUnit: string) => {
    if (newNum === '' && newUnit === '') {
      onChange('');
    } else if (newNum === '' && newUnit === 'auto') {
      onChange('auto');
    } else if (newNum === '') {
      onChange('');
    } else {
      onChange(`${newNum}${newUnit}`);
    }
  };

  return (
    <div className="number-field">
      <span className="number-field-label" title={label}>
        {label}
      </span>
      <div className="number-field-controls">
        <input
          type="number"
          className="number-field-input"
          value={draft}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-label={label}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onBlur={() => commit(draft, unit)}
        />
        <select
          className="number-field-unit"
          value={unit}
          aria-label={`Unité pour ${label}`}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const nextUnit = e.target.value;
            setUnit(nextUnit);
            commit(draft, nextUnit);
          }}
        >
          {unitOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
