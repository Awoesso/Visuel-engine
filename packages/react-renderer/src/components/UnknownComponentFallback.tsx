import React from 'react';
import type { ComponentNode } from '@dsk/core';
import type { RendererMode } from '../types';

interface UnknownComponentFallbackProps {
  node: ComponentNode;
  mode: RendererMode;
}

export const UnknownComponentFallback: React.FC<UnknownComponentFallbackProps> = ({
  node,
  mode,
}) => {
  // In production storefront render mode, render an unobtrusive fallback
  if (mode === 'render') {
    return <div data-dsk-unknown-node={node.id} style={{ display: 'none' }} aria-hidden="true" />;
  }

  // In preview / edit mode, display an actionable diagnostic indicator
  return (
    <div
      data-dsk-unknown-node={node.id}
      style={{
        padding: '12px 16px',
        margin: '8px 0',
        backgroundColor: '#fffbeb',
        border: '1px dashed #f59e0b',
        borderRadius: '6px',
        color: '#b45309',
        fontSize: '13px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontWeight: 600 }}>Unregistered Component Type</div>
      <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.9 }}>
        Type: <code>{node.type}</code> | Node ID: <code>{node.id}</code>
      </div>
    </div>
  );
};
