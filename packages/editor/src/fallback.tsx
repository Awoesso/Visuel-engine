import React from 'react';
import type { ComponentNode } from '@dsk/core';

export const FallbackComponent: React.FC<{
  node?: ComponentNode;
  error?: Error;
}> = ({ node, error }) => (
  <div className="editor-render-error" role="alert">
    <strong>Impossible d’afficher ce composant</strong>
    <span>{node?.type ?? 'Composant inconnu'}</span>
    {error ? <span>{error.message}</span> : null}
  </div>
);
