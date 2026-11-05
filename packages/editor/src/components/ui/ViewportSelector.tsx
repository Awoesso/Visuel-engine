import React from 'react';
import { Radio, RadioGroup } from '@geist-ui/core';
import { useEditorStore } from '../../store';

export const ViewportSelector: React.FC = () => {
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);

  return (
    <div className="viewport-selector" style={{ marginBottom: '0.8rem' }}>
      <RadioGroup
        value={viewport}
        onChange={(v) => setViewport(v as any)}
        type="success"
        size="small"
      >
        <Radio value="desktop">Desktop</Radio>
        <Radio value="tablet">Tablet</Radio>
        <Radio value="mobile">Mobile</Radio>
      </RadioGroup>
    </div>
  );
};
