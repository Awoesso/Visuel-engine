import React, { useState, useEffect } from 'react';
import { Input, Select, Tooltip } from '@geist-ui/core';

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
  const [unit, setUnit] = useState(() => {
    const m = value.match(/([a-z%]+)$/i);
    return m ? m[1] : 'px';
  });
  const numeric = value.replace(/[^0-9.-]/g, '');

  useEffect(() => {
    setDraft(numeric);
    const m = value.match(/([a-z%]+)$/i);
    if (m) setUnit(m[1]);
  }, [value]);

  const commit = (newNum: string, newUnit: string) => {
    if (newNum === '' && newUnit === '') {
      onChange('');
    } else if (newNum === '' && newUnit === 'auto') {
      onChange('auto');
    } else {
      onChange(`${newNum}${newUnit}`);
    }
  };

  return (
    <div className="number-field">
      <Tooltip text={label} placement="topLeft">
        <span>{label}</span>
      </Tooltip>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <Input
          type="number"
          value={draft}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft, unit)}
          width="70%"
        />
        <Select
          value={unit}
          onChange={(val) => {
            setUnit(val as string);
            commit(draft, val as string);
          }}
          width="30%"
        >
          {unitOptions.map((u) => (
            <Select.Option key={u} value={u}>
              {u}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};
